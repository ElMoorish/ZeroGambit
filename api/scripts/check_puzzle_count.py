import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def check_count():
    try:
        dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
        table = dynamodb.Table(os.getenv('DYNAMODB_PUZZLES_TABLE', 'chess-puzzles'))
        
        # approximate item count is fast and free
        print(f"Checking table: {table.name}")
        print(f"Approximate Item Count: {table.item_count}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_count()
