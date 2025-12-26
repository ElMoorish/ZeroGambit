"""
MongoDB Database Connection
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os

# Global database client and flag
client: AsyncIOMotorClient = None
db = None
_connected = False


async def connect_db():
    """Connect to MongoDB Atlas"""
    global client, db, _connected
    
    mongodb_uri = os.getenv("MONGODB_URI")
    # Force DB name to match seeded data
    db_name = "grandmaster_guard"
    
    if not mongodb_uri:
        print("Warning: MONGODB_URI not set, using local MongoDB")
        mongodb_uri = "mongodb://localhost:27017"
    
    client = AsyncIOMotorClient(
        mongodb_uri,
        server_api=ServerApi('1')
    )
    
    db = client[db_name]
    _connected = True
    
    # Create indexes
    await db.games.create_index("platform_id", unique=True)
    await db.games.create_index("username")
    await db.games.create_index("platform")
    await db.games.create_index("date")
    # Puzzle index
    await db.puzzles.create_index("id", unique=True)
    await db.puzzles.create_index("phase")
    await db.puzzles.create_index("rating")
    
    print(f"Connected to MongoDB: {db_name}")


async def close_db():
    """Close database connection"""
    global client, _connected
    if _connected and client is not None:
        client.close()
        _connected = False
        print("MongoDB connection closed")


def get_db():
    """Get database instance"""
    return db


def get_games_collection():
    """Get games collection"""
    if _connected:
        return db.games
    return None


def get_users_collection():
    """Get users collection"""
    if _connected:
        return db.users
    return None


def get_puzzles_collection():
    """Get puzzles collection"""
    if _connected:
        return db.puzzles
    return None
