"""
Lichess API Service
Fetches games using NDJSON streaming
"""

import httpx
import asyncio
from datetime import datetime, timedelta
from typing import AsyncIterator, Dict, Any
import json
import os

from api.models.game import Platform, TimeClass, FetchGamesResponse
from api.database import get_games_collection

# API configuration
BASE_URL = "https://lichess.org/api"
ACCEPT_NDJSON = "application/x-ndjson"


async def fetch_lichess_games(
    username: str, 
    months: int = 3,
    token: str = None
) -> FetchGamesResponse:
    """
    Fetch games from Lichess using NDJSON streaming.
    Memory-efficient for large game histories.
    """
    games_fetched = 0
    games_new = 0
    collection = get_games_collection()
    
    # Calculate since timestamp (milliseconds)
    since = int((datetime.utcnow() - timedelta(days=months * 30)).timestamp() * 1000)
    
    headers = {
        "Accept": ACCEPT_NDJSON,
    }
    
    # Use provided token or fallback to environment variable
    if token is None:
        token = os.getenv("LICHESS_API_TOKEN")

    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    async with httpx.AsyncClient(
        headers=headers,
        timeout=60.0
    ) as client:
        url = f"{BASE_URL}/games/user/{username}"
        params = {
            "since": since,
            "max": 300,  # Limit per request
            "pgnInJson": True,
            "clocks": True,
            "evals": True,
            "opening": True,
        }
        
        try:
            async with client.stream("GET", url, params=params) as response:
                if response.status_code == 404:
                    return FetchGamesResponse(
                        username=username,
                        platform=Platform.LICHESS,
                        games_fetched=0,
                        games_new=0,
                        message=f"User '{username}' not found on Lichess"
                    )
                
                if response.status_code == 429:
                    # Rate limited - need to wait 60 seconds
                    return FetchGamesResponse(
                        username=username,
                        platform=Platform.LICHESS,
                        games_fetched=0,
                        games_new=0,
                        message="Rate limited by Lichess. Please try again in 60 seconds."
                    )
                
                response.raise_for_status()
                
                # Stream and process NDJSON
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    
                    try:
                        game_data = json.loads(line)
                        games_fetched += 1
                        
                        # Check if game exists
                        platform_id = f"lichess_{game_data.get('id')}"
                        
                        if collection is not None:
                            existing = await collection.find_one({"platform_id": platform_id})
                            if existing:
                                continue
                        
                        # Parse and store
                        parsed_game = _parse_lichess_game(game_data)
                        parsed_game["platform_id"] = platform_id
                        
                        if collection is not None:
                            await collection.insert_one(parsed_game)
                        games_new += 1
                        
                    except json.JSONDecodeError:
                        continue
        
        except httpx.HTTPStatusError as e:
            return FetchGamesResponse(
                username=username,
                platform=Platform.LICHESS,
                games_fetched=games_fetched,
                games_new=games_new,
                message=f"Error fetching games: {str(e)}"
            )
    
    return FetchGamesResponse(
        username=username,
        platform=Platform.LICHESS,
        games_fetched=games_fetched,
        games_new=games_new,
        message=f"Successfully fetched {games_fetched} games, {games_new} new"
    )


def _parse_lichess_game(game_data: Dict[str, Any]) -> Dict[str, Any]:
    """Parse Lichess game JSON into our schema"""
    players = game_data.get("players", {})
    white_data = players.get("white", {})
    black_data = players.get("black", {})
    
    # Determine result
    winner = game_data.get("winner")
    if winner == "white":
        result = "1-0"
    elif winner == "black":
        result = "0-1"
    else:
        result = "1/2-1/2"
    
    # Parse time class from speed
    speed_map = {
        "ultraBullet": TimeClass.BULLET,
        "bullet": TimeClass.BULLET,
        "blitz": TimeClass.BLITZ,
        "rapid": TimeClass.RAPID,
        "classical": TimeClass.CLASSICAL,
        "correspondence": TimeClass.CORRESPONDENCE,
    }
    speed = game_data.get("speed", "blitz")
    time_class = speed_map.get(speed, TimeClass.BLITZ)
    
    # Get opening info
    opening = game_data.get("opening", {})
    
    # Build PGN if not provided
    pgn = game_data.get("pgn", "")
    if not pgn and "moves" in game_data:
        pgn = game_data["moves"]
    
    return {
        "platform": Platform.LICHESS.value,
        "white": {
            "username": white_data.get("user", {}).get("name", "Anonymous"),
            "rating": white_data.get("rating"),
            "rating_diff": white_data.get("ratingDiff")
        },
        "black": {
            "username": black_data.get("user", {}).get("name", "Anonymous"),
            "rating": black_data.get("rating"),
            "rating_diff": black_data.get("ratingDiff")
        },
        "result": result,
        "pgn": pgn,
        "eco": opening.get("eco"),
        "opening_name": opening.get("name"),
        "time_control": str(game_data.get("clock", {}).get("initial", 0)),
        "time_class": time_class.value,
        "date": datetime.fromtimestamp(game_data.get("createdAt", 0) / 1000),
        "url": f"https://lichess.org/{game_data.get('id')}",
        "analysis_status": "pending",
        "moves": [],
        "created_at": datetime.utcnow()
    }
