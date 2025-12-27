
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import pprint

async def check_db():
    uri = os.getenv("MONGODB_URI", "mongodb://mongodb:27017/grandmaster_guard")
    print(f"Connecting to {uri}")
    client = AsyncIOMotorClient(uri)
    db = client.grandmaster_guard
    
    # Check Exx count
    count = await db.openings.count_documents({"eco": {"$regex": "^E"}})
    print(f"Found {count} openings starting with 'E'")
    
    if count > 0:
        # Fetch first 5
        cursor = db.openings.find({"eco": {"$regex": "^E"}}).limit(5)
        print("\n--- Sample Document 1 ---")
        async for doc in cursor:
            pprint.pprint(doc)
            
            # Validation Check
            missing = []
            if "eco" not in doc: missing.append("eco")
            if "name" not in doc: missing.append("name")
            if "moves" not in doc: missing.append("moves")
            if "fen" not in doc: missing.append("fen")
            if "numMoves" not in doc: missing.append("numMoves")
            
            if missing:
                print(f"⚠️ MISSING FIELDS: {missing}")
            else:
                print("✅ Basic fields present")
                
            print(f"Moves type: {type(doc['moves'])}")
            if isinstance(doc['moves'], list) and len(doc['moves']) > 0:
                 print(f"Moves sample: {doc['moves'][0]} ({type(doc['moves'][0])})")
            
            break # Just one
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
