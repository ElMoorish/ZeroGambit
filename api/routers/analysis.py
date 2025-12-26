"""
Analysis API Router
Endpoints for triggering and retrieving game analysis with AI coaching
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from bson import ObjectId

from api.database import get_games_collection
from api.services.stockfish_analyzer import StockfishAnalyzer, analyze_game_pgn
from api.services.ai_coach import (
    get_opening_summary,
    get_move_commentary,
    get_key_insight,
    get_lesson,
    generate_game_summary
)

router = APIRouter(prefix="/api", tags=["analysis"])


class AnalysisRequest(BaseModel):
    depth: int = 16
    

class AnalysisResponse(BaseModel):
    status: str
    message: str
    moves_analyzed: int = 0
    

class MoveAnalysisResult(BaseModel):
    ply: int
    move: str
    eval_before: Optional[int] = None
    eval_after: Optional[int] = None
    mate_before: Optional[int] = None
    mate_after: Optional[int] = None
    best_move: Optional[str] = None
    classification: str
    pv: List[str] = []


# Classification labels in French
CLASSIFICATION_LABELS = {
    "brilliant": "Brillant",
    "great": "Excellent",
    "best": "Meilleur",
    "good": "Bon",
    "book": "Théorie",
    "inaccuracy": "Imprécision",
    "mistake": "Erreur",
    "blunder": "Gaffe"
}


async def run_analysis_task(game_id: str, depth: int = 16):
    """
    Background task to run Stockfish analysis on a game.
    Updates the game document with analysis results and AI insights.
    """
    collection = get_games_collection()
    if collection is None:
        print(f"[Analysis] No database connection")
        return
    
    try:
        # Fetch game
        game = await collection.find_one({"_id": ObjectId(game_id)})
        if not game:
            print(f"[Analysis] Game {game_id} not found")
            return
        
        pgn = game.get("pgn", "")
        if not pgn:
            print(f"[Analysis] Game {game_id} has no PGN")
            return
        
        # Update status to analyzing
        await collection.update_one(
            {"_id": ObjectId(game_id)},
            {"$set": {"analysis_status": "analyzing"}}
        )
        
        # Run analysis
        print(f"[Analysis] Starting analysis for game {game_id}")
        results = await analyze_game_pgn(pgn, depth=depth)
        
        # Calculate statistics for AI insights
        total_moves = len(results)
        blunders = [r for r in results if r.get("classification") == "blunder"]
        mistakes = [r for r in results if r.get("classification") == "mistake"]
        inaccuracies = [r for r in results if r.get("classification") == "inaccuracy"]
        
        # Calculate precision per player
        white_moves = [r for r in results if r["ply"] % 2 == 1]
        black_moves = [r for r in results if r["ply"] % 2 == 0]
        
        def calc_precision(moves):
            if not moves:
                return 0
            good_moves = [m for m in moves if m.get("classification") in 
                         ["brilliant", "great", "best", "excellent", "good", "book"]]
            return round((len(good_moves) / len(moves)) * 100)
        
        white_precision = calc_precision(white_moves)
        black_precision = calc_precision(black_moves)
        
        # Top critical moments (sorted by CP loss)
        critical_moments = []
        for r in results:
            if r.get("classification") in ["blunder", "mistake"]:
                cp_before = r.get("eval_before", 0) or 0
                cp_after = r.get("eval_after", 0) or 0
                is_white = r["ply"] % 2 == 1
                cp_loss = abs((cp_before - cp_after) if is_white else (cp_after - cp_before))
                critical_moments.append({
                    "move": (r["ply"] + 1) // 2,
                    "played": r["move"],
                    "cp_loss": cp_loss
                })
        critical_moments.sort(key=lambda x: x["cp_loss"], reverse=True)
        
        # Calculate average blunder CP loss
        avg_blunder_cp = 0
        if blunders:
            total_cp_loss = 0
            for b in blunders:
                cp_before = b.get("eval_before", 0) or 0
                cp_after = b.get("eval_after", 0) or 0
                is_white = b["ply"] % 2 == 1
                cp_loss = abs((cp_before - cp_after) if is_white else (cp_after - cp_before))
                total_cp_loss += cp_loss
            avg_blunder_cp = total_cp_loss / len(blunders)
        
        stats = {
            "total_moves": total_moves,
            "blunders": len(blunders),
            "mistakes": len(mistakes),
            "inaccuracies": len(inaccuracies),
            "avg_blunder_cp": avg_blunder_cp,
            "white_precision": white_precision,
            "black_precision": black_precision,
            "top_critical": critical_moments[:3]
        }
        
        # Generate AI insights
        try:
            from api.services.ollama_service import ollama_service
            import asyncio
            
            opening_name = game.get("opening_name", "Unknown Opening")
            
            opening_summary, insights, lesson = await asyncio.gather(
                ollama_service.get_opening_summary(opening_name),
                ollama_service.get_key_insights(stats),
                ollama_service.get_lesson(opening_name, ""),
                return_exceptions=True
            )
            
            # Handle exceptions
            if isinstance(opening_summary, Exception):
                opening_summary = ""
            if isinstance(insights, Exception):
                insights = ""
            if isinstance(lesson, Exception):
                lesson = ""
                
        except Exception as e:
            print(f"[Analysis] AI insights generation failed: {e}")
            opening_summary = ""
            insights = ""
            lesson = ""
        
        # Generate coach messages for significant moves
        coach_messages = []
        for move_result in results:
            classification = move_result["classification"]
            ply = move_result["ply"]
            san = move_result["move"]
            best_move = move_result.get("best_move", "")
            
            if classification == "blunder":
                coach_messages.append({
                    "id": f"msg-{ply}",
                    "ply": ply,
                    "type": "warning",
                    "title": f"{CLASSIFICATION_LABELS['blunder']}!",
                    "message": f"{san} était une erreur grave. L'évaluation a chuté significativement.",
                    "move": san,
                    "bestMove": best_move
                })
            elif classification == "mistake":
                coach_messages.append({
                    "id": f"msg-{ply}",
                    "ply": ply,
                    "type": "warning",
                    "title": CLASSIFICATION_LABELS["mistake"],
                    "message": f"{san} a perdu de l'avantage. Considérez l'alternative suggérée.",
                    "move": san,
                    "bestMove": best_move
                })
            elif classification in ["brilliant", "great"]:
                coach_messages.append({
                    "id": f"msg-{ply}",
                    "ply": ply,
                    "type": "praise",
                    "title": f"{CLASSIFICATION_LABELS[classification]}!",
                    "message": f"Excellent coup avec {san}!",
                    "move": san
                })
        
        # Update game with results
        await collection.update_one(
            {"_id": ObjectId(game_id)},
            {
                "$set": {
                    "analysis_status": "complete",
                    "analysis_results": results,
                    "coach_messages": coach_messages,
                    "moves": results,  # For backward compatibility
                    "ai_insights": {
                        "opening_summary": opening_summary,
                        "key_insights": insights,
                        "lesson": lesson
                    },
                    "statistics": stats
                }
            }
        )
        
        print(f"[Analysis] Completed analysis for game {game_id}: {len(results)} moves")
        print(f"[Analysis] Stats - White: {white_precision}%, Black: {black_precision}%, Blunders: {len(blunders)}")
        
    except Exception as e:
        print(f"[Analysis] Error analyzing game {game_id}: {e}")
        import traceback
        traceback.print_exc()
        if collection is not None:
            await collection.update_one(
                {"_id": ObjectId(game_id)},
                {"$set": {"analysis_status": "error", "analysis_error": str(e)}}
            )


@router.post("/analyze/{game_id}", response_model=AnalysisResponse)
async def trigger_analysis(
    game_id: str, 
    background_tasks: BackgroundTasks,
    request: AnalysisRequest = AnalysisRequest()
):
    """
    Trigger server-side Stockfish analysis for a game.
    Analysis runs in the background.
    """
    collection = get_games_collection()
    
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Verify game exists
    try:
        game = await collection.find_one({"_id": ObjectId(game_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid game ID format")
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check if already analyzing
    if game.get("analysis_status") == "analyzing":
        return AnalysisResponse(
            status="in_progress",
            message="Analysis is already in progress"
        )
    
    # Queue background analysis task
    background_tasks.add_task(run_analysis_task, game_id, request.depth)
    
    return AnalysisResponse(
        status="started",
        message="Analysis has been queued"
    )


@router.get("/analysis/{game_id}")
async def get_analysis_status(game_id: str):
    """Get the analysis status and results for a game."""
    collection = get_games_collection()
    
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        game = await collection.find_one({"_id": ObjectId(game_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid game ID format")
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return {
        "status": game.get("analysis_status", "pending"),
        "results": game.get("analysis_results", []),
        "coach_messages": game.get("coach_messages", []),
        "ai_insights": game.get("ai_insights", {}),
        "error": game.get("analysis_error")
    }


# ============= AI Coach Endpoints =============

class OpeningRequest(BaseModel):
    opening_name: str


class InsightRequest(BaseModel):
    pgn: str
    evaluations: List[Dict[str, Any]]


class LessonRequest(BaseModel):
    opening_name: Optional[str] = None
    pgn: str
    key_insights: str


@router.post("/coach/opening")
async def get_opening_info(request: OpeningRequest):
    """Get AI-generated opening summary - TTS ready"""
    summary = get_opening_summary(request.opening_name)
    return {
        "opening": request.opening_name,
        "summary": summary,
        "tts_ready": True
    }


@router.post("/coach/insights")
async def get_game_insights(request: InsightRequest):
    """Get AI-generated key insights from game - TTS ready"""
    insights = get_key_insight(request.pgn, request.evaluations)
    return {
        "insights": insights,
        "tts_ready": True
    }


@router.post("/coach/lesson")
async def get_game_lesson(request: LessonRequest):
    """Get AI-generated lesson from game - TTS ready"""
    lesson = get_lesson(
        request.opening_name or "Unknown Opening",
        request.pgn,
        request.key_insights
    )
    return {
        "lesson": lesson,
        "tts_ready": True
    }


@router.post("/coach/commentary")
async def get_coach_commentary(
    move_san: str,
    classification: str,
    evaluation: float = 0,
    best_move: Optional[str] = None,
    move_number: int = 1,
    is_white: bool = True
):
    """Get AI-generated commentary for a specific move - TTS ready"""
    commentary = get_move_commentary(
        move_san=move_san,
        classification=classification,
        evaluation=evaluation,
        best_move=best_move,
        move_number=move_number,
        is_white=is_white
    )
    return {
        "move": move_san,
        "commentary": commentary,
        "tts_ready": True
    }

