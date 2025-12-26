"""Ollama service for chess insights generation using Gemma model"""

import httpx
import os
from typing import Optional
from api.prompts.chess_prompts import (
    OPENING_PROMPT,
    INSIGHTS_PROMPT,
    LESSON_PROMPT,
    format_opening_prompt,
    format_insights_prompt,
    format_lesson_prompt,
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = "gemma:2b"  # Lightweight model (~1.7GB)


class OllamaService:
    """Chess insights using local Ollama + Gemma"""
    
    @staticmethod
    async def _generate(system: str, prompt: str, max_tokens: int = 150) -> str:
        """Call Ollama API with chess-optimized settings"""
        # Increase timeout to 120s (first load can be slow on CPU)
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                print(f"[Ollama] Sending request to {OLLAMA_URL}...")
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": MODEL,
                        "system": system,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_predict": max_tokens,
                            # "stop": ["\n\n", "###"], # REMOVED: caused truncation of lists
                        }
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("response", "").strip()
                    print(f"[Ollama] Success: {len(text)} chars generated. Preview: {text[:50]}...") # Log 50 chars
                    return text
                else:
                    print(f"[Ollama] Error {response.status_code}: {response.text}")
                    return ""
            except httpx.ConnectError:
                print(f"[Ollama] Connection failed to {OLLAMA_URL}. Is the container running?")
                return ""
            except httpx.ReadTimeout:
                print("[Ollama] Timeout waiting for response (model loading took too long)")
                return ""
            except Exception as e:
                print(f"[Ollama] Request exception: {type(e).__name__}: {e}")
                return ""
    
    @staticmethod
    async def get_opening_summary(opening_name: str) -> str:
        """Generate opening description"""
        if not opening_name or opening_name == "Unknown":
            return ""
        
        prompt = format_opening_prompt(opening_name)
        return await OllamaService._generate(
            system=OPENING_PROMPT,
            prompt=prompt,
            max_tokens=80  # Keep it short
        )
    
    @staticmethod
    async def get_key_insights(stats: dict) -> str:
        """Generate 2-3 key insights from game stats"""
        prompt = format_insights_prompt(stats)
        return await OllamaService._generate(
            system=INSIGHTS_PROMPT,
            prompt=prompt,
            max_tokens=150
        )
    
    @staticmethod
    async def get_lesson(opening_name: str, insights: str) -> str:
        """Generate one main lesson"""
        prompt = format_lesson_prompt(opening_name, insights)
        return await OllamaService._generate(
            system=LESSON_PROMPT,
            prompt=prompt,
            max_tokens=100
        )


# Singleton instance
ollama_service = OllamaService()
