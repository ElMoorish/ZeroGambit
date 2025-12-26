"""
AI Coach Service - Supports both OpenAI and Google Gemini APIs
Provides opening summaries, key insights, and teachable lessons
"""

import os
from typing import Optional, Dict, Any

# Check which API to use
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Determine which client to use
use_gemini = bool(GEMINI_API_KEY)
use_openai = bool(OPENAI_API_KEY) and not use_gemini

gemini_client = None
openai_client = None

if use_gemini:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_client = genai.GenerativeModel("gemini-2.0-flash-exp")
        print("[AI Coach] Using Google Gemini API")
    except ImportError:
        print("[AI Coach] google-generativeai not installed, falling back to OpenAI")
        use_gemini = False

if use_openai and not use_gemini:
    try:
        from openai import OpenAI
        BASE_API_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        MODEL_NAME = os.getenv("COACH_MODEL", "gpt-4o-mini")
        openai_client = OpenAI(base_url=BASE_API_URL, api_key=OPENAI_API_KEY)
        print("[AI Coach] Using OpenAI API")
    except ImportError:
        print("[AI Coach] openai not installed")


def call_ai(system_prompt: str, prompt: str, max_tokens: int = 200) -> str:
    """
    Call the AI API (Gemini or OpenAI) with a prompt and return the text output.
    """
    if gemini_client:
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}"
            response = gemini_client.generate_content(
                full_prompt,
                generation_config={
                    "max_output_tokens": max_tokens,
                    "temperature": 0.7,
                }
            )
            return response.text or ""
        except Exception as e:
            print(f"[AI Coach] Gemini call failed: {e}")
            return "Coach temporarily unavailable"
    
    elif openai_client:
        try:
            response = openai_client.chat.completions.create(
                model=os.getenv("COACH_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"[AI Coach] OpenAI call failed: {e}")
            return "Coach temporarily unavailable"
    
    return "AI coaching unavailable - no API key configured"


def get_opening_summary(opening_name: str) -> str:
    """Get a concise opening summary for TTS"""
    if not opening_name:
        return ""
    
    return call_ai(
        system_prompt="You are a friendly chess coach. Give a brief, one-sentence description of the opening that would be easy to understand when read aloud.",
        prompt=f"Describe the {opening_name} chess opening.",
        max_tokens=100
    )


def get_move_commentary(
    move_san: str,
    classification: str,
    evaluation: float,
    best_move: Optional[str] = None,
    move_number: int = 1,
    is_white: bool = True
) -> str:
    """Generate natural language commentary for a move - TTS ready"""
    
    side = "White" if is_white else "Black"
    
    if classification == "blunder":
        prompt = f"""
        {side} played {move_san} on move {move_number}, which was a serious mistake.
        The evaluation dropped significantly. The better move was {best_move or 'unclear'}.
        Give a brief, encouraging coaching comment about this blunder (1-2 sentences).
        Be supportive, not critical. This will be read aloud.
        """
    elif classification == "mistake":
        prompt = f"""
        {side} played {move_san} on move {move_number}, which was inaccurate.
        A better choice was {best_move or 'available'}.
        Give a brief, constructive coaching comment (1 sentence). This is for TTS.
        """
    elif classification in ["brilliant", "great"]:
        prompt = f"""
        {side} played the excellent move {move_san} on move {move_number}!
        Give a brief praise comment (1 sentence). Sound enthusiastic. For TTS.
        """
    else:
        return ""
    
    return call_ai(
        system_prompt="You are a warm, encouraging chess coach. Keep responses brief and natural for text-to-speech.",
        prompt=prompt,
        max_tokens=80
    )


def get_key_insight(game_pgn: str, evaluations: list) -> str:
    """Get key insights from game analysis"""
    
    blunders = sum(1 for e in evaluations if e.get('classification') == 'blunder')
    mistakes = sum(1 for e in evaluations if e.get('classification') == 'mistake')
    brilliant = sum(1 for e in evaluations if e.get('classification') in ['brilliant', 'great'])
    
    summary = f"""
    Game analysis:
    - Brilliant/Great moves: {brilliant}
    - Mistakes: {mistakes}  
    - Blunders: {blunders}
    
    PGN: {game_pgn[:500]}...
    """
    
    return call_ai(
        system_prompt="You are a chess coach. Give 2 key insights from this game analysis. Be specific but brief. For TTS.",
        prompt=summary,
        max_tokens=150
    )


def get_lesson(opening_name: str, game_pgn: str, key_insights: str) -> str:
    """Get a teachable lesson from the game"""
    
    prompt = f"""
    Opening: {opening_name or 'Unknown'}
    
    Game: {game_pgn[:300]}...
    
    Key insights: {key_insights}
    
    Give ONE actionable lesson the player can apply in future games.
    Keep it short (2-3 sentences) and practical. This is for TTS.
    """
    
    return call_ai(
        system_prompt="You are an experienced chess coach. Provide one clear, actionable lesson. Be encouraging.",
        prompt=prompt,
        max_tokens=100
    )


def generate_game_summary(
    opening_name: Optional[str],
    white_player: str,
    black_player: str,
    result: str,
    evaluations: list
) -> Dict[str, Any]:
    """Generate a complete coaching summary for the game"""
    
    blunders = sum(1 for e in evaluations if e.get('classification') == 'blunder')
    mistakes = sum(1 for e in evaluations if e.get('classification') == 'mistake')
    brilliant = sum(1 for e in evaluations if e.get('classification') in ['brilliant', 'great'])
    
    opening_summary = get_opening_summary(opening_name) if opening_name else ""
    
    return {
        "opening_summary": opening_summary,
        "stats": {
            "blunders": blunders,
            "mistakes": mistakes,
            "brilliant_moves": brilliant,
            "total_moves": len(evaluations)
        },
        "players": {
            "white": white_player,
            "black": black_player,
            "result": result
        }
    }
