"""
Puzzle Seeder Script - Seeds ALL 5.6M puzzles from HuggingFace Lichess Dataset
Uses: https://huggingface.co/datasets/Lichess/chess-puzzles

Run this script with: python api/scripts/seed_puzzles.py

WARNING: This will take 30-60 minutes and use ~1-2GB of MongoDB storage.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import List, Dict
import sys
import time

# Batch size for inserts (higher = faster but more memory)
BATCH_SIZE = 1000
# Limit for number of puzzles to seed (to save space/time)
# user has 20GB, so 5.6M puzzles (~6GB) is safe.
PUZZLE_LIMIT = 6000000

# STRICT MAPPING (Matches puzzle_service.py)
PHASE_KEYWORDS = {
    "opening": ["opening", "attackingF2F7"],
    "middlegame": ["middlegame", "fork", "pin", "skewer", "discoveredAttack", "sacrifice",
                   "attraction", "deflection", "doubleCheck", "interference", "xRayAttack",
                   "zugzwang", "trappedPiece", "overloading", "quietMove", "clearance",
                   "intermezzo", "anastasiaMate", "arabianMate", "backRankMate", "bodenMate", 
                   "doubleBishopMate", "dovetailMate", "hookMate", "smotheredMate"],
    "endgame": ["endgame", "pawnEndgame", "rookEndgame", "queenEndgame", "bishopEndgame",
                "knightEndgame", "queenRookEndgame"]
}


def determine_phase(themes) -> str:
    """Determine game phase from puzzle themes with strict priority"""
    if isinstance(themes, list):
        themes_list = {t.lower() for t in themes if isinstance(t, str)}
    elif isinstance(themes, str):
        themes_list = {t.lower() for t in themes.split()}
    else:
        themes_list = set()
    
    # 1. Explicit Phase Tags
    if "endgame" in themes_list: return "endgame"
    if "opening" in themes_list: return "opening"
    if "middlegame" in themes_list: return "middlegame"

    # 2. Key Theme Inference
    for t in themes_list:
        if "opening" in t or "defense" in t or "gambit" in t or "game" in t:
             if any(k in t for k in ["indian", "caro", "french", "sicilian", "slav", "scandi", "scotch", "vienna"]):
                 return "opening"

    if any("endgame" in t for t in themes_list): return "endgame"
    
    # 3. Fallback
    for phase, keywords in PHASE_KEYWORDS.items():
        if any(k.lower() in themes_list for k in keywords):
            return phase
    
    return "middlegame"


def format_time(seconds):
    """Format seconds into human readable string"""
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        return f"{seconds // 60:.0f}m {seconds % 60:.0f}s"
    else:
        return f"{seconds // 3600:.0f}h {(seconds % 3600) // 60:.0f}m"


async def insert_batch(collection, batch: List[dict]):
    """Insert a batch of puzzles using bulk write"""
    from pymongo import UpdateOne
    
    operations = [
        UpdateOne(
            {"id": doc["id"]},
            {"$set": doc},
            upsert=True
        )
        for doc in batch
    ]
    
    try:
        result = await collection.bulk_write(operations, ordered=False)
        return result.upserted_count, result.modified_count
    except Exception as e:
        print(f"   Batch error: {e}")
        return 0, 0


async def seed_puzzles():
    """Seed puzzles from HuggingFace dataset"""
    
    print("📦 Loading required packages...")
    try:
        from datasets import load_dataset
    except ImportError:
        print("Installing datasets library...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "datasets"])
        from datasets import load_dataset
    
    print("\n🔄 Loading Lichess puzzle dataset from HuggingFace...")
    print(f"   Limit: {PUZZLE_LIMIT:,} puzzles")
    
    # Load the dataset (streaming mode)
    dataset = load_dataset("Lichess/chess-puzzles", split="train", streaming=True)
    
    # Connect to MongoDB
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client["grandmaster_guard"]
    puzzles_collection = db.puzzles
    
    print(f"✓ Connected to MongoDB: {mongodb_uri}")
    
    # Drop existing puzzles to start fresh (optional - comment out to update instead)
    # await puzzles_collection.delete_many({})
    # print("✓ Cleared existing puzzles")
    
    # Counters
    total_processed = 0
    total_inserted = 0
    total_updated = 0
    phase_counts = {"opening": 0, "middlegame": 0, "endgame": 0}
    
    batch = []
    start_time = time.time()
    last_update = start_time
    
    print(f"\n🔍 Processing all 5.6M puzzles...")
    print(f"   Batch size: {BATCH_SIZE}")
    print("─" * 60)
    
    for item in dataset:
        # Parse puzzle data
        puzzle_id = item.get("PuzzleId", "")
        fen = item.get("FEN", "")
        moves_data = item.get("Moves", "")
        rating = item.get("Rating", 1500)
        themes_data = item.get("Themes", [])
        
        if not fen or not moves_data or not puzzle_id:
            continue
        
        # Determine phase
        phase = determine_phase(themes_data)
        phase_counts[phase] += 1
        
        # Parse themes into list
        if isinstance(themes_data, list):
            themes = themes_data
        elif isinstance(themes_data, str):
            themes = themes_data.split() if themes_data else []
        else:
            themes = []
        
        # Parse moves into list
        if isinstance(moves_data, list):
            moves = moves_data
        elif isinstance(moves_data, str):
            moves = moves_data.split() if moves_data else []
        else:
            moves = []
        
        puzzle_doc = {
            "id": puzzle_id,
            "fen": fen,
            "moves": moves,
            "rating": int(rating) if rating else 1500,
            "themes": themes,
            "phase": phase
        }
        
        batch.append(puzzle_doc)
        total_processed += 1
        
        # Insert batch when full
        if len(batch) >= BATCH_SIZE:
            inserted, updated = await insert_batch(puzzles_collection, batch)
            total_inserted += inserted
            total_updated += updated
            batch = []
            
            # Progress update every 10 seconds
            current_time = time.time()
            if current_time - last_update >= 10:
                elapsed = current_time - start_time
                rate = total_processed / elapsed
                eta = (5600000 - total_processed) / rate if rate > 0 else 0
                
                print(f"   📊 {total_processed:,} / 5,600,000 ({total_processed/56000:.1f}%) | "
                      f"Rate: {rate:.0f}/s | ETA: {format_time(eta)}")
                print(f"      Opening: {phase_counts['opening']:,} | "
                      f"Middlegame: {phase_counts['middlegame']:,} | "
                      f"Endgame: {phase_counts['endgame']:,}")
                last_update = current_time
        
        if total_processed >= PUZZLE_LIMIT:
            print(f"\nReached limit of {PUZZLE_LIMIT:,} puzzles. Stopping.")
            break
    
    # Insert remaining batch
    if batch:
        inserted, updated = await insert_batch(puzzles_collection, batch)
        total_inserted += inserted
        total_updated += updated
    
    # Create indexes
    print(f"\n🔧 Creating indexes...")
    await puzzles_collection.create_index("id", unique=True)
    await puzzles_collection.create_index("phase")
    await puzzles_collection.create_index("rating")
    await puzzles_collection.create_index([("phase", 1), ("rating", 1)])
    await puzzles_collection.create_index([("phase", 1), ("rating", -1)])
    await puzzles_collection.create_index("themes")
    
    # Final counts from database
    opening_count = await puzzles_collection.count_documents({"phase": "opening"})
    middlegame_count = await puzzles_collection.count_documents({"phase": "middlegame"})
    endgame_count = await puzzles_collection.count_documents({"phase": "endgame"})
    total_count = await puzzles_collection.count_documents({})
    
    elapsed = time.time() - start_time
    
    print(f"\n{'═' * 60}")
    print(f"✅ SEEDING COMPLETE!")
    print(f"{'═' * 60}")
    print(f"   Time elapsed: {format_time(elapsed)}")
    print(f"   Processed: {total_processed:,}")
    print(f"   Inserted: {total_inserted:,}")
    print(f"   Updated: {total_updated:,}")
    print(f"\n📊 Final puzzle counts in database:")
    print(f"   Opening:    {opening_count:,}")
    print(f"   Middlegame: {middlegame_count:,}")
    print(f"   Endgame:    {endgame_count:,}")
    print(f"   {'─' * 20}")
    print(f"   TOTAL:      {total_count:,}")
    print(f"\n🎉 Your puzzle database is ready with {total_count:,} puzzles!")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_puzzles())
