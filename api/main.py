"""
Grandmaster Guard - FastAPI Backend
Main entry point for the Python API server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from api.routers import games, captcha, analysis, puzzles, coach, content, openings, user, curriculum, progress
from api.database import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    await connect_db()
    
    # Create required indexes for new collections
    try:
        from api.database import get_db
        db_instance = get_db()
        if db_instance is not None:
             # Users: unique ID
             await db_instance.users.create_index("id", unique=True)
             
             # Curriculum Progress: unique per user
             # We mainly query by user_id
             await db_instance.curriculum_progress.create_index("user_id", unique=True)
             
             print("✅ Initialized MongoDB Indexes for User/Curriculum")
    except Exception as e:
        print(f"⚠️ Index creation warning: {e}")
        
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Grandmaster Guard API",
    description="AI Chess Analysis Backend - Fetches games, runs analysis, generates coaching",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",  # Docker frontend
        "https://grandmaster-guard.vercel.app",
        "https://zerogambit.vercel.app",  # Main production URL
        os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trust proxy headers (X-Forwarded-Proto, X-Forwarded-For) for HTTPS behind Cloudflare/Vercel
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

# Include routers
app.include_router(games.router, prefix="/api", tags=["Games"])
app.include_router(captcha.router, prefix="/api/captcha", tags=["Captcha"])
app.include_router(analysis.router, tags=["Analysis"])
app.include_router(puzzles.router, tags=["Puzzles"])
app.include_router(coach.router, tags=["Coach"])  # LangGraph AI Coach
app.include_router(content.router, tags=["Content"])  # Video Content Pipeline
app.include_router(openings.router, tags=["Openings"])  # Opening Repertoire
app.include_router(user.router, prefix="/api", tags=["Users"]) # New User Sync
app.include_router(curriculum.router, prefix="/api", tags=["Curriculum"]) # New Progress
app.include_router(progress.router, tags=["Progress"]) # Generic Progress (Openings etc)

# Mount static files for generated videos
from fastapi.staticfiles import StaticFiles
video_dir = "/app/video/out"
if not os.path.exists(video_dir):
    os.makedirs(video_dir, exist_ok=True)
app.mount("/videos", StaticFiles(directory=video_dir), name="videos")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Grandmaster Guard API",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "services": {
            "chesscom": "available",
            "lichess": "available",
            "analysis": "available"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
