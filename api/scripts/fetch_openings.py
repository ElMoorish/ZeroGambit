
import requests
import json
import os

def fetch_and_process_openings():
    urls = [
        "https://raw.githubusercontent.com/niklasf/eco/master/eco.json",
        "https://raw.githubusercontent.com/hayatbiralem/eco.json/main/eco.json",
        "https://raw.githubusercontent.com/hayatbiralem/eco.json/master/eco.json"
    ]
    
    all_openings = []
    
    print("Fetching openings data...")
    success = False
    data = []
    
    for url in urls:
        print(f"Trying {url}...")
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"✓ Successfully fetched from {url}")
                data = response.json()
                success = True
                break
            else:
                print(f"❌ Failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error fetching {url}: {e}")
            
    if not success:
        print("❌ Could not fetch openings from any source.")
        return

    # Process filtered data
    count = 0
    for item in data:
        # Check required fields
        if "eco" not in item or "name" not in item or "moves" not in item:
            continue
            
        moves_list = []
        if isinstance(item["moves"], str):
            moves_list = item["moves"].split(" ")
        elif isinstance(item["moves"], list):
            moves_list = item["moves"]
        
        # Filter out very short lines if needed, or just keep them
        if len(moves_list) < 2: 
            continue
            
        opening = {
            "eco": item["eco"],
            "name": item["name"],
            "moves": moves_list,
            "description": item.get("description", f"Variation of {item['name']}"),
            # We can leave teaching content empty for these bulk imported ones
        }
        all_openings.append(opening)
        count += 1
        if count >= 600: # Limit to ~600 to satisfy "500+" without being too huge
            break
    
    print(f"✓ Processed {len(all_openings)} openings from external source")

    # Load existing expanded openings to preserve teaching content
    current_path = os.path.join(os.path.dirname(__file__), "..", "data", "openings_expanded.json")
    existing_openings = []
    if os.path.exists(current_path):
        with open(current_path, "r") as f:
            existing_openings = json.load(f)
    
    print(f"Loaded {len(existing_openings)} existing openings with teaching content")
    
    # Merge: Keep existing (prioritize them as they have teaching content) and append new unique ones
    final_list = existing_openings.copy()
    existing_keys = set((o["eco"], o["name"]) for o in existing_openings)
    
    added_new = 0
    for op in all_openings:
        key = (op["eco"], op["name"])
        if key not in existing_keys:
            final_list.append(op)
            existing_keys.add(key)
            added_new += 1
            
    print(f"Merged: {len(final_list)} total openings (Added {added_new} new ones)")
    
    # Save back to file
    with open(current_path, "w") as f:
        json.dump(final_list, f, indent=2)
    
    print(f"✅ Successfully saved to {current_path}")

if __name__ == "__main__":
    fetch_and_process_openings()
