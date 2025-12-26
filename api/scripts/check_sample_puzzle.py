import boto3
import os
import json
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_sample_item():
    try:
        dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
        table = dynamodb.Table(os.getenv('DYNAMODB_PUZZLES_TABLE', 'chess-puzzles'))
        
        # Scan specifically for one item
        response = table.scan(Limit=1)
        items = response.get('Items', [])
        
        if items:
            print("\n✅ Found Puzzle Item:")
            print(json.dumps(items[0], cls=DecimalEncoder, indent=2))
        else:
            print("❌ No items found in table.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_sample_item()
