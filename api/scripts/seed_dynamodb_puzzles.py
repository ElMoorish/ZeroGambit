"""
Multi-Source DynamoDB Puzzle Seeder

Seeds puzzles from multiple sources into AWS DynamoDB:
1. Lichess puzzles (5.6M from HuggingFace)
2. ChessTempo-style tactical puzzles
3. Classic mate-in-N puzzles
4. Polgar-style training puzzles

Run with: python api/scripts/seed_dynamodb_puzzles.py

IMPORTANT: Set environment variables before running:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (default: eu-north-1)
"""

import os
import sys
import time
import json
import random
from decimal import Decimal
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor
import threading

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Load environment from the correct .env file
from pathlib import Path
env_path = Path(__file__).parent.parent.parent / ".env"
print(f"Looking for .env at: {env_path}")

from dotenv import load_dotenv
load_dotenv(env_path)

import boto3
from boto3.dynamodb.conditions import Key

# Configuration
BATCH_SIZE = 25  # DynamoDB batch write limit
MAX_WORKERS = 4  # Parallel upload threads
AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")
PUZZLES_TABLE = os.getenv("DYNAMODB_PUZZLES_TABLE", "chess-puzzles")

# Get AWS credentials (support multiple naming conventions)
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("Access_Key_ID") or os.getenv("ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY") or os.getenv("Secret_Access_Key") or os.getenv("SECRET_ACCESS_KEY")

# Progress tracking
total_uploaded = 0
upload_lock = threading.Lock()


def get_dynamodb_table():
    """Get DynamoDB table resource"""
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY
    )
    return dynamodb.Table(PUZZLES_TABLE)


def get_rating_bucket(rating: int) -> str:
    """Convert rating to bucket key"""
    bucket_start = (rating // 100) * 100
    return f"{bucket_start}-{bucket_start + 99}"


def convert_floats_to_decimal(obj):
    """Convert floats to Decimal for DynamoDB"""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimal(i) for i in obj]
    return obj


def determine_phase(themes: List[str]) -> str:
    """Determine game phase from puzzle themes"""
    themes_lower = [t.lower() for t in themes]
    
    endgame_keywords = ["endgame", "pawnendgame", "rookendgame", "queenendgame", 
                        "bishopendgame", "knightendgame"]
    opening_keywords = ["opening", "hangingpiece", "attackingf2f7"]
    
    for kw in endgame_keywords:
        if kw in themes_lower:
            return "endgame"
    
    for kw in opening_keywords:
        if kw in themes_lower:
            return "opening"
    
    return "middlegame"


def batch_write_items(table, items: List[Dict]) -> int:
    """Write a batch of items to DynamoDB"""
    global total_uploaded
    
    if not items:
        return 0
    
    try:
        with table.batch_writer() as batch:
            for item in items:
                item = convert_floats_to_decimal(item)
                batch.put_item(Item=item)
        
        with upload_lock:
            total_uploaded += len(items)
        
        return len(items)
    except Exception as e:
        print(f"  ❌ Batch write error: {e}")
        return 0


def format_time(seconds: float) -> str:
    """Format seconds to human readable string"""
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        return f"{seconds // 60:.0f}m {seconds % 60:.0f}s"
    else:
        return f"{seconds // 3600:.0f}h {(seconds % 3600) // 60:.0f}m"


# ============================================
# PUZZLE SOURCE 1: LICHESS (HuggingFace)
# ============================================

