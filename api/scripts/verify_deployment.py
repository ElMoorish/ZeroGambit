import requests
import time

HOST = "16.171.21.130"
PORT = 8000
URL = f"http://{HOST}:{PORT}/api/health"

def verify_deployment():
    print(f"🕵️ Verifying deployment at {URL}...")
    
    for i in range(12): # Try for 60 seconds
        try:
            response = requests.get(URL, timeout=5)
            if response.status_code == 200:
                print("✅ Deployment Successful!")
                print("Response:", response.json())
                return
            else:
                print(f"⚠️ Status Code: {response.status_code}")
        except Exception as e:
            print(f"⏳ Waiting for service... ({e})")
        
        time.sleep(5)
        
    print("❌ Deployment Verification Failed (Timed Out)")

if __name__ == "__main__":
    verify_deployment()
