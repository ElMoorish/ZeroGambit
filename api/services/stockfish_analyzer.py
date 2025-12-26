"""
Server-Side Stockfish Analysis Service
Uses python-chess UCI engine communication for reliable game analysis
"""

import asyncio
import io
import os
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import math

import chess
import chess.pgn
import chess.engine


@dataclass
class MoveAnalysis:
    """Analysis result for a single move"""
    ply: int
    move: str
    eval_before: Optional[int]  # Centipawn score before move
    eval_after: Optional[int]   # Centipawn score after move
    mate_before: Optional[int]  # Mate in X before (if applicable)
    mate_after: Optional[int]   # Mate in X after (if applicable)
    best_move: Optional[str]    # Engine's best move
    classification: str         # brilliant, great, best, good, inaccuracy, mistake, blunder
    pv: List[str]               # Principal variation


def cp_to_win_probability(cp: int) -> float:
    """Convert centipawn score to win probability (0-100)"""
    return 50 + 50 * (2 / (1 + math.exp(-0.004 * cp)) - 1)


def classify_move_by_cp_loss(
    cp_before: Optional[int],
    cp_after: Optional[int],
    is_white_to_move: bool,
    move_san: str,
    move_number: int
) -> str:
    """
    Classify move based on centipawn loss (chess.com/lichess standard).
    
    Args:
        cp_before: Centipawn evaluation before move
        cp_after: Centipawn evaluation after move
        is_white_to_move: True if white made the move
        move_san: Move in SAN notation
        move_number: Move number (1-indexed)
        
    Returns:
        Classification string
    """
    # Opening book (first 10 moves - both players)
    if move_number <= 10:
        return "book"
    
    # Handle missing evaluations
    if cp_before is None or cp_after is None:
        return "normal"
    
    # Calculate centipawn loss from player's perspective
    if is_white_to_move:
        cp_loss = cp_before - cp_after
    else:
        cp_loss = cp_after - cp_before
    
    # Exact best move (zero loss)
    if cp_loss == 0:
        return "best"
    
    # Material sacrifice check (simple heuristic)
    # True if we moved a piece to a square where it can be captured by a lower value piece
    # This is hard to do perfectly without board state, but let's make the text condition stricter
    # Brilliant: Must be a sacrifice (very low CP loss + specific move types)
    # For now, let's limit it to only PROMOTIONS or clearly tactical best moves
    if cp_loss <= 5 and ('=' in move_san): # Promotion is often brilliant if best
        return "brilliant"
        
    # Standard centipawn-based classification (Common chess.com-like bands)
    if cp_loss <= 5:
        return "great"      # < 5 cp loss
    elif cp_loss <= 15:
        return "excellent"  # < 15 cp loss
    elif cp_loss <= 30:
        return "good"       # < 30 cp loss
    elif cp_loss <= 70:
        return "inaccuracy" # < 70 cp loss
    elif cp_loss <= 200:
        return "mistake"    # < 200 cp loss
    else:
        return "blunder"    # > 200 cp loss


def classify_move(
    win_prob_before: float,
    win_prob_after: float,
    is_white_to_move: bool,
    cp_sacrifice: int = 0
) -> str:
    """
    DEPRECATED: Legacy classification based on win probability.
    Use classify_move_by_cp_loss instead.
    """
    # Adjust perspective: for black, we need to invert
    if is_white_to_move:
        delta = win_prob_after - win_prob_before
    else:
        delta = (100 - win_prob_after) - (100 - win_prob_before)
    
    # Check for brilliant (sacrifice leading to advantage)
    if cp_sacrifice > 100 and delta > 5:
        return "brilliant"
    
    # Classification based on win probability change
    if delta >= 5:
        return "great"
    elif delta >= -1:
        return "best"
    elif delta >= -3:
        return "good"
    elif delta >= -5:
        return "inaccuracy"
    elif delta >= -10:
        return "mistake"
    else:
        return "blunder"


