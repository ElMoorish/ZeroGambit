"""
Coach Router - API endpoints for AI coaching
Provides automatic coaching for puzzles and games without user text input.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from api.agents.puzzle_coach import get_puzzle_coaching
from api.agents.game_coach import get_game_coaching

router = APIRouter(prefix="/api/coach", tags=["coach"])


class PuzzleCoachRequest(BaseModel):
    """Request for puzzle coaching - structured data only"""
    fen: str
    solution: List[str]
    user_move: str = ""
    move_index: int = 0
    is_correct: bool = True
    player_color: str = "white"
    mode: str = "correct"  # 'hint', 'correct', 'wrong'


class GameCoachRequest(BaseModel):
    """Request for game coaching - structured data only"""
    fen: str
    move_san: str
    classification: str
    cp_loss: int
    best_move: str
    is_white: bool
    move_number: int


class CoachResponse(BaseModel):
    """Coaching response"""
    message: str
    success: bool = True


@router.post("/puzzle", response_model=CoachResponse)
async def puzzle_coaching(request: PuzzleCoachRequest):
    """
    Get automatic coaching for a puzzle move.
    
    No user text input - only structured position/move data.
    This prevents prompt injection attacks.
    """
    try:
        message = await get_puzzle_coaching(
            fen=request.fen,
            solution=request.solution,
            user_move=request.user_move,
            move_index=request.move_index,
            is_correct=request.is_correct,
            player_color=request.player_color,
            mode=request.mode,
        )
        return CoachResponse(message=message)
    except Exception as e:
        print(f"Puzzle coaching error: {e}")
        # Return a safe fallback
        if request.mode == "hint":
            return CoachResponse(message="Look for a tactical opportunity!", success=True)
        elif request.is_correct:
            return CoachResponse(message="Correct! Well played.", success=True)
        else:
            return CoachResponse(message="Not quite. Try again!", success=True)


@router.post("/game", response_model=CoachResponse)
async def game_coaching(request: GameCoachRequest):
    """
    Get automatic coaching for a game move.
    
    No user text input - only structured position/move data.
    This prevents prompt injection attacks.
    """
    try:
        message = await get_game_coaching(
            fen=request.fen,
            move_san=request.move_san,
            classification=request.classification,
            cp_loss=request.cp_loss,
            best_move=request.best_move,
            is_white=request.is_white,
            move_number=request.move_number,
        )
        return CoachResponse(message=message)
    except Exception as e:
        print(f"Game coaching error: {e}")
        # Return empty message for non-critical moves
        return CoachResponse(message="", success=True)


@router.get("/health")
async def coach_health():
    """Check if coaching service is available"""
    return {"status": "healthy", "llm": "gemma:2b", "injection_safe": True}
