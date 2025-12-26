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
        source: Optional[str] = None,
        themes: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Get puzzles within a rating range, optionally filtered by source and themes.
        Uses multiple rating bucket queries for efficiency.
        """
        puzzles = []
        
        # Calculate which buckets we need to query
        start_bucket = (min_rating // 100) * 100
        end_bucket = (max_rating // 100) * 100
        buckets = [f"{b}-{b+99}" for b in range(start_bucket, end_bucket + 1, 100)]
        
        if not buckets:
            return []
            
        attempts = 0
        max_attempts = 10 # Allow more attempts to find specific themes
        
        while len(puzzles) < count and attempts < max_attempts:
            attempts += 1
            bucket = random.choice(buckets) # Pick random bucket for variety
            
            try:
                # Build Query Args
                query_args = {
                    'KeyConditionExpression': Key('rating_bucket').eq(bucket),
                    'Limit': 50 # Fetch batch
                }
                
                # Build Filter Expression
                filter_expr = None
                
                # Add Theme Filter
                if themes:
                    # Construct OR filter: contains(theme1) OR contains(theme2)...
                    theme_filter = None
                    for t in themes:
                        condition = Attr('themes').contains(t)
                        if theme_filter is None:
                            theme_filter = condition
                        else:
                            theme_filter = theme_filter | condition
                    filter_expr = theme_filter
                
                # Add Source Filter (AND)
                if source:
                    source_condition = Attr('source').eq(source)
                    if filter_expr is None:
                        filter_expr = source_condition
                    else:
                        filter_expr = filter_expr & source_condition
                
                if filter_expr is not None:
                    query_args['FilterExpression'] = filter_expr
                
                # Execute Query
                response = self.table.query(**query_args)
                
                items = response.get('Items', [])
                
                # Client-Side Double Check (DynamoDB FilterExpression is not always 100% strict on types/logic if schema varies)
                for item in items:
                    item = decimal_to_python(item)
                    rating = item.get('rating', 0)
                    
                    if min_rating <= rating <= max_rating:
                         puzzles.append(item)
                            
                if len(puzzles) >= count:
                    break
                            
            except Exception as e:
                print(f"Error querying bucket {bucket}: {e}")
                continue
        
        # Shuffle and limit
        random.shuffle(puzzles)
        return puzzles[:count]
    
    def get_puzzles_by_phase(self, phase: str, count: int = 10) -> List[Dict]:
        """Get puzzles by game phase (opening, middlegame, endgame) with optimization"""
        
        # Check cache first (conceptually - implementation would be here)
        # cache_key = f"phase:{phase}:{count}"
        
        # Map phase to typical rating ranges
        phase_ratings = {
            "opening": (600, 1200),
            "middlegame": (1000, 1800),
            "endgame": (800, 1600)
        }
        
        min_rating, max_rating = phase_ratings.get(phase, (800, 1400))
        
        # 1. OPTIMIZATION: Use 'phase' as a filter on Rating Bucket Queries
        # Just like with themes, query buckets in the rating range and filter by phase.
        # This is VASTLY faster than scanning or getting random puzzles and filtering.
        
        puzzles = []
        attempts = 0
        max_attempts = 5
        
        start_bucket_val = (min_rating // 100) * 100
        end_bucket_val = (max_rating // 100) * 100
        relevant_buckets = [f"{i}-{i+99}" for i in range(start_bucket_val, end_bucket_val + 1, 100)]
        
        if not relevant_buckets:
             return self.get_puzzles_by_rating_range(min_rating, max_rating, count)

        while len(puzzles) < count and attempts < max_attempts:
            attempts += 1
            bucket = random.choice(relevant_buckets)
            
            try:
                response = self.table.query(
                    KeyConditionExpression=Key('rating_bucket').eq(bucket),
                    FilterExpression=Attr('phase').eq(phase),
                    Limit=50
                )
                
                items = response.get('Items', [])
                for item in items:
                    item = decimal_to_python(item)
                    if min_rating <= item.get('rating', 0) <= max_rating:
                        puzzles.append(item)
                
                if len(puzzles) >= count:
                    break
                    
            except Exception as e:
                print(f"Error querying bucket {bucket} for phase {phase}: {e}")
        
        # If we failed to get enough specific phase puzzles, fallback to general rating range
        if len(puzzles) < count:
            print(f"Phase optimization yielded {len(puzzles)} puzzles, falling back to general rating search.")
            fallback = self.get_puzzles_by_rating_range(min_rating, max_rating, count - len(puzzles))
            puzzles.extend(fallback)
            
        random.shuffle(puzzles)
        return puzzles[:count]

    def get_puzzles_by_theme(
        self, 
        theme: str, 
        count: int = 10,
        min_rating: int = 0,
        max_rating: int = 3000
    ) -> List[Dict]:
        """Get puzzles that include a specific theme using GSI if available, else optimized query"""
        # OPTIMIZATION: Use the new get_puzzles_by_rating_range support for themes
        return self.get_puzzles_by_rating_range(
            min_rating=min_rating,
            max_rating=max_rating,
            count=count,
            themes=[theme]
        )
    
    def get_curriculum_puzzles(
        self,
        min_rating: int,
        max_rating: int,
        themes: Optional[List[str]] = None,
        count: int = 10
    ) -> List[Dict]:
        """Get puzzles for curriculum-based training"""
        # Efficiently query with theme filters pushed to DynamoDB
        puzzles = self.get_puzzles_by_rating_range(
            min_rating=min_rating, 
            max_rating=max_rating, 
            count=count,
            themes=themes
        )
        
        # Fallback: If strict theme search yields nothing (or too few),
        # fetch generic puzzles in that rating range to prevent empty state.
        if len(puzzles) < 5:
            # print(f"Curriculum: Low match count ({len(puzzles)}) for themes {themes}, fetching fallback.")
            fallback = self.get_puzzles_by_rating_range(
                min_rating=min_rating,
                max_rating=max_rating,
                count=count - len(puzzles),
                themes=None # No theme filter
            )
            puzzles.extend(fallback)
            
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
