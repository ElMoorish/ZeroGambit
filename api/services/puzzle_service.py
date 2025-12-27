"""
Puzzle Service - Fetches puzzles from DynamoDB / Lichess API
Supports multiple sources: Lichess, tactical, mate, endgame puzzles
"""

import httpx
from typing import Optional, List
from pydantic import BaseModel
import random
import chess
import os
from ..database import get_puzzles_collection


# Theme to phase mapping for inferring puzzle phase from themes
OPENING_THEMES = {'opening', 'gambit', 'siciliandefense', 'italianopening', 'spanishopening', 
                  'frenchdefense', 'carokann', 'queensgambit', 'ruylopez', 'londonSystem',
                  'kingsgambit', 'scotchGame', 'viennaGame'}
ENDGAME_THEMES = {'endgame', 'rookendgame', 'pawnendgame', 'bishopendgame', 'knightendgame',
                  'queenendgame', 'queenrookendgame', 'basicendgame', 'rookvsbishop', 
                  'rookvsknight', 'bishopvsknight', 'oppositebishops'}


def infer_phase_from_themes(themes: List[str]) -> str:
    """Infer puzzle phase from its themes"""
    themes_lower = {t.lower() for t in themes}
    
    # Check for explicit opening themes
    if themes_lower & OPENING_THEMES:
        return "opening"
    
    # Check for explicit endgame themes
    if themes_lower & ENDGAME_THEMES:
        return "endgame"
    
    # Default to middlegame
    return "middlegame"

# Try to import DynamoDB service
try:
    from .dynamodb_service import get_dynamodb_puzzle_service, DynamoDBPuzzleService
    DYNAMODB_ENABLED = os.getenv("AWS_ACCESS_KEY_ID") is not None
except ImportError:
    DYNAMODB_ENABLED = False
    DynamoDBPuzzleService = None

# Lichess puzzle themes mapped to game phases
# Lichess puzzle themes mapped to game phases - STRICT MAPPING
PHASE_THEMES = {
    "opening": ["opening", "attackingF2F7"],  # Removed generic themes like hangingPiece
    "middlegame": ["middlegame", "fork", "pin", "skewer", "discoveredAttack", 
                   "sacrifice", "attraction", "deflection", "doubleCheck",
                   "interference", "xRayAttack", "zugzwang"],
    "endgame": ["endgame", "pawnEndgame", "rookEndgame", "queenEndgame", 
                "bishopEndgame", "knightEndgame", "queenRookEndgame"]
}

# Built-in puzzles as fallback (with correct FEN positions)
BUILT_IN_PUZZLES = {
    "opening": [
        {
            "id": "opening_001",
            "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
            "moves": ["h5f7"],
            "rating": 800,
            "themes": ["opening", "mateIn1", "sacrifice"],
            "phase": "opening"
        },
        {
            "id": "opening_002", 
            "fen": "rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 2 3",
            "moves": ["h5f7"],
            "rating": 600,
            "themes": ["opening", "mateIn1"],
            "phase": "opening"
        },
    ],
    "middlegame": [
        {
            "id": "middle_001",
            "fen": "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
            "moves": ["b5c6"],
            "rating": 1000,
            "themes": ["middlegame", "fork", "pin"],
            "phase": "middlegame"
        },
        {
            "id": "hard_001",
            "fen": "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 w - - 6 5",
            "moves": ["f3e5", "c6e5", "d2d4", "e5c4", "d4c5"],
            "rating": 1500,
            "themes": ["middlegame", "opening", "fork"],
            "phase": "middlegame"
        },
        {
            "id": "hard_002",
            "fen": "r4rk1/1pp2ppp/p1np1q2/2b1p3/2B1P1b1/2PP1N2/PP3PPP/R1BQ1RK1 w - - 0 10",
            "moves": ["c1e3", "g4f3", "d1f3", "f6f3", "g2f3"],
            "rating": 1600,
            "themes": ["middlegame", "advantage"],
            "phase": "middlegame"
        },
        {
            "id": "hard_003_mate",
            "fen": "r1b2rk1/pp1p1ppp/2n1p3/q7/2P5/P1PB4/3Q1PPP/R3K1NR w KQ - 1 12",
            "moves": ["d3h7", "g8h7", "d2d3", "h7g8", "d3h3"],
            "rating": 1800,
            "themes": ["middlegame", "sacrifice", "mateIn3"],
            "phase": "middlegame"
        },
    ],
    "endgame": [
        {
            "id": "end_001",
            "fen": "8/8/8/8/8/5K2/6R1/7k w - - 0 1",
            "moves": ["g2g1"],
            "rating": 800,
            "themes": ["endgame", "rookEndgame", "mateIn1"],
            "phase": "endgame"
        },
        {
            "id": "end_002",
            "fen": "8/8/8/8/8/1K6/8/1Q4k1 w - - 0 1",
            "moves": ["b3c3", "g1f1", "b1b2"],
            "rating": 900,
            "themes": ["endgame", "queenEndgame", "mateIn2"],
            "phase": "endgame"
        },
    ]
}


