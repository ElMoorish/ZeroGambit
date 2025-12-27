
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# STRICT PHASE LOGIC (Copied from puzzle_service.py)
PHASE_THEMES = {
    "opening": ["opening", "attackingF2F7"],
    "middlegame": ["middlegame", "fork", "pin", "skewer", "discoveredAttack", 
                   "sacrifice", "attraction", "deflection", "doubleCheck",
                   "interference", "xRayAttack", "zugzwang"],
    "endgame": ["endgame", "pawnEndgame", "rookEndgame", "queenEndgame", 
                "bishopEndgame", "knightEndgame", "queenRookEndgame"]
}

def determine_phase(themes):
    """Determine game phase from puzzle themes with strict priority"""
    themes_set = {t.lower() for t in themes}
    
    # 1. Explicit Phase Tags
    if "endgame" in themes_set: return "endgame"
    if "opening" in themes_set: return "opening"
    if "middlegame" in themes_set: return "middlegame"
        
    # 2. Key Theme Inference
    for t in themes_set:
        if "opening" in t or "defense" in t or "gambit" in t or "game" in t:
             if any(k in t for k in ["indian", "caro", "french", "sicilian", "slav", "scandi", "scotch", "vienna"]):
                 return "opening"

    if any("endgame" in t for t in themes_set): return "endgame"

    # 3. Fallback to Theme Mapping
    for phase, phase_themes in PHASE_THEMES.items():
        if any(theme in phase_themes for theme in themes):
            return phase
            
    return "middlegame"

async def fix_phases():
    uri = os.getenv("MONGODB_URI", "mongodb://mongodb:27017/grandmaster_guard")
    print(f"Connecting to MongoDB at {uri}...")
    
    try:
        client = AsyncIOMotorClient(uri)
        db = client.get_database("grandmaster_guard")
        collection = db.puzzles
        
        total = await collection.count_documents({})
        print(f"Found {total} puzzles. Scanning for phase corrections...")
        
        updated = 0
        cursor = collection.find({})
        
        async for doc in cursor:
            themes = doc.get("themes", [])
            current_phase = doc.get("phase", "unknown")
            
            new_phase = determine_phase(themes)
            
            if new_phase != current_phase:
                # Update DB
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"phase": new_phase}}
                )
                updated += 1
                if updated % 100 == 0:
                    print(f"Updated {updated} puzzles... (Last: {doc.get('id')} {current_phase}->{new_phase})")
                    
        print(f"\n✅ Finished! Updated {updated} puzzles out of {total}.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_phases())
