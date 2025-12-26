"""
DynamoDB Service for Chess Puzzles
Provides fast, scalable access to puzzle database using AWS DynamoDB
"""

import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
from typing import List, Dict, Optional
from decimal import Decimal
import random
from functools import lru_cache


# Get AWS credentials from environment
AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")
PUZZLES_TABLE = os.getenv("DYNAMODB_PUZZLES_TABLE", "chess-puzzles")


def get_dynamodb_resource():
    """Get DynamoDB resource with credentials from environment"""
    return boto3.resource(
        'dynamodb',
        region_name=AWS_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )


def get_puzzles_table():
    """Get the puzzles table"""
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(PUZZLES_TABLE)


def decimal_to_python(obj):
    """Convert DynamoDB Decimal types to Python native types"""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_python(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_python(i) for i in obj]
    return obj


def get_rating_bucket(rating: int) -> str:
    """Convert rating to a bucket key (100-point ranges)"""
    bucket_start = (rating // 100) * 100
    return f"{bucket_start}-{bucket_start + 99}"


class DynamoDBPuzzleService:
    """Service for fetching puzzles from DynamoDB"""
    
    def __init__(self):
        self.table = get_puzzles_table()
    
    def get_puzzles_by_rating_range(
        self, 
        min_rating: int, 
        max_rating: int, 
        count: int = 10,
        source: Optional[str] = None
    ) -> List[Dict]:
        """
        Get puzzles within a rating range.
        Uses multiple rating bucket queries for efficiency.
        """
        puzzles = []
        
        # Calculate which buckets we need to query
        start_bucket = (min_rating // 100) * 100
        end_bucket = (max_rating // 100) * 100
        
        for bucket_start in range(start_bucket, end_bucket + 1, 100):
            rating_bucket = f"{bucket_start}-{bucket_start + 99}"
            
            try:
                # Query by partition key (rating_bucket)
                response = self.table.query(
                    KeyConditionExpression=Key('rating_bucket').eq(rating_bucket),
                    Limit=count * 2  # Get extra to allow for filtering
                )
                
                items = response.get('Items', [])
                
                # Filter by exact rating range and optional source
                for item in items:
                    item = decimal_to_python(item)
                    rating = item.get('rating', 0)
                    
                    if min_rating <= rating <= max_rating:
                        if source is None or item.get('source') == source:
                            puzzles.append(item)
                            
            except Exception as e:
                print(f"Error querying bucket {rating_bucket}: {e}")
                continue
        
        # Shuffle and limit
        random.shuffle(puzzles)
        return puzzles[:count]
    
    def get_puzzles_by_phase(self, phase: str, count: int = 10) -> List[Dict]:
        """Get puzzles by game phase (opening, middlegame, endgame)"""
        # Map phase to typical rating ranges
        phase_ratings = {
            "opening": (600, 1200),
            "middlegame": (1000, 1800),
            "endgame": (800, 1600)
        }
        
        min_rating, max_rating = phase_ratings.get(phase, (800, 1400))
        
        puzzles = self.get_puzzles_by_rating_range(min_rating, max_rating, count * 3)
        
        # Filter by phase
        phase_puzzles = [p for p in puzzles if p.get('phase') == phase]
        
        if len(phase_puzzles) < count:
            # If not enough, return what we have plus some from general pool
            return phase_puzzles + puzzles[:count - len(phase_puzzles)]
        
        return phase_puzzles[:count]
    
    def get_puzzles_by_theme(
        self, 
        theme: str, 
        count: int = 10,
        min_rating: int = 0,
        max_rating: int = 3000
    ) -> List[Dict]:
        """Get puzzles that include a specific theme"""
        # Scan with filter (less efficient, but works without GSI)
        try:
            response = self.table.scan(
                FilterExpression=Attr('themes').contains(theme),
                Limit=count * 5
            )
            
            items = [decimal_to_python(item) for item in response.get('Items', [])]
            
            # Filter by rating range
            filtered = [
                p for p in items 
                if min_rating <= p.get('rating', 0) <= max_rating
            ]
            
            random.shuffle(filtered)
            return filtered[:count]
            
        except Exception as e:
            print(f"Error getting puzzles by theme {theme}: {e}")
            return []
    
    def get_curriculum_puzzles(
        self,
        min_rating: int,
        max_rating: int,
        themes: Optional[List[str]] = None,
        count: int = 10
    ) -> List[Dict]:
        """Get puzzles for curriculum-based training"""
        puzzles = self.get_puzzles_by_rating_range(min_rating, max_rating, count * 3)
        
        if themes:
            # Filter to puzzles that have at least one matching theme
            theme_set = set(t.lower() for t in themes)
            filtered = []
            for p in puzzles:
                puzzle_themes = p.get('themes', '')
                if isinstance(puzzle_themes, str):
                    puzzle_themes = puzzle_themes.lower().split(',')
                else:
                    puzzle_themes = [t.lower() for t in puzzle_themes]
                
                if any(t in theme_set for t in puzzle_themes):
                    filtered.append(p)
            
            puzzles = filtered
        
        random.shuffle(puzzles)
        return puzzles[:count]
    
    def get_random_puzzle(self) -> Optional[Dict]:
        """Get a single random puzzle"""
        # Pick a random rating bucket
        bucket_start = random.randint(6, 25) * 100  # 600-2500
        rating_bucket = f"{bucket_start}-{bucket_start + 99}"
        
        try:
            response = self.table.query(
                KeyConditionExpression=Key('rating_bucket').eq(rating_bucket),
                Limit=10
            )
            
            items = response.get('Items', [])
            if items:
                item = random.choice(items)
                return decimal_to_python(item)
                
        except Exception as e:
            print(f"Error getting random puzzle: {e}")
        
        return None
    
    def get_puzzle_count(self) -> int:
        """Get approximate total puzzle count"""
        try:
            response = self.table.scan(Select='COUNT')
            return response.get('Count', 0)
        except Exception as e:
            print(f"Error getting puzzle count: {e}")
            return 0


# Singleton instance
_puzzle_service: Optional[DynamoDBPuzzleService] = None


def get_dynamodb_puzzle_service() -> DynamoDBPuzzleService:
    """Get or create the DynamoDB puzzle service singleton"""
    global _puzzle_service
    if _puzzle_service is None:
        _puzzle_service = DynamoDBPuzzleService()
    return _puzzle_service
