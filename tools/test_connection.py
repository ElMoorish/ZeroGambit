
import sys
import time
import urllib.request
import urllib.error

# The Tunnel URL provided by user
TUNNEL_URL = "https://english-bidder-addressed-template.trycloudflare.com"

def test_endpoint(path):
    url = f"{TUNNEL_URL}{path}"
    print(f"Testing {url}...")
    try:
        with urllib.request.urlopen(url) as response:
            print(f"✅ Status: {response.status}")
            print(f"📄 Content: {response.read().decode('utf-8')[:100]}...")
            return True
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code} {e.reason}")
        print(f"Body: {e.read().decode()}")
    except urllib.error.URLError as e:
        print(f"❌ Connection Error: {e.reason}")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
    return False

if __name__ == "__main__":
    print(f"Using Tunnel URL: {TUNNEL_URL}")
    
    # 1. Health Check
    print("\n--- 1. Health Check ---")
    if test_endpoint("/api/health"):
        print("Backend is reachable!")
    else:
        print("Backend unreachable via tunnel.")
        sys.exit(1)

    # 2. Categories (Verify DB connection & data)
    print("\n--- 2. Fetch Categories ---")
    test_endpoint("/api/openings/categories")

    # 3. List Openings (The problematic endpoint)
    print("\n--- 3. List Openings (ECO=E) ---")
    # Note: URL encoding for query params? minimal strings should be fine.
    test_endpoint("/api/openings/?eco=E&limit=5")
    
    print("\nDone. Please check backend logs now to see if these requests appeared!")
