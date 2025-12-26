"""
TTS Service - Text-to-Speech using edge-tts (free, high-quality)
Generates enthusiastic narration for puzzle videos.
"""

import asyncio
import os
import hashlib
from pathlib import Path
from typing import Optional

# TTS output directory
TTS_OUTPUT_DIR = Path("/tmp/tts")
TTS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Available voices for chess content
VOICES = {
    "energetic_male": "en-US-GuyNeural",       # Energetic, clear
    "enthusiastic_male": "en-US-ChristopherNeural",  # Enthusiastic
    "friendly_female": "en-US-JennyNeural",    # Friendly, warm
    "dramatic_male": "en-GB-RyanNeural",       # British, dramatic
    "default": "en-US-GuyNeural",
}


async def generate_tts_audio(
    text: str,
    voice: str = "energetic_male",
    rate: str = "+10%",  # Slightly faster for energy
    pitch: str = "+5Hz",  # Slightly higher for enthusiasm
    output_dir: Optional[Path] = None
) -> dict:
    """
    Generate TTS audio using edge-tts CLI.
    
    Returns:
        dict with 'audio_path', 'subtitle_path', and 'success'
    """
    if output_dir is None:
        output_dir = TTS_OUTPUT_DIR
    
    # Get voice name
    voice_name = VOICES.get(voice, VOICES["default"])
    
    # Generate unique filename based on content hash
    text_hash = hashlib.md5(text.encode()).hexdigest()[:12]
    audio_path = output_dir / f"tts_{text_hash}.mp3"
    subtitle_path = output_dir / f"tts_{text_hash}.srt"
    
    # Check if already generated (cache)
    if audio_path.exists():
        return {
            "audio_path": str(audio_path),
            "subtitle_path": str(subtitle_path) if subtitle_path.exists() else None,
            "success": True,
            "cached": True,
        }
    
    try:
        # Build edge-tts command
        cmd = [
            "edge-tts",
            f"--text={text}",
            f"--voice={voice_name}",
            f"--rate={rate}",
            f"--pitch={pitch}",
            f"--write-media={audio_path}",
            f"--write-subtitles={subtitle_path}"
        ]
        
        # Run edge-tts
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            print(f"edge-tts error: {stderr.decode()}")
            return {
                "audio_path": None,
                "subtitle_path": None,
                "success": False,
                "error": stderr.decode(),
            }
        
        return {
            "audio_path": str(audio_path),
            "subtitle_path": str(subtitle_path) if subtitle_path.exists() else None,
            "success": True,
            "cached": False,
        }
        
    except FileNotFoundError:
        # edge-tts not installed, try pip install
        print("edge-tts not found, attempting to install...")
        try:
            install_process = await asyncio.create_subprocess_exec(
                "pip", "install", "edge-tts",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await install_process.communicate()
            # Retry generation
            return await generate_tts_audio(text, voice, rate, pitch, output_dir)
        except Exception as e:
            return {
                "audio_path": None,
                "subtitle_path": None,
                "success": False,
                "error": f"Failed to install edge-tts: {e}",
            }
    except Exception as e:
        print(f"TTS generation error: {e}")
        return {
            "audio_path": None,
            "subtitle_path": None,
            "success": False,
            "error": str(e),
        }


async def list_available_voices() -> list[dict]:
    """List all available edge-tts voices."""
    try:
        process = await asyncio.create_subprocess_exec(
            "edge-tts", "--list-voices",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await process.communicate()
        
        # Parse voice list
        voices = []
        lines = stdout.decode().strip().split("\n")
        for line in lines[1:]:  # Skip header
            parts = line.split()
            if len(parts) >= 2:
                voices.append({
                    "name": parts[0],
                    "gender": parts[1] if len(parts) > 1 else "Unknown"
                })
        return voices
        
    except Exception as e:
        print(f"Failed to list voices: {e}")
        return []


# Convenience function for puzzle commentary
async def generate_puzzle_commentary_audio(
    commentary: str,
    voice_style: str = "energetic_male"
) -> dict:
    """
    Generate TTS audio specifically for puzzle commentary.
    Uses settings optimized for engaging chess content.
    """
    return await generate_tts_audio(
        text=commentary,
        voice=voice_style,
        rate="+15%",   # Faster pace for excitement
        pitch="+8Hz",  # Higher pitch for energy
    )
