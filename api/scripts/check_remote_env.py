import paramiko
import os
from dotenv import load_dotenv

load_dotenv()

HOST = "16.171.21.130"
USER = "ec2-user"
KEY_FILE = "chess-platform-key.pem"

def check_env():
    print(f"🔍 Checking Env Vars on {HOST}...")
    k = paramiko.RSAKey.from_private_key_file(KEY_FILE)
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        c.connect(hostname=HOST, username=USER, pkey=k)
        
        cmd = "sudo docker exec -i gg-backend env | grep STOCKFISH"
        
        print(f"> {cmd}")
        stdin, stdout, stderr = c.exec_command(cmd)
        
        print("Output:")
        print(stdout.read().decode())
                
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
    finally:
        c.close()

if __name__ == "__main__":
    check_env()
