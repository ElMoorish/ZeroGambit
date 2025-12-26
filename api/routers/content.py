"""
Content Router - API endpoints for video content generation
Handles content AI, TTS, and social media publishing.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from api.agents.content_creator import generate_puzzle_content
from api.services.tts_service import generate_puzzle_commentary_audio

router = APIRouter(prefix="/api/content", tags=["content"])


class ContentGenerateRequest(BaseModel):
    """Request for content generation"""
    fen: str
    solution: List[str]
    tactical_theme: str = "tactical puzzle"
    player_color: str = "white"
    puzzle_rating: int = 1500


class ContentGenerateResponse(BaseModel):
    """Generated content response"""
    hook: str
    caption: str
    hashtags: List[str]
    commentary: str
    success: bool = True


class TTSRequest(BaseModel):
    """Request for TTS generation"""
    text: str
    voice: str = "energetic_male"


class TTSResponse(BaseModel):
    """TTS generation response"""
    audio_path: Optional[str]
    subtitle_path: Optional[str]
    success: bool


class FullContentRequest(BaseModel):
    """Request for full content pipeline (content + TTS)"""
    fen: str
    solution: List[str]
    tactical_theme: str = "tactical puzzle"
    player_color: str = "white"
    puzzle_rating: int = 1500
    voice: str = "energetic_male"


from api.services.video_service import render_puzzle_video

class FullContentResponse(BaseModel):
    """Full content response with audio and video"""
    hook: str
    caption: str
    hashtags: List[str]
    commentary: str
    audio_path: Optional[str]
    subtitle_path: Optional[str]
    video_path: Optional[str]
    success: bool = True


@router.post("/render", response_model=FullContentResponse)
async def render_content_video(request: FullContentRequest):
    """
    Generate FULL video pipeline: AI Content -> TTS -> Video Render.
    """
    try:
        # Step 1: Content
        content = await generate_puzzle_content(
            fen=request.fen,
            solution=request.solution,
            tactical_theme=request.tactical_theme,
            player_color=request.player_color,
            puzzle_rating=request.puzzle_rating,
        )
        
        # Step 2: TTS
        tts_result = await generate_puzzle_commentary_audio(
            commentary=content["commentary"],
            voice_style=request.voice,
        )
        audio_path = tts_result.get("audio_path")
        
        # Step 3: Video Render
        # Only render if we have audio (or ignore if silent)
        video_result = await render_puzzle_video(
            fen=request.fen,
            moves=request.solution,
            hook=content["hook"],
            orientation=request.player_color,
            audio_path=audio_path
        )
        
        return FullContentResponse(
            hook=content["hook"],
            caption=content["caption"],
            hashtags=content["hashtags"],
            commentary=content["commentary"],
            audio_path=audio_path,
            subtitle_path=tts_result.get("subtitle_path"),
            video_path=video_result.get("video_path"),
            success=video_result.get("success", False),
        )
        
    except Exception as e:
        print(f"Video pipeline error: {e}")
        return FullContentResponse(
            hook="Error",
            caption="",
            hashtags=[],
            commentary="",
            video_path=None,
            success=False
        )


@router.post("/generate", response_model=ContentGenerateResponse)
async def generate_content(request: ContentGenerateRequest):
    """
    Generate social media content for a puzzle.
    
    Returns hook, caption, hashtags, and TTS commentary script.
    """
    try:
        result = await generate_puzzle_content(
            fen=request.fen,
            solution=request.solution,
            tactical_theme=request.tactical_theme,
            player_color=request.player_color,
            puzzle_rating=request.puzzle_rating,
        )
        return ContentGenerateResponse(**result)
    except Exception as e:
        print(f"Content generation error: {e}")
        return ContentGenerateResponse(
            hook="CAN YOU SOLVE THIS?",
            caption="♟️ A challenging puzzle awaits! Can you find the winning move?",
            hashtags=["chess", "puzzle", "tactics", "chesstok"],
            commentary="Check out this incredible chess puzzle!",
            success=False,
        )


@router.post("/tts", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """
    Generate TTS audio from text.
    
    Returns path to generated audio file.
    """
    try:
        result = await generate_puzzle_commentary_audio(
            commentary=request.text,
            voice_style=request.voice,
        )
        return TTSResponse(
            audio_path=result.get("audio_path"),
            subtitle_path=result.get("subtitle_path"),
            success=result.get("success", False),
        )
    except Exception as e:
        print(f"TTS generation error: {e}")
        return TTSResponse(
            audio_path=None,
            subtitle_path=None,
            success=False,
        )


@router.post("/full", response_model=FullContentResponse)
async def generate_full_content(request: FullContentRequest):
    """
    Generate complete content package: captions, hashtags, commentary + audio.
    
    This is the main endpoint for video content preparation.
    """
    try:
        # Step 1: Generate content using LangGraph
        content = await generate_puzzle_content(
            fen=request.fen,
            solution=request.solution,
            tactical_theme=request.tactical_theme,
            player_color=request.player_color,
            puzzle_rating=request.puzzle_rating,
        )
        
        # Step 2: Generate TTS audio from commentary
        tts_result = await generate_puzzle_commentary_audio(
            commentary=content["commentary"],
            voice_style=request.voice,
        )
        
        return FullContentResponse(
            hook=content["hook"],
            caption=content["caption"],
            hashtags=content["hashtags"],
            commentary=content["commentary"],
            audio_path=tts_result.get("audio_path"),
            subtitle_path=tts_result.get("subtitle_path"),
            success=True,
        )
        
    except Exception as e:
        print(f"Full content generation error: {e}")
        return FullContentResponse(
            hook="CHESS PUZZLE CHALLENGE!",
            caption="♟️ Can you solve this puzzle?",
            hashtags=["chess", "puzzle"],
            commentary="An amazing chess puzzle awaits!",
            audio_path=None,
            subtitle_path=None,
            success=False,
        )


@router.get("/health")
async def content_health():
    """Check content service health"""
    return {
        "status": "healthy",
        "services": {
            "content_ai": "gemma:2b",
            "tts": "edge-tts",
            "social": ["tiktok", "instagram"]
        }
    }
