
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
        print("\nScanning all 'E' openings for schema validity...")
        cursor = db.openings.find({"eco": {"$regex": "^E"}}).limit(2000)
        valid = 0
        invalid = 0
        
        async for doc in cursor:
            try:
                # Basic Type Checks matching Pydantic
                if not isinstance(doc.get('eco'), str): raise ValueError("eco not string")
                if not isinstance(doc.get('name'), str): raise ValueError("name not string")
                if not isinstance(doc.get('moves'), list): raise ValueError("moves not list")
                if not isinstance(doc.get('fen'), str): raise ValueError("fen not string")
                if not isinstance(doc.get('numMoves'), int): raise ValueError("numMoves not int")
                
                # Check optional list fields if present
                for field in ['keyIdeas', 'typicalPlans', 'commonTraps']:
                    if field in doc and not isinstance(doc[field], list):
                        raise ValueError(f"{field} is present but not a list")

                valid += 1
            except Exception as e:
                print(f"❌ Invalid Doc {doc.get('eco', '?')}: {e}")
                invalid += 1
                if invalid < 5: pprint.pprint(doc)

        print(f"\nSummary: {valid} valid, {invalid} invalid.")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
