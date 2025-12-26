from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    country: Optional[str] = None
    is_subscribed: bool = False
    subscription_date: Optional[datetime] = None

class UserCreate(UserBase):
    id: str = Field(..., description="Unique ID from Auth Provider (Clerk)")

class UserInDB(UserBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "user_2a3b4c...",
                "name": "Grandmaster Flash",
                "email": "gm@example.com",
                "country": "US",
                "is_subscribed": True,
                "subscription_date": "2024-01-01T00:00:00Z"
            }
        }
