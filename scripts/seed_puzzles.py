
import os
import io
import csv
import zstandard as zstd
import requests
import asyncio
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

# Configuration
LICHESS_DB_URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst"
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb:27017") # Default to internal docker alias
DB_NAME = "grandmaster_guard"
COLLECTION_NAME = "puzzles"
TARGET_COUNT = 10000  # Number of puzzles to fetch

def get_db_collection():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    return db[COLLECTION_NAME]

def determine_phase(themes):
    theme_str = ",".join(themes).lower()
    if "opening" in theme_str:
        return "opening"
    elif "endgame" in theme_str:
        return "endgame"
    else:
        return "middlegame"

def seed_puzzles():
    print(f"🚀 Starting Puzzle Seeder")
    print(f"TARGET: {TARGET_COUNT} puzzles")
    print(f"SOURCE: {LICHESS_DB_URL}")
    print(f"DB: {MONGO_URL}")

    try:
        collection = get_db_collection()
        # Create index on PuzzleId to prevent duplicates
        collection.create_index("id", unique=True)
        
        current_count = collection.count_documents({})
        if current_count >= TARGET_COUNT:
            print(f"✅ DB already has {current_count} puzzles. Skipping seed.")
            return

        print(f"Current DB count: {current_count}. Fetching more...")
        
        print("Downloading stream...")
        response = requests.get(LICHESS_DB_URL, stream=True)
        response.raise_for_status()
        
        dctx = zstd.ZstdDecompressor()
        stream_reader = dctx.stream_reader(response.raw)
        text_stream = io.TextIOWrapper(stream_reader, encoding='utf-8')
        csv_reader = csv.reader(text_stream)
        
        header = next(csv_reader) # Header row
        # PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
        
        inserted = 0
        batch = []
        
        for row in csv_reader:
            if inserted + current_count >= TARGET_COUNT:
                break
                
            try:
                puzzle_id = row[0]
                fen = row[1]
                moves = row[2].split()
                rating = int(row[3])
                popularity = int(row[5])
                themes = row[7].split()
                
                # Filter for quality
                if popularity < 50: 
                    continue
                
                phase = determine_phase(themes)
                
                puzzle_doc = {
                    "id": puzzle_id,
                    "fen": fen,
                    "moves": moves,
                    "rating": rating,
                    "themes": themes,
                    "phase": phase,
                    "popularity": popularity
                }
                
                batch.append(puzzle_doc)
                
                if len(batch) >= 1000:
                    try:
                        collection.insert_many(batch, ordered=False)
                        inserted += len(batch)
                        print(f"Inserted {inserted} puzzles...")
                    except Exception:
                        # Some duplicates might exist in batch (unlikely) or DB
                        # If ordered=False, it continues inserting
                        inserted += len(batch) 
                    batch = []
                    
            except Exception as e:
                continue

        if batch:
            try:
                collection.insert_many(batch, ordered=False)
                inserted += len(batch)
            except:
                pass
                
        print(f"✅ Finished! Added new puzzles (Total ~{inserted + current_count}).")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    seed_puzzles()
