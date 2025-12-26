import paramiko
import re

HOST = "16.171.21.130"
USER = "ec2-user"
KEY_FILE = "chess-platform-key.pem"

def get_tunnel_url():
    print(f"🚀 Connecting to {HOST}...")
    k = paramiko.RSAKey.from_private_key_file(KEY_FILE)
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        c.connect(hostname=HOST, username=USER, pkey=k)
        print("✅ Connected!")
        
        # Get logs from tunnel container
        print("🔍 Fetching tunnel logs...")
        stdin, stdout, stderr = c.exec_command("sudo docker logs gg-tunnel")
        logs = stderr.read().decode() + stdout.read().decode() # cloudflared often output to stderr
        
        # Find URL
        match = re.search(r'https://[\w-]+\.trycloudflare\.com', logs)
        if match:
            print(f"\n🎉 FOUND TUNNEL URL: {match.group(0)}")
        else:
            print("❌ URL not found in logs yet. Logs:")
            print(logs[-500:])

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        c.close()

if __name__ == "__main__":
    get_tunnel_url()
