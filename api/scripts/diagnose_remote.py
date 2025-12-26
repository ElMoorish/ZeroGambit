import paramiko
import os
from dotenv import load_dotenv

load_dotenv()

HOST = "16.171.21.130"
USER = "ec2-user"
KEY_FILE = "chess-platform-key.pem"

def diagnose():
    print(f"🩺 Diagnosing {HOST}...")
    k = paramiko.RSAKey.from_private_key_file(KEY_FILE)
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        c.connect(hostname=HOST, username=USER, pkey=k)
        
        commands = [
            "echo '--- Docker Processes ---'",
            "sudo docker ps -a",
            "echo '--- Backend Logs (Last 100 lines) ---'",
            "sudo docker logs gg-backend --tail 100"
        ]
        
        for cmd in commands:
            print(f"\n> {cmd}")
            stdin, stdout, stderr = c.exec_command(cmd)
            print(stdout.read().decode())
            print(stderr.read().decode())
                
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
    finally:
        c.close()

if __name__ == "__main__":
    diagnose()
