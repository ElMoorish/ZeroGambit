"""
Puzzle Router - API endpoints for puzzle training
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel

from ..services.puzzle_service import puzzle_service, Puzzle

router = APIRouter(prefix="/api/puzzles", tags=["puzzles"])


class PuzzleResponse(BaseModel):
    """Single puzzle response"""
    id: str
    fen: str
    moves: List[str]
    rating: int
    themes: List[str]
    phase: str


class PuzzleListResponse(BaseModel):
    """List of puzzles response"""
    puzzles: List[PuzzleResponse]
    phase: str
    total: int


class SolveRequest(BaseModel):
    """Request to check puzzle solution"""
    moves: List[str]


class SolveResponse(BaseModel):
    """Response for puzzle solve attempt"""
    correct: bool
    message: str


@router.get("/daily", response_model=Optional[PuzzleResponse])
async def get_daily_puzzle():
    """Get the daily puzzle from Lichess"""
    puzzle = await puzzle_service.get_daily_puzzle()
    if puzzle:
        return puzzle
    # Fallback to random puzzle
    return puzzle_service.get_random_puzzle()


@router.get("/random", response_model=PuzzleResponse)
async def get_random_puzzle(phase: Optional[str] = None):
    """Get a random puzzle, optionally filtered by phase"""
    return puzzle_service.get_random_puzzle(phase)


@router.get("/phase/{phase}", response_model=PuzzleListResponse)
async def get_puzzles_by_phase(phase: str, count: int = 10):
    """Get puzzles for a specific game phase (opening, middlegame, endgame)"""
    valid_phases = ["opening", "middlegame", "endgame"]
    if phase not in valid_phases:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid phase. Must be one of: {', '.join(valid_phases)}"
        )
    
    puzzles = await puzzle_service.get_puzzles_by_phase(phase, count)
    return PuzzleListResponse(
        puzzles=[PuzzleResponse(**p.model_dump()) for p in puzzles],
        phase=phase,
        total=len(puzzles)
    )


@router.get("/{puzzle_id}", response_model=Optional[PuzzleResponse])
async def get_puzzle_by_id(puzzle_id: str):
    """Get a specific puzzle by ID"""
    puzzle = await puzzle_service.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return puzzle


@router.post("/{puzzle_id}/solve", response_model=SolveResponse)
async def solve_puzzle(puzzle_id: str, request: SolveRequest):
    """Check if the submitted solution is correct"""
    # For built-in puzzles, check locally
    # Fetch puzzle (DB, Lichess, or Built-in)
    puzzle = await puzzle_service.get_puzzle_by_id(puzzle_id)
    
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
        
    correct_moves = puzzle.moves
    user_moves = request.moves
    
    # Check if user moves match solution
    if len(user_moves) >= len(correct_moves):
        if user_moves[:len(correct_moves)] == correct_moves:
            return SolveResponse(
                correct=True,
                message="Correct! Well done!"
            )
    
    # Partial credit - check first move
    if len(user_moves) > 0 and len(correct_moves) > 0:
        if user_moves[0] == correct_moves[0]:
            return SolveResponse(
                correct=False,
                message="Good start! Keep going..."
            )
    
    return SolveResponse(
        correct=False,
        message="That's not quite right. Try again!"
    )
