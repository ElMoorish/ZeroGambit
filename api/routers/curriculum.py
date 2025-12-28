from fastapi import APIRouter, HTTPException, Depends, Query
from api.models.curriculum import UserCurriculumProgress, ModuleProgress
from api.database import get_db
from datetime import datetime
from typing import List, Optional

router = APIRouter()

@router.get("/curriculum/progress/{user_id}", response_model=UserCurriculumProgress)
async def get_progress(user_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
        
    collection = db["curriculum_progress"]
    progress = await collection.find_one({"user_id": user_id})
    
    if not progress:
        # Return empty progress structure
        return UserCurriculumProgress(user_id=user_id)
        
    return UserCurriculumProgress(**progress)

@router.post("/curriculum/progress/{user_id}/{module_id}")
async def update_module_progress(user_id: str, module_id: str, xp: int, level: int, streak: int):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
        
    collection = db["curriculum_progress"]
    
    # Create module progress object
    module_update = ModuleProgress(
        module_id=module_id,
        xp=xp,
        level=level,
        streak=streak,
        last_active=datetime.utcnow()
    )
    
    # Update specifically this module in the map using dot notation
    # e.g. "modules.stone-1"
    update_key = f"modules.{module_id}"
    
    await collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                update_key: module_update.dict(),
                "user_id": user_id  # Ensure user_id is set on upsert
            },
            "$inc": {
                "total_xp": xp,
            }
        },
        upsert=True
    )
    
    return {"status": "updated", "module_id": module_id}