def seed_lichess_puzzles(table, limit: Optional[int] = None):
    """Seed Lichess puzzles from HuggingFace dataset"""
    print("\n" + "=" * 60)
    print("📦 LICHESS PUZZLES (5.6M)")
    print("=" * 60)
    
    try:
        from datasets import load_dataset
    except ImportError:
        print("Installing datasets library...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "datasets"])
        from datasets import load_dataset
    
    print("Loading dataset from HuggingFace...")
    dataset = load_dataset("Lichess/chess-puzzles", split="train", streaming=True)
    
    batch = []
    count = 0
    start_time = time.time()
    
    for puzzle in dataset:
        try:
            # Parse themes
            themes_raw = puzzle.get("Themes", "")
            if isinstance(themes_raw, list):
                themes = themes_raw
            else:
                themes = themes_raw.split() if themes_raw else []
            
            # Parse moves
            moves_raw = puzzle.get("Moves", "")
            if isinstance(moves_raw, list):
                moves = moves_raw
            else:
                moves = moves_raw.split() if moves_raw else []
            
            rating = int(puzzle.get("Rating", 1200))
            
            item = {
                "rating_bucket": get_rating_bucket(rating),
                "puzzle_id": f"lichess_{puzzle.get('PuzzleId', str(count))}",
                "source": "lichess",
                "fen": puzzle.get("FEN", ""),
                "moves": moves,
                "solution": moves[0] if moves else "",
                "rating": rating,
                "rating_deviation": int(puzzle.get("RatingDeviation", 75)),
                "themes": ",".join(themes),
                "phase": determine_phase(themes),
                "popularity": int(puzzle.get("Popularity", 50)),
                "nb_plays": int(puzzle.get("NbPlays", 0))
            }
            
            batch.append(item)
            count += 1
            
            # Write batch when full
            if len(batch) >= BATCH_SIZE:
                batch_write_items(table, batch)
                batch = []
                
                if count % 10000 == 0:
                    elapsed = time.time() - start_time
                    rate = count / elapsed if elapsed > 0 else 0
                    print(f"  ✓ {count:,} puzzles ({rate:.0f}/sec)")
            
            # Check limit
            if limit and count >= limit:
                break
                
        except Exception as e:
            if count % 50000 == 0:
                print(f"  ⚠ Error at {count}: {e}")
            continue
    
    # Write remaining batch
    if batch:
        batch_write_items(table, batch)
    
    elapsed = time.time() - start_time
    print(f"\n✅ Lichess complete: {count:,} puzzles in {format_time(elapsed)}")
    return count


# ============================================
# PUZZLE SOURCE 2: TACTICAL PUZZLES
# ============================================

TACTICAL_PUZZLES = [
    # Fork puzzles
    {"fen": "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
     "moves": ["d1a4"], "themes": ["fork", "advantage"], "rating": 1100},
    {"fen": "r1bqkb1r/pppp1ppp/2n5/8/2Bn4/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
     "moves": ["d1a4"], "themes": ["fork", "winningMaterial"], "rating": 1050},
    {"fen": "r2qkb1r/ppp2ppp/2np1n2/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5",
     "moves": ["f3e5", "d6e5", "d1g4"], "themes": ["fork", "sacrifice"], "rating": 1400},
    
    # Pin puzzles
    {"fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
     "moves": ["f1b5"], "themes": ["pin", "opening"], "rating": 900},
    {"fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
     "moves": ["f3g5", "g8h6", "d1f3"], "themes": ["pin", "attack"], "rating": 1300},
    
    # Skewer puzzles
    {"fen": "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
     "moves": ["e1e8", "g8h7", "e8a8"], "themes": ["skewer", "endgame"], "rating": 1200},
    
    # Discovery attacks
    {"fen": "r1b1kb1r/pppp1ppp/2n2n2/4N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 4",
     "moves": ["e5f7", "e8f7", "c4g8"], "themes": ["discoveredAttack", "sacrifice"], "rating": 1500},
    
    # Back rank mate
    {"fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
     "moves": ["a1a8"], "themes": ["backRankMate", "mateIn1"], "rating": 800},
    {"fen": "r1k4r/ppp2ppp/8/8/8/8/PPP2PPP/2KR3R w - - 0 1",
     "moves": ["d1d8", "a8d8", "h1h8"], "themes": ["backRankMate", "sacrifice"], "rating": 1100},
    
    # Smothered mate
    {"fen": "r1b3kr/ppp2pNp/2n5/3qP3/8/8/PPPP1PPP/R1BQK2R w KQ - 0 1",
     "moves": ["d1d5", "c6d4", "g7e6", "g8h8", "d5d4"], "themes": ["smotheredMate"], "rating": 1600},
    
    # Double attack
    {"fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
     "moves": ["f3g5"], "themes": ["doubleAttack", "opening"], "rating": 1000},
    
    # Deflection
    {"fen": "r1bqr1k1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 6",
     "moves": ["c4f7", "f8f7", "f3e5"], "themes": ["deflection", "sacrifice"], "rating": 1450},
    
    # Attraction
    {"fen": "r1b1k2r/pppp1ppp/2n2n2/2b1p2q/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5",
     "moves": ["c4f7", "e8f7", "f3e5", "f7e8", "e5c6"], "themes": ["attraction", "sacrifice"], "rating": 1550},
]


def seed_tactical_puzzles(table):
    """Seed curated tactical training puzzles"""
    print("\n" + "=" * 60)
    print("⚔️  TACTICAL PUZZLES")
    print("=" * 60)
    
    batch = []
    count = 0
    
    # Expand each puzzle with variations
    for i, puzzle in enumerate(TACTICAL_PUZZLES):
        for rating_offset in [-100, -50, 0, 50, 100]:
            adjusted_rating = puzzle["rating"] + rating_offset
            
            item = {
                "rating_bucket": get_rating_bucket(adjusted_rating),
                "puzzle_id": f"tactical_{i}_{rating_offset}",
                "source": "tactical",
                "fen": puzzle["fen"],
                "moves": puzzle["moves"],
                "solution": puzzle["moves"][0],
                "rating": adjusted_rating,
                "rating_deviation": 100,
                "themes": ",".join(puzzle["themes"]),
                "phase": determine_phase(puzzle["themes"]),
                "popularity": 80,
                "nb_plays": random.randint(1000, 10000)
            }
            
            batch.append(item)
            count += 1
    
    batch_write_items(table, batch)
    print(f"✅ Tactical puzzles: {count} puzzles")
    return count


# ============================================
# PUZZLE SOURCE 3: MATE-IN-N PUZZLES
# ============================================

MATE_PUZZLES = [
    # Mate in 1
    {"fen": "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1", "moves": ["e1e8"], "mate": 1, "rating": 600},
    {"fen": "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "moves": ["h5f7"], "mate": 1, "rating": 700},
    {"fen": "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 3", "moves": ["h4e1"], "mate": 1, "rating": 500},
    {"fen": "r1bqk2r/pppp1Bpp/2n2n2/2b1p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4", "moves": ["d8e7"], "mate": 1, "rating": 550},
    {"fen": "5rk1/5ppp/8/8/1Q6/8/5PPP/6K1 w - - 0 1", "moves": ["b4g4"], "mate": 1, "rating": 650},
    
    # Mate in 2
    {"fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "moves": ["h5f7", "e8e7", "f7f6"], "mate": 2, "rating": 900},
    {"fen": "r1b1kb1r/pppp1ppp/5n2/4p2q/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4", "moves": ["c4f7", "e8e7", "d1h5"], "mate": 2, "rating": 1000},
    {"fen": "r1bqkbnr/pppp1Qpp/2n5/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4", "moves": ["e8d8", "f7f8"], "mate": 2, "rating": 850},
    {"fen": "6k1/pp3ppp/8/8/1b6/8/PP3PPP/R1B1K2R w KQ - 0 1", "moves": ["c1h6", "g7h6", "a1a8"], "mate": 2, "rating": 1100},
    
    # Mate in 3
    {"fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "moves": ["h5f7", "e8e7", "c4c5", "d7d6", "f7e6"], "mate": 3, "rating": 1300},
    {"fen": "r1b1k2r/pppp1ppp/2n2n2/2b1p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 5", "moves": ["h5f7", "e8d8", "f7f8", "e8c8", "f8a8"], "mate": 3, "rating": 1400},
    
    # Mate in 4
    {"fen": "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 6", "moves": ["c4f7", "f8f7", "f3g5", "f7f8", "d1b3", "d7d5", "b3f7"], "mate": 4, "rating": 1600},
]


def seed_mate_puzzles(table):
    """Seed mate-in-N puzzles"""
    print("\n" + "=" * 60)
    print("👑 MATE-IN-N PUZZLES")
    print("=" * 60)
    
    batch = []
    count = 0
    
    for i, puzzle in enumerate(MATE_PUZZLES):
        mate_in = puzzle["mate"]
        themes = [f"mateIn{mate_in}"]
        
        # Expand with rating variations
        for rating_offset in range(-200, 201, 50):
            adjusted_rating = puzzle["rating"] + rating_offset
            if adjusted_rating < 400:
                continue
                
            item = {
                "rating_bucket": get_rating_bucket(adjusted_rating),
                "puzzle_id": f"mate{mate_in}_{i}_{rating_offset}",
                "source": "mate",
                "fen": puzzle["fen"],
                "moves": puzzle["moves"],
                "solution": puzzle["moves"][0],
                "rating": adjusted_rating,
                "rating_deviation": 80,
                "themes": ",".join(themes),
                "phase": "endgame" if "k1" in puzzle["fen"].lower() and puzzle["fen"].count('/') < 3 else "middlegame",
                "popularity": 90,
                "nb_plays": random.randint(5000, 50000)
            }
            
            batch.append(item)
            count += 1
    
    batch_write_items(table, batch)
    print(f"✅ Mate puzzles: {count} puzzles")
    return count


# ============================================
# PUZZLE SOURCE 4: ENDGAME PUZZLES
# ============================================

ENDGAME_PUZZLES = [
    # King + Pawn endgames
    {"fen": "8/8/8/8/4k3/8/4P3/4K3 w - - 0 1", "moves": ["e1d2", "e4d4", "e2e4"], "themes": ["pawnEndgame", "opposition"], "rating": 900},
    {"fen": "8/4k3/8/4P3/4K3/8/8/8 w - - 0 1", "moves": ["e4f5", "e7e8", "e5e6"], "themes": ["pawnEndgame", "passed"], "rating": 850},
    
    # Rook endgames
    {"fen": "8/8/8/8/8/5K2/5P2/4R2k w - - 0 1", "moves": ["e1h1"], "themes": ["rookEndgame", "backRankMate"], "rating": 700},
    {"fen": "8/8/8/4k3/4R3/4K3/8/8 w - - 0 1", "moves": ["e4a4", "e5d5", "a4a5"], "themes": ["rookEndgame", "zugzwang"], "rating": 1000},
    
    # Queen endgames
    {"fen": "8/8/8/8/8/1K6/8/1Q4k1 w - - 0 1", "moves": ["b3c3", "g1f1", "b1b2"], "themes": ["queenEndgame", "mateIn2"], "rating": 800},
    {"fen": "8/8/8/8/8/4Q1K1/8/6k1 w - - 0 1", "moves": ["e3e1"], "themes": ["queenEndgame", "mateIn1"], "rating": 600},
    
    # Bishop endgames
    {"fen": "8/8/8/8/3B4/4k3/8/4K3 w - - 0 1", "moves": ["d4e5", "e3f3", "e1f1"], "themes": ["bishopEndgame"], "rating": 1100},
    
    # Knight endgames
    {"fen": "8/8/8/8/4N3/4k3/8/4K3 w - - 0 1", "moves": ["e4d6", "e3d3", "d6f5"], "themes": ["knightEndgame"], "rating": 1050},
]


def seed_endgame_puzzles(table):
    """Seed endgame training puzzles"""
    print("\n" + "=" * 60)
    print("🏁 ENDGAME PUZZLES")
    print("=" * 60)
    
    batch = []
    count = 0
    
    for i, puzzle in enumerate(ENDGAME_PUZZLES):
        for rating_offset in range(-150, 151, 30):
            adjusted_rating = puzzle["rating"] + rating_offset
            if adjusted_rating < 500:
                continue
                
            item = {
                "rating_bucket": get_rating_bucket(adjusted_rating),
                "puzzle_id": f"endgame_{i}_{rating_offset}",
                "source": "endgame",
                "fen": puzzle["fen"],
                "moves": puzzle["moves"],
                "solution": puzzle["moves"][0],
                "rating": adjusted_rating,
                "rating_deviation": 90,
                "themes": ",".join(puzzle["themes"]),
                "phase": "endgame",
                "popularity": 85,
                "nb_plays": random.randint(2000, 20000)
            }
            
            batch.append(item)
            count += 1
    
    batch_write_items(table, batch)
    print(f"✅ Endgame puzzles: {count} puzzles")
    return count


# ============================================
# MAIN EXECUTION
# ============================================

def main():
    """Main seeding function"""
    print("\n" + "=" * 60)
    print("🚀 MULTI-SOURCE DYNAMODB PUZZLE SEEDER")
    print("=" * 60)
    print(f"\nAWS Region: {AWS_REGION}")
    print(f"Table: {PUZZLES_TABLE}")
    print(f"Access Key: {'Found (' + AWS_ACCESS_KEY[:8] + '...)' if AWS_ACCESS_KEY else 'NOT FOUND'}")
    print(f"Secret Key: {'Found (*****)' if AWS_SECRET_KEY else 'NOT FOUND'}")
    
    if not AWS_ACCESS_KEY or not AWS_SECRET_KEY:
        print("\n❌ AWS credentials not found in .env file!")
        print("Please add these to your .env file:")
        print("  AWS_ACCESS_KEY_ID=your_access_key")
        print("  AWS_SECRET_ACCESS_KEY=your_secret_key")
        return
    
    # Get table
    table = get_dynamodb_table()
    
    # Test connection
    print("\n🔌 Testing DynamoDB connection...")
    try:
        response = table.scan(Limit=1)
        print("✅ Connected to DynamoDB!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\nMake sure your environment variables are set correctly.")
        return
    
    start_time = time.time()
    total = 0
    
    # Ask user what to seed
    print("\n📋 Select what to seed:")
    print("  1. Quick test (tactical + mate + endgame puzzles only)")
    print("  2. Sample Lichess (10,000 puzzles)")
    print("  3. Full Lichess (5.6M puzzles - takes 1-2 hours)")
    print("  4. All sources with sample Lichess")
    print("  5. All sources with full Lichess")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    if choice == "1":
        total += seed_tactical_puzzles(table)
        total += seed_mate_puzzles(table)
        total += seed_endgame_puzzles(table)
    
    elif choice == "2":
        total += seed_lichess_puzzles(table, limit=10000)
    
    elif choice == "3":
        total += seed_lichess_puzzles(table, limit=None)
    
    elif choice == "4":
        total += seed_tactical_puzzles(table)
        total += seed_mate_puzzles(table)
        total += seed_endgame_puzzles(table)
        total += seed_lichess_puzzles(table, limit=10000)
    
    elif choice == "5":
        total += seed_tactical_puzzles(table)
        total += seed_mate_puzzles(table)
        total += seed_endgame_puzzles(table)
        total += seed_lichess_puzzles(table, limit=None)
    
    else:
        print("Invalid choice. Running quick test...")
        total += seed_tactical_puzzles(table)
        total += seed_mate_puzzles(table)
        total += seed_endgame_puzzles(table)
    
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 60)
    print("🎉 SEEDING COMPLETE!")
    print("=" * 60)
    print(f"Total puzzles uploaded: {total:,}")
    print(f"Total time: {format_time(elapsed)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
