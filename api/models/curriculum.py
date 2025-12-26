from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class ModuleProgress(BaseModel):
    module_id: str
    xp: int = 0
    level: int = 1
    streak: int = 0
    last_active: datetime = Field(default_factory=datetime.utcnow)

class UserCurriculumProgress(BaseModel):
    user_id: str
    modules: Dict[str, ModuleProgress] = Field(default_factory=dict)
    
    # Computed totals
    total_xp: int = 0
    total_levels: int = 0

    class Config:
        populate_by_name = True
