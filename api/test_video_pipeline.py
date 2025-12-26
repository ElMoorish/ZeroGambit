
import asyncio
import os
import sys
from services.video_service import render_puzzle_video
from services.tts_service import generate_tts_audio

async def test_pipeline():
    print("Starting Video Pipeline Test...")
    
    # 1. Generate Mock TTS Audio
    text = "Can you find the mate in one? Look for the Queen sacrifice on f7."
    print(f"Generating TTS for: {text}")
    tts_result = await generate_tts_audio(text, voice="energetic_male")
    
    if not tts_result["success"]:
        print(f"TTS Failed: {tts_result}")
        return

    audio_path = tts_result["audio_path"]
    print(f"TTS Success: {audio_path}")
    
    # 2. Render Video
    fen = "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4"
    moves = ["Qxf7"]
    print("Rendering Video...")
    
    result = await render_puzzle_video(
        fen=fen,
        moves=moves,
        hook="Test Puzzle",
        audio_path=audio_path
    )
    
    print(f"Render Result: {result}")

if __name__ == "__main__":
    # Add parent dir to path to find services
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    asyncio.run(test_pipeline())
