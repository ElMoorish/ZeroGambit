"""
Video Service - Orchestrates Remotion video rendering
"""

import subprocess
import json
import os
from pathlib import Path

# Path to local video project (in Docker container)
VIDEO_PROJECT_PATH = Path("/app/video")
OUTPUT_DIR = VIDEO_PROJECT_PATH / "out"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


import shutil

# ... imports ...

async def render_puzzle_video(
    fen: str,
    moves: list[str],
    hook: str,
    orientation: str = "white",
    audio_path: str = None
) -> dict:
    # ...
    
    # Handle Audio: Copy to video/public/audio so Remotion can access it via URL
    final_audio_url = ""
    if audio_path:
        # Source path
        src_audio = Path(audio_path)
        if src_audio.exists():
            # Destination: /app/video/public/audio/
            public_audio_dir = VIDEO_PROJECT_PATH / "public" / "audio"
            public_audio_dir.mkdir(parents=True, exist_ok=True)
            
            dest_audio = public_audio_dir / src_audio.name
            shutil.copy2(src_audio, dest_audio)
            
            # URL for Remotion (relative to public)
            final_audio_url = f"/audio/{src_audio.name}"
            print(f"Copied audio to {dest_audio}, URL: {final_audio_url}")
    
    # Construct props
    props = {
        "fen": fen,
        "moves": moves,
        "orientation": orientation,
        "hook": hook,
        "audioUrl": final_audio_url,
        "creatorName": "Grandmaster Guard"
    }
    
    # ... rest of function ...
    
    # JSON stringify props
    props_json = json.dumps(props)
    
    # Create unique filename based on puzzle content AND timestamp to avoid caching old versions
    import time
    output_filename = f"puzzle_{abs(hash(fen + ''.join(moves)))}_{int(time.time())}.mp4"
    output_path = OUTPUT_DIR / output_filename
    
    # Ensure output directory exists
    if not OUTPUT_DIR.exists():
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        # Run Remotion render command
        # npx remotion render PuzzleVideo out.mp4 --props='{...}'
        
        # We need to run this in the video project directory
        cmd = [
            "npx",
            "remotion",
            "render",
            "PuzzleVideo",
            str(output_path),
            f"--props={props_json}",
            "--log=verbose"
        ]
        
        print(f"Rendering video... {cmd}")
        
        process = subprocess.run(
            cmd,
            cwd=str(VIDEO_PROJECT_PATH),
            capture_output=True,
            text=True
        )
        
        if process.returncode != 0:
            print(f"Remotion Error: {process.stderr}")
            return {
                "video_path": None,
                "success": False,
                "error": process.stderr
            }
            
        return {
            "video_path": str(output_path),
            "success": True,
            "cached": False
        }
        
    except Exception as e:
        print(f"Render exception: {e}")
        return {
            "video_path": None,
            "success": False,
            "error": str(e)
        }