class StockfishAnalyzer:
    """
    Server-side Stockfish analysis using python-chess UCI engine.
    """
    
    def __init__(self, stockfish_path: Optional[str] = None, depth: int = 18):
        """
        Initialize analyzer.
        
        Args:
            stockfish_path: Path to Stockfish binary. If None, tries common locations.
            depth: Analysis depth (higher = more accurate but slower)
        """
        self.stockfish_path = stockfish_path or self._find_stockfish()
        self.depth = depth
        self._engine = None
        self._transport = None
    
    def _find_stockfish(self) -> str:
        """Find Stockfish binary - checks env var first, then common locations"""
        # Check environment variable first
        env_path = os.getenv("STOCKFISH_PATH")
        if env_path:
            print(f"[Stockfish] Checking env STOCKFISH_PATH: {env_path}")
            if os.path.isfile(env_path):
                print(f"[Stockfish] Found via env var: {env_path}")
                return env_path
            else:
                print(f"[Stockfish] Env path does not exist: {env_path}")
        
        common_paths = [
            r"C:\stockfish\stockfish\stockfish-windows-x86-64-avx2.exe",  # Our download location
            r"C:\stockfish\stockfish-windows-x86-64-avx2.exe",
            r"C:\stockfish\stockfish.exe",  # Windows custom
            r"C:\Program Files\Stockfish\stockfish.exe",
            "stockfish",  # In PATH
            "stockfish.exe",  # Windows in PATH
            "/usr/bin/stockfish",  # Linux
            "/usr/local/bin/stockfish",  # macOS Homebrew
            "/opt/homebrew/bin/stockfish",  # macOS M1 Homebrew
        ]
        
        print(f"[Stockfish] Searching common paths...")
        for path in common_paths:
            if os.path.isfile(path):
                print(f"[Stockfish] Found at: {path}")
                return path
            else:
                print(f"[Stockfish] Not found: {path}")
        
        # Default to hoping it's in PATH
        print("[Stockfish] WARNING: No stockfish binary found, defaulting to 'stockfish'")
        return "stockfish"
    
    async def start(self):
        """Start the Stockfish engine"""
        if self._engine is not None:
            return
        
        print(f"[Stockfish] Attempting to start with path: {self.stockfish_path}")
        
        # Verify path exists before attempting
        if not os.path.isfile(self.stockfish_path) and self.stockfish_path not in ["stockfish", "stockfish.exe"]:
            raise RuntimeError(f"Stockfish binary not found at: {self.stockfish_path}")
        
        try:
            self._transport, self._engine = await chess.engine.popen_uci(
                self.stockfish_path
            )
            print(f"[Stockfish] Engine started successfully: {self.stockfish_path}")
        except FileNotFoundError as e:
            print(f"[Stockfish] Binary not found: {self.stockfish_path}")
            raise RuntimeError(f"Stockfish binary not found at: {self.stockfish_path}")
        except Exception as e:
            print(f"[Stockfish] Failed to start engine: {type(e).__name__}: {e}")
            raise RuntimeError(f"Could not start Stockfish at {self.stockfish_path}: {e}")
    
    async def stop(self):
        """Stop the Stockfish engine"""
        if self._engine is not None:
            await self._engine.quit()
            self._engine = None
            self._transport = None
            print("[Stockfish] Engine stopped")
    
    async def analyze_position(
        self, 
        board: chess.Board, 
        time_limit: float = 0.5
    ) -> Tuple[Optional[int], Optional[int], List[str]]:
        """
        Analyze a single position.
        
        Returns:
            Tuple of (centipawn_score, mate_in, principal_variation)
        """
        if self._engine is None:
            await self.start()
        
        try:
            info = await self._engine.analyse(
                board, 
                chess.engine.Limit(depth=self.depth, time=time_limit)
            )
            
            score = info.get("score")
            pv = info.get("pv", [])
            
            if score is None:
                return None, None, []
            
            # Get the score from White's perspective for consistency
            if score.is_mate():
                # For mate, score.white() handles it correctly (positive if White winning)
                return score.white().score(mate_score=10000), score.white().mate(), [m.uci() for m in pv]
            else:
                return score.white().score(mate_score=10000), None, [m.uci() for m in pv]
                
        except Exception as e:
            print(f"[Stockfish] Analysis error: {e}")
            return None, None, []
    
    async def analyze_game(
        self, 
        pgn: str, 
        time_per_move: float = 0.3,
        callback = None
    ) -> List[MoveAnalysis]:
        """
        Analyze all moves in a game.
        
        Args:
            pgn: PGN string of the game
            time_per_move: Time limit per position in seconds
            callback: Optional async callback(ply, total) for progress
            
        Returns:
            List of MoveAnalysis for each move
        """
        results: List[MoveAnalysis] = []
        
        # Parse PGN
        try:
            game = chess.pgn.read_game(io.StringIO(pgn))
            if game is None:
                print("[Stockfish] Failed to parse PGN")
                return results
        except Exception as e:
            print(f"[Stockfish] PGN parse error: {e}")
            return results
        
        # Start engine
        await self.start()
        
        board = game.board()
        moves = list(game.mainline_moves())
        total_moves = len(moves)
        
        # Analyze starting position
        prev_cp, prev_mate, _ = await self.analyze_position(board, time_per_move)
        prev_win_prob = cp_to_win_probability(prev_cp or 0)
        
        for ply, move in enumerate(moves, start=1):
            is_white_to_move = board.turn == chess.WHITE
            san = board.san(move)
            move_number = (ply + 1) // 2  # Convert ply to move number
            
            # Make the move
            board.push(move)
            
            # Analyze position after move
            cp, mate, pv = await self.analyze_position(board, time_per_move)
            
            # Calculate win probability after move (White's perspective)
            if mate is not None:
                # Mate found (mate > 0 is White winning, mate < 0 is Black winning)
                if mate > 0:
                    win_prob = 100
                else:
                    win_prob = 0
            else:
                win_prob = cp_to_win_probability(cp or 0)
            
            # Classify the move using centipawn loss
            classification = classify_move_by_cp_loss(
                prev_cp,
                cp,
                is_white_to_move,
                san,
                move_number
            )
            
            # Store result
            results.append(MoveAnalysis(
                ply=ply,
                move=san,
                eval_before=prev_cp,
                eval_after=cp,
                mate_before=prev_mate,
                mate_after=mate,
                best_move=pv[0] if pv else None,
                classification=classification,
                pv=pv[:5]  # First 5 moves of PV
            ))
            
            # Update for next iteration
            prev_cp = cp
            prev_mate = mate
            prev_win_prob = win_prob
            
            # Progress callback
            if callback:
                await callback(ply, total_moves)
        
        return results
    
    async def __aenter__(self):
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()


async def analyze_game_pgn(pgn: str, depth: int = 16) -> List[Dict[str, Any]]:
    """
    Convenience function to analyze a game PGN.
    
    Args:
        pgn: PGN string
        depth: Analysis depth
        
    Returns:
        List of move analysis dictionaries
    """
    analyzer = StockfishAnalyzer(depth=depth)
    
    try:
        results = await analyzer.analyze_game(pgn)
        return [
            {
                "ply": r.ply,
                "move": r.move,
                "eval_before": r.eval_before,
                "eval_after": r.eval_after,
                "mate_before": r.mate_before,
                "mate_after": r.mate_after,
                "best_move": r.best_move,
                "classification": r.classification,
                "pv": r.pv
            }
            for r in results
        ]
    finally:
        await analyzer.stop()
