
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from api.database import get_db

router = APIRouter(prefix="/api/progress", tags=["Progress"])

class OpeningProgressUpdate(BaseModel):
    user_id: str
    eco: str
    learned: bool
    
class OpeningProgressResponse(BaseModel):
    eco: str
    learned: bool
    last_updated: datetime

@router.post("/openings/learn")
async def update_opening_progress(data: OpeningProgressUpdate):
    """Mark an opening as learned or unlearned"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    collection = db.user_progress
    
    # Update or insert
    result = await collection.update_one(
        {"user_id": data.user_id, "type": "opening", "eco": data.eco},
        {
            "$set": {
                "learned": data.learned,
                "last_updated": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {"status": "updated", "learned": data.learned}

@router.get("/openings/{user_id}")
async def get_opening_progress(user_id: str):
    """Get all learned openings for a user"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    collection = db.user_progress
    
    cursor = collection.find({"user_id": user_id, "type": "opening"})
    results = await cursor.to_list(length=1000)
    
    return [
        {
            "eco": item["eco"],
            "learned": item.get("learned", False),
            "last_updated": item.get("last_updated")
        }
        for item in results
    ]
