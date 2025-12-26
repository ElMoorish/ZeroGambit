"""
Game Models - Pydantic schemas for game data
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Platform(str, Enum):
    CHESSCOM = "chesscom"
    LICHESS = "lichess"


class TimeClass(str, Enum):
    BULLET = "bullet"
    BLITZ = "blitz"
    RAPID = "rapid"
    CLASSICAL = "classical"
    CORRESPONDENCE = "correspondence"


class MoveClassification(str, Enum):
    BRILLIANT = "brilliant"
    GREAT = "great"
    BEST = "best"
    EXCELLENT = "excellent"
    INACCURACY = "inaccuracy"
    MISTAKE = "mistake"
    BLUNDER = "blunder"
    NORMAL = "normal"


class TacticalMotif(str, Enum):
    FORK = "fork"
    PIN = "pin"
    SKEWER = "skewer"
    DISCOVERY = "discovery"
    HANGING_PIECE = "hanging_piece"
    BACK_RANK = "back_rank"
    SACRIFICE = "sacrifice"


class Player(BaseModel):
    """Player information"""
    username: str
    rating: Optional[int] = None
    rating_diff: Optional[int] = None


class MoveAnalysis(BaseModel):
    """Analysis data for a single move"""
    ply: int
    move: Optional[str] = None  # Raw move from Chess.com
    san: Optional[str] = None  # Standard Algebraic Notation
    uci: Optional[str] = None  # UCI notation
    fen_after: Optional[str] = None  # FEN after move
    evaluation: Optional[int] = None  # Centipawns
    mate: Optional[int] = None  # Mate in X
    best_move: Optional[str] = None
    classification: Optional[str] = "normal"
    motifs: List[TacticalMotif] = []
    comment: Optional[str] = None
    pv: Optional[List[str]] = None  # Principal variation


class GameBase(BaseModel):
    """Base game schema"""
    platform: Platform
    platform_id: str
    white: Player
    black: Player
    result: str  # "1-0", "0-1", "1/2-1/2"
    pgn: str
    eco: Optional[str] = None
    opening_name: Optional[str] = None
    time_control: Optional[str] = None
    time_class: Optional[TimeClass] = None
    date: datetime
    url: Optional[str] = None


class GameCreate(GameBase):
    """Schema for creating a game"""
    pass


class Game(GameBase):
    """Full game schema with analysis"""
    id: str = Field(alias="_id")
    analysis_status: str = "pending"  # pending, analyzing, completed, failed
    moves: List[MoveAnalysis] = []
    white_accuracy: Optional[float] = None
    black_accuracy: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    analyzed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class GameListResponse(BaseModel):
    """Response for listing games"""
    games: List[Game]
    total: int
    page: int
    per_page: int


class FetchGamesRequest(BaseModel):
    """Request to fetch games for a user"""
    username: str
    platform: Platform
    months: Optional[int] = 3  # How many months back to fetch
    since: Optional[datetime] = None  # For incremental updates


class FetchGamesResponse(BaseModel):
    """Response after fetching games"""
    username: str
    platform: Platform
    games_fetched: int
    games_new: int
    message: str
