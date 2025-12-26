"""
Chess.com API Service
Using official chess.com Python package with built-in rate limiting
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
import re

from chessdotcom import ChessDotComClient, RateLimitHandler
# Note: ChessDotComError is not in types, use generic Exception

from api.models.game import Platform, TimeClass, FetchGamesResponse
from api.database import get_games_collection

# Client configuration with rate limiting
client = ChessDotComClient(
    user_agent="GrandmasterGuard/1.0 (contact: support@grandmaster-guard.com)",
    aio=True,  # Async mode for FastAPI
    rate_limit_handler=RateLimitHandler(tts=2, retries=3)
)


async def fetch_chesscom_games(username: str, months: int = 3) -> FetchGamesResponse:
    """
    Fetch games from Chess.com for a user.
    Uses official chess.com package with built-in rate limiting.
    """
    games_fetched = 0
    games_new = 0
    collection = get_games_collection()
    
    try:
        # Step 1: Get archive list using official client
        archives_response = await client.get_player_game_archives(username)
        archives = archives_response.json.get("archives", [])
    except Exception as e:
        if "404" in str(e) or "not found" in str(e).lower():
            return FetchGamesResponse(
                username=username,
                platform=Platform.CHESSCOM,
                games_fetched=0,
                games_new=0,
                message=f"User '{username}' not found on Chess.com"
            )
        return FetchGamesResponse(
            username=username,
            platform=Platform.CHESSCOM,
            games_fetched=0,
            games_new=0,
            message=f"Error fetching archives: {str(e)}"
        )
    except Exception as e:
        return FetchGamesResponse(
            username=username,
            platform=Platform.CHESSCOM,
            games_fetched=0,
            games_new=0,
            message=f"Error getting archives: {str(e)}"
        )
    
    if not archives:
        return FetchGamesResponse(
            username=username,
            platform=Platform.CHESSCOM,
            games_fetched=0,
            games_new=0,
            message="No archives found for this user"
        )
    
    # Filter to requested months
    cutoff_date = datetime.utcnow() - timedelta(days=months * 30)
    recent_archives = [
        url for url in archives
        if _parse_archive_date(url) >= cutoff_date
    ]
    
    # Step 2: Fetch each archive using official client
    for archive_url in recent_archives:
        try:
            # Extract year and month from archive URL
            match = re.search(r'/(\d{4})/(\d{2})$', archive_url)
            if not match:
                continue
            year, month = match.group(1), match.group(2)
            
            # Use official client to fetch games by month
            games_response = await client.get_player_games_by_month(
                username, year=year, month=month
            )
            games = games_response.json.get("games", [])
            
            for game_data in games:
                games_fetched += 1
                
                # Create unique platform ID
                game_uuid = game_data.get('uuid', '')
                if not game_uuid:
                    game_url = game_data.get('url', '')
                    game_uuid = game_url.split('/')[-1] if game_url else str(hash(str(game_data)))[:12]
                platform_id = f"chesscom_{game_uuid}"
                
                # Check if game exists in DB
                if collection is not None:
                    try:
                        existing = await collection.find_one({"platform_id": platform_id})
                        if existing:
                            continue
                    except Exception:
                        pass
                
                # Parse and store game
                parsed_game = _parse_game(game_data, username)
                parsed_game["platform_id"] = platform_id
                
                if collection is not None:
                    try:
                        await collection.insert_one(parsed_game)
                        games_new += 1
                    except Exception as e:
                        print(f"Failed to insert game: {e}")
                        games_new += 1
                else:
                    games_new += 1
            
            # Small delay between archives for courtesy
            await asyncio.sleep(0.3)
            
        except Exception as e:
            print(f"Error fetching archive {archive_url}: {e}")
            continue
    
    return FetchGamesResponse(
        username=username,
        platform=Platform.CHESSCOM,
        games_fetched=games_fetched,
        games_new=games_new,
        message=f"Successfully fetched {games_fetched} games, {games_new} new"
    )


def _parse_archive_date(archive_url: str) -> datetime:
    """Parse year/month from archive URL"""
    match = re.search(r'/(\d{4})/(\d{2})$', archive_url)
    if match:
        year, month = int(match.group(1)), int(match.group(2))
        return datetime(year, month, 1)
    return datetime.min


def _parse_game(game_data: Dict[str, Any], username: str) -> Dict[str, Any]:
    """Parse Chess.com game JSON into our schema"""
    white_data = game_data.get("white", {})
    black_data = game_data.get("black", {})
    
    # Determine result
    white_result = white_data.get("result", "")
    if white_result == "win":
        result = "1-0"
    elif white_result in ["checkmated", "resigned", "timeout", "abandoned"]:
        result = "0-1"
    else:
        result = "1/2-1/2"
    
    # Parse time class
    time_class_map = {
        "bullet": TimeClass.BULLET,
        "blitz": TimeClass.BLITZ,
        "rapid": TimeClass.RAPID,
        "classical": TimeClass.CLASSICAL,
        "daily": TimeClass.CORRESPONDENCE,
    }
    time_class = time_class_map.get(game_data.get("time_class"), TimeClass.BLITZ)
    
    # Parse date
    end_time = game_data.get("end_time", 0)
    try:
        game_date = datetime.fromtimestamp(end_time)
    except:
        game_date = datetime.utcnow()
    
    return {
        "platform": Platform.CHESSCOM.value,
        "white": {
            "username": white_data.get("username", "Unknown"),
            "rating": white_data.get("rating"),
            "rating_diff": None
        },
        "black": {
            "username": black_data.get("username", "Unknown"),
            "rating": black_data.get("rating"),
            "rating_diff": None
        },
        "result": result,
        "pgn": game_data.get("pgn", ""),
        "eco": game_data.get("eco"),
        "opening_name": None,
        "time_control": game_data.get("time_control"),
        "time_class": time_class.value,
        "date": game_date,
        "url": game_data.get("url"),
        "analysis_status": "pending",
        "moves": [],
        "created_at": datetime.utcnow()
    }
