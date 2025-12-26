"""
Games Router - API endpoints for game management
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime

from api.models.game import (
    Game,
    GameListResponse,
    FetchGamesRequest,
    FetchGamesResponse,
    Platform
)
from api.services.chesscom import fetch_chesscom_games
from api.services.lichess import fetch_lichess_games
from api.database import get_games_collection

router = APIRouter()


@router.post("/fetch/{platform}/{username}", response_model=FetchGamesResponse)
async def fetch_games(
    platform: Platform,
    username: str,
    months: int = Query(default=3, ge=1, le=24, description="Months of history to fetch")
):
    """
    Fetch games for a user from Chess.com or Lichess.
    Implements rate limiting and stores games in database.
    """
    try:
        if platform == Platform.CHESSCOM:
            result = await fetch_chesscom_games(username, months)
        else:
            result = await fetch_lichess_games(username, months)
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch games: {str(e)}"
        )


@router.get("/games", response_model=GameListResponse)
async def list_games(
    username: Optional[str] = None,
    platform: Optional[Platform] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100)
):
    """
    List games with optional filtering.
    """
    collection = get_games_collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Build query
    query = {}
    if username:
        query["$or"] = [
            {"white.username": {"$regex": username, "$options": "i"}},
            {"black.username": {"$regex": username, "$options": "i"}}
        ]
    if platform:
        query["platform"] = platform.value
    
    # Get total count
    total = await collection.count_documents(query)
    
    # Get paginated results
    skip = (page - 1) * per_page
    cursor = collection.find(query).sort("date", -1).skip(skip).limit(per_page)
    games = await cursor.to_list(length=per_page)
    
    # Convert ObjectId to string
    for game in games:
        game["_id"] = str(game["_id"])
    
    return GameListResponse(
        games=games,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/games/{game_id}")
async def get_game(game_id: str):
    """
    Get a single game by ID.
    """
    collection = get_games_collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from bson import ObjectId
    
    try:
        game = await collection.find_one({"_id": ObjectId(game_id)})
    except:
        # Try finding by platform_id
        game = await collection.find_one({"platform_id": game_id})
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game["_id"] = str(game["_id"])
    return game


@router.post("/games/{game_id}/analyze")
async def analyze_game(game_id: str):
    """
    Queue a game for analysis.
    In production, this would add to a task queue.
    """
    collection = get_games_collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from bson import ObjectId
    from api.services.analysis import analyze_game_moves
    
    try:
        game = await collection.find_one({"_id": ObjectId(game_id)})
    except:
        game = await collection.find_one({"platform_id": game_id})
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Update status to analyzing
    await collection.update_one(
        {"_id": game["_id"]},
        {"$set": {"analysis_status": "analyzing"}}
    )
    
    try:
        # Run analysis
        analysis_result = await analyze_game_moves(game["pgn"])
        
        # Update game with analysis
        await collection.update_one(
            {"_id": game["_id"]},
            {
                "$set": {
                    "moves": analysis_result["moves"],
                    "white_accuracy": analysis_result["white_accuracy"],
                    "black_accuracy": analysis_result["black_accuracy"],
                    "analysis_status": "completed",
                    "analyzed_at": datetime.utcnow()
                }
            }
        )
        
        return {"status": "completed", "game_id": str(game["_id"])}
    
    except Exception as e:
        await collection.update_one(
            {"_id": game["_id"]},
            {"$set": {"analysis_status": "failed"}}
        )
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
