"""
Openings Router - API endpoints for chess openings
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db

router = APIRouter(prefix="/api/openings", tags=["openings"])


class OpeningResponse(BaseModel):
    eco: str
    name: str
    moves: List[str]
    fen: str
    description: str
    numMoves: int
    # Teaching content
    keyIdeas: Optional[List[str]] = None
    typicalPlans: Optional[List[str]] = None
    commonTraps: Optional[List[str]] = None


class OpeningListResponse(BaseModel):
    openings: List[OpeningResponse]
    total: int


@router.get("/", response_model=OpeningListResponse)
async def list_openings(
    eco: Optional[str] = Query(None, description="Filter by ECO code prefix (e.g., 'B' for Sicilians)"),
    search: Optional[str] = Query(None, description="Search by opening name"),
    limit: int = Query(50, ge=1, le=200)
):
    """List all openings with optional filtering"""
    db = get_db()
    if db is None:
        return OpeningListResponse(openings=[], total=0)
    
    query = {}
    if eco:
        query["eco"] = {"$regex": f"^{eco}", "$options": "i"}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    cursor = db.openings.find(query).limit(limit)
    openings = []
    print(f"DEBUG: list_openings eco={eco} search={search} limit={limit}")
    async for doc in cursor:
        try:
            if "_id" in doc:
                del doc["_id"]
            openings.append(OpeningResponse(**doc))
        except Exception as e:
            print(f"ERROR: Skipping invalid opening {doc.get('eco', 'unknown')}: {e}")
            continue
    
    total = await db.openings.count_documents(query)
    
    return OpeningListResponse(openings=openings, total=total)


@router.get("/eco/{eco_code}", response_model=OpeningListResponse)
async def get_openings_by_eco(eco_code: str):
    """Get all openings for a specific ECO code"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    cursor = db.openings.find({"eco": eco_code.upper()})
    openings = []
    async for doc in cursor:
        if "_id" in doc:
            del doc["_id"]
        openings.append(OpeningResponse(**doc))
    
    return OpeningListResponse(openings=openings, total=len(openings))


@router.get("/categories")
async def get_categories():
    """Get opening categories (A-E) with counts"""
    db = get_db()
    if db is None:
        return {"categories": []}
    
    categories = []
    category_info = {
        "A": "Flank Openings (English, Réti, etc.)",
        "B": "Semi-Open Games (Sicilian, Caro-Kann, French)",
        "C": "Open Games (1.e4 e5, Ruy Lopez, Italian)",
        "D": "Closed Games (Queen's Gambit, Slav, Grünfeld)",
        "E": "Indian Defenses (Nimzo-Indian, King's Indian)"
    }
    
    for cat, description in category_info.items():
        count = await db.openings.count_documents({"eco": {"$regex": f"^{cat}"}})
        categories.append({
            "code": cat,
            "name": description,
            "count": count
        })
    
    return {"categories": categories}


@router.get("/random", response_model=OpeningResponse)
async def get_random_opening(eco_prefix: Optional[str] = None):
    """Get a random opening, optionally filtered by ECO prefix"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    pipeline = []
    if eco_prefix:
        pipeline.append({"$match": {"eco": {"$regex": f"^{eco_prefix}", "$options": "i"}}})
    pipeline.append({"$sample": {"size": 1}})
    
    cursor = db.openings.aggregate(pipeline)
    async for doc in cursor:
        if "_id" in doc:
            del doc["_id"]
        return OpeningResponse(**doc)
    
    raise HTTPException(status_code=404, detail="No openings found")


@router.get("/search/{query}", response_model=OpeningListResponse)
async def search_openings(query: str, limit: int = 20):
    """Search openings by name"""
    db = get_db()
    if db is None:
        return OpeningListResponse(openings=[], total=0)
    
    cursor = db.openings.find(
        {"name": {"$regex": query, "$options": "i"}}
    ).limit(limit)
    
    openings = []
    async for doc in cursor:
        if "_id" in doc:
            del doc["_id"]
        openings.append(OpeningResponse(**doc))
    
    return OpeningListResponse(openings=openings, total=len(openings))


@router.get("/for-fen/{fen:path}")
async def get_opening_for_fen(fen: str):
    """Get opening that matches a given FEN position"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    # Normalize FEN - only match position part (first 4 fields)
    fen_parts = fen.split()
    fen_position = " ".join(fen_parts[:4]) if len(fen_parts) >= 4 else fen
    
    doc = await db.openings.find_one({"fen": {"$regex": f"^{fen_position}"}})
    
    if doc:
        if "_id" in doc:
            del doc["_id"]
        return OpeningResponse(**doc)
    
    return {"message": "No matching opening found", "fen": fen}
