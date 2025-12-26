from fastapi import APIRouter, HTTPException, Depends
from api.models.user import UserCreate, UserInDB
from api.database import db
from datetime import datetime

router = APIRouter()

@router.post("/users/sync", response_model=UserInDB)
async def sync_user(user: UserCreate):
    """
    Sync user from frontend (Clerk) to MongoDB
    Creates if not exists, updates if exists
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
        
    users_collection = db["users"]
    
    # Check if user exists
    existing_user = await users_collection.find_one({"id": user.id})
    
    if existing_user:
        # Update
        update_data = user.dict(exclude={"id"})
        update_data["last_login"] = datetime.utcnow()
        
        await users_collection.update_one(
            {"id": user.id},
            {"$set": update_data}
        )
        
        return UserInDB(**{**existing_user, **update_data})
    else:
        # Create
        new_user = UserInDB(**user.dict())
        await users_collection.insert_one(new_user.dict())
        return new_user

@router.get("/users/{user_id}", response_model=UserInDB)
async def get_user(user_id: str):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user = await db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return UserInDB(**user)