class Puzzle(BaseModel):
    id: str
    fen: str
    moves: List[str]  # Solution moves in UCI format
    rating: int
    themes: List[str]
    phase: str


class PuzzleService:
    """Service for fetching chess puzzles from Lichess or local cache"""
    
    LICHESS_API = "https://lichess.org/api"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)
    
    def _pgn_to_fen(self, pgn: str, initial_ply: int) -> str:
        """Convert PGN moves up to initial_ply to FEN position"""
        try:
            board = chess.Board()
            moves = pgn.split()
            
            # Play moves up to initial_ply (each ply is half-move)
            for i, move_san in enumerate(moves):
                if i >= initial_ply:
                    break
                # Skip move numbers like "1.", "2.", etc.
                if '.' in move_san:
                    continue
                try:
                    board.push_san(move_san)
                except:
                    continue
            
            return board.fen()
        except Exception as e:
            print(f"Error converting PGN to FEN: {e}")
            return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    
    async def get_daily_puzzle(self) -> Optional[Puzzle]:
        """Get the daily puzzle from Lichess"""
        try:
            response = await self.client.get(f"{self.LICHESS_API}/puzzle/daily")
            if response.status_code == 200:
                data = response.json()
                puzzle = data.get("puzzle", {})
                game = data.get("game", {})
                
                # Get FEN from PGN + initialPly
                pgn = game.get("pgn", "")
                initial_ply = puzzle.get("initialPly", 0)
                fen = self._pgn_to_fen(pgn, initial_ply)
                
                themes = puzzle.get("themes", [])
                phase = self._determine_phase(themes)
                
                return Puzzle(
                    id=puzzle.get("id", "daily"),
                    fen=fen,
                    moves=puzzle.get("solution", []),
                    rating=puzzle.get("rating", 1500),
                    themes=themes,
                    phase=phase
                )
        except Exception as e:
            print(f"Error fetching daily puzzle: {e}")
        return None
    
    async def get_puzzle_by_id(self, puzzle_id: str) -> Optional[Puzzle]:
        """Get a specific puzzle by ID from DB or Lichess"""
        # Try DB first
        collection = get_puzzles_collection()
        if collection is not None:
            doc = await collection.find_one({"id": puzzle_id})
            if doc:
                return Puzzle(**doc)

        # Fallback to Lichess API
        try:
            response = await self.client.get(f"{self.LICHESS_API}/puzzle/{puzzle_id}")
            if response.status_code == 200:
                data = response.json()
                puzzle = data.get("puzzle", {})
                game = data.get("game", {})
                
                # Get FEN from PGN + initialPly
                pgn = game.get("pgn", "")
                initial_ply = puzzle.get("initialPly", 0)
                fen = self._pgn_to_fen(pgn, initial_ply)
                
                themes = puzzle.get("themes", [])
                phase = self._determine_phase(themes)
                
                return Puzzle(
                    id=puzzle.get("id", puzzle_id),
                    fen=fen,
                    moves=puzzle.get("solution", []),
                    rating=puzzle.get("rating", 1500),
                    themes=themes,
                    phase=phase
                )
        except Exception as e:
            print(f"Error fetching puzzle {puzzle_id}: {e}")
            
        # Fallback to built-in
        for phase_puzzles in BUILT_IN_PUZZLES.values():
            for p in phase_puzzles:
                if p["id"] == puzzle_id:
                     return Puzzle(**p)
                     
        return None
    
    async def get_puzzles_by_phase(self, phase: str, count: int = 10) -> List[Puzzle]:
        """Get puzzles for a specific game phase from DynamoDB, MongoDB, or built-in"""
        puzzles = []
        
        # Try DynamoDB first (fastest)
        if DYNAMODB_ENABLED:
            try:
                dynamo_service = get_dynamodb_puzzle_service()
                dynamo_puzzles = dynamo_service.get_puzzles_by_phase(phase, count)
                for p in dynamo_puzzles:
                    puzzles.append(Puzzle(
                        id=p.get("puzzle_id", p.get("id", "unknown")),
                        fen=p.get("fen", ""),
                        moves=p.get("moves", []),
                        rating=p.get("rating", 1200),
                        themes=p.get("themes", "").split(",") if isinstance(p.get("themes"), str) else p.get("themes", []),
                        phase=p.get("phase", phase)
                    ))
                if puzzles:
                    return puzzles
            except Exception as e:
                print(f"DynamoDB error: {e}")
        
        # Try MongoDB as fallback
        collection = get_puzzles_collection()
        if collection is not None:
            try:
                pipeline = [
                    {"$match": {"phase": phase}},
                    {"$sample": {"size": count}}
                ]
                async for doc in collection.aggregate(pipeline):
                    if "_id" in doc: del doc["_id"]
                    puzzles.append(Puzzle(**doc))
            except Exception as e:
                print(f"Error fetching puzzles from MongoDB: {e}")
        
        if puzzles:
            return puzzles

        # Fallback to built-in
        if phase not in BUILT_IN_PUZZLES:
            phase = "middlegame"
        
        builtin = BUILT_IN_PUZZLES[phase]
        selected = random.sample(builtin, min(count, len(builtin)))
        
        return [Puzzle(**p) for p in selected]
    
    async def get_curriculum_puzzles(
        self, 
        min_rating: int = 400, 
        max_rating: int = 2000,
        themes: List[str] = [],
        count: int = 50
    ) -> List[Puzzle]:
        """Get puzzles filtered by rating range and themes for curriculum training"""
        puzzles = []
        
        # Try DynamoDB first (fastest)
        if DYNAMODB_ENABLED:
            try:
                dynamo_service = get_dynamodb_puzzle_service()
                dynamo_puzzles = dynamo_service.get_curriculum_puzzles(
                    min_rating=min_rating,
                    max_rating=max_rating,
                    themes=themes if themes else None,
                    count=count
                )
                for p in dynamo_puzzles:
                    theme_list = p.get("themes", "")
                    if isinstance(theme_list, str):
                        theme_list = theme_list.split(",")
                    puzzles.append(Puzzle(
                        id=p.get("puzzle_id", p.get("id", "unknown")),
                        fen=p.get("fen", ""),
                        moves=p.get("moves", []),
                        rating=p.get("rating", 1200),
                        themes=theme_list,
                        phase=p.get("phase", "middlegame")
                    ))
                if puzzles:
                    return puzzles
            except Exception as e:
                print(f"DynamoDB curriculum error: {e}")
        
        # Fallback to MongoDB
        from api.database import get_db
        db = get_db()
        if db is not None:
            try:
                query = {
                    "rating": {"$gte": min_rating, "$lte": max_rating}
                }
                if themes:
                    query["themes"] = {"$in": themes}
                
                cursor = db.puzzles.find(query).limit(count)
                async for doc in cursor:
                    puzzles.append(Puzzle(
                        id=doc.get("id", str(doc.get("_id"))),
                        fen=doc["fen"],
                        moves=doc["moves"],
                        rating=doc["rating"],
                        themes=doc.get("themes", []),
                        phase=doc.get("phase", "middlegame")
                    ))
                
                if puzzles:
                    return puzzles
            except Exception as e:
                print(f"Error fetching curriculum puzzles from MongoDB: {e}")
        
        # Fallback to built-in puzzles
        all_puzzles = []
        for phase_puzzles in BUILT_IN_PUZZLES.values():
            for p in phase_puzzles:
                if min_rating <= p.get("rating", 1000) <= max_rating:
                    if not themes or any(t in p.get("themes", []) for t in themes):
                        all_puzzles.append(p)
        
        selected = random.sample(all_puzzles, min(count, len(all_puzzles)))
        return [Puzzle(**p) for p in selected]
    
    async def get_library_puzzles(
        self, 
        min_rating: int = 400, 
        max_rating: int = 3000,
        themes: List[str] = [],
        source: Optional[str] = None,
        count: int = 50
    ) -> List[Puzzle]:
        """Get puzzles for the library with source and theme filtering"""
        puzzles = []
        
        # Try DynamoDB first
        if DYNAMODB_ENABLED:
            try:
                dynamo_service = get_dynamodb_puzzle_service()
                
                # If themes are requested, we might want to prioritize theme search
                # But if source is requested, we might want that.
                # For now, we use the rating-bucket approach which supports 'source' filtering in the service
                
                 # If themes present, we might need a combined approach or just filter in memory
                dynamo_puzzles = dynamo_service.get_puzzles_by_rating_range(
                    min_rating=min_rating,
                    max_rating=max_rating,
                    source=source, # Pass source to dynamo service
                    themes=themes, # Pass themes to dynamo service for direct filtering
                    count=count * 2 # converting to Puzzle object filters further, so fetch more
                )
                
                # Filter by themes if provided
                for p in dynamo_puzzles:
                    puzzle_themes = p.get("themes", "")
                    if isinstance(puzzle_themes, str):
                        puzzle_themes_list = puzzle_themes.split(",")
                    else:
                        puzzle_themes_list = puzzle_themes
                        
                    # Theme filter logic
                    if themes:
                        # loose match: at least one theme
                         if not any(t.lower() in [pt.lower() for pt in puzzle_themes_list] for t in themes):
                             continue
                    
                    # Infer phase from themes if not set in DynamoDB
                    puzzle_phase = p.get("phase")
                    if not puzzle_phase:
                        puzzle_phase = infer_phase_from_themes(puzzle_themes_list)
                    
                    puzzles.append(Puzzle(
                        id=p.get("puzzle_id", p.get("id", "unknown")),
                        fen=p.get("fen", ""),
                        moves=p.get("moves", []),
                        rating=p.get("rating", 1200),
                        themes=puzzle_themes_list,
                        phase=puzzle_phase
                    ))
                
                # If we got enough, return
                if len(puzzles) >= count:
                    return puzzles[:count]
                    
            except Exception as e:
                print(f"DynamoDB library error: {e}")
        
        # Fallback to general curriculum logic (which covers MongoDB/Built-in)
        # Note: general fallback doesn't support 'source' well yet, but that's acceptable for fallback
        fallback_puzzles = await self.get_curriculum_puzzles(min_rating, max_rating, themes, count)
        
        # Merge if we have some from dynamo
        return (puzzles + fallback_puzzles)[:count]
    
    async def get_random_puzzle(self, phase: Optional[str] = None) -> Puzzle:
        """Get a random puzzle, optionally filtered by phase"""
        # Try DynamoDB first
        if DYNAMODB_ENABLED:
            try:
                dynamo_service = get_dynamodb_puzzle_service()
                # If phase is provided, we can use get_puzzles_by_phase and pick one
                if phase:
                    puzzles = dynamo_service.get_puzzles_by_phase(phase, count=5)
                    if puzzles:
                        p = random.choice(puzzles)
                        return Puzzle(
                            id=p.get("puzzle_id", p.get("id", "unknown")),
                            fen=p.get("fen", ""),
                            moves=p.get("moves", []),
                            rating=p.get("rating", 1200),
                            themes=p.get("themes", "").split(",") if isinstance(p.get("themes"), str) else p.get("themes", []),
                            phase=p.get("phase", phase)
                        )
                else:
                    # Random from any phase
                    p = dynamo_service.get_random_puzzle()
                    if p:
                         return Puzzle(
                            id=p.get("puzzle_id", p.get("id", "unknown")),
                            fen=p.get("fen", ""),
                            moves=p.get("moves", []),
                            rating=p.get("rating", 1200),
                            themes=p.get("themes", "").split(",") if isinstance(p.get("themes"), str) else p.get("themes", []),
                            phase=p.get("phase", "middlegame")
                        )
            except Exception as e:
                print(f"DynamoDB random puzzle error: {e}")

        if phase:
            phase = phase.lower()

        if phase and phase in BUILT_IN_PUZZLES:
            puzzles = BUILT_IN_PUZZLES[phase]
        else:
            # Combine all puzzles
            puzzles = []
            for phase_puzzles in BUILT_IN_PUZZLES.values():
                puzzles.extend(phase_puzzles)
        
        # Prioritize complex puzzles (moves >= 5) as requested
        complex_puzzles = [p for p in puzzles if len(p.get("moves", [])) >= 5]
        
        if complex_puzzles:
            selected = random.choice(complex_puzzles)
        else:
            selected = random.choice(puzzles)
            
        return Puzzle(**selected)
    
    def _determine_phase(self, themes: List[str]) -> str:
        """Determine game phase from puzzle themes with strict priority"""
        themes_set = {t.lower() for t in themes}
        
        # 1. Explicit Phase Tags (Prioritize Endgame/Opening over Middlegame)
        if "endgame" in themes_set:
            return "endgame"
        if "opening" in themes_set:
            return "opening"
        if "middlegame" in themes_set:
            return "middlegame"
            
        # 2. Key Theme Inference
        # Check specific Openings (e.g. "sicilianDefense")
        for t in themes_set:
            if "opening" in t or "defense" in t or "gambit" in t or "game" in t:
                # Heuristic: if it sounds like an opening name
                 if any(k in t for k in ["indian", "caro", "french", "sicilian", "slav", "scandi", "scotch", "vienna"]):
                     return "opening"

        # Check explicit endgame types if 'endgame' tag missing
        if any("endgame" in t for t in themes_set):
            return "endgame"

        # 3. Fallback to Theme Mapping
        for phase, phase_themes in PHASE_THEMES.items():
            if any(theme in phase_themes for theme in themes):
                return phase
                
        return "middlegame"  # Default


# Singleton instance
puzzle_service = PuzzleService()
