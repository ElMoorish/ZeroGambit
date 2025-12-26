import paramiko
import os
from dotenv import load_dotenv

load_dotenv()

HOST = "16.171.21.130"
USER = "ec2-user"
KEY_FILE = "chess-platform-key.pem"

def test_stockfish():
    print(f"♟️ Testing Stockfish on {HOST}...")
    k = paramiko.RSAKey.from_private_key_file(KEY_FILE)
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        c.connect(hostname=HOST, username=USER, pkey=k)
        
        # Command to run stockfish inside the container
        # We send 'uci' command to stockfish and expect 'uciok' response
        cmd = "sudo docker exec -i gg-backend /usr/local/bin/stockfish"
        
        print(f"> {cmd}")
        stdin, stdout, stderr = c.exec_command(cmd)
        
        # Write 'uci' to stdin
        stdin.write("uci\n")
        stdin.write("quit\n")
        stdin.flush()
        
        print("Output:")
        print(stdout.read().decode())
        print("Errors:")
        print(stderr.read().decode())
                
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
    finally:
        c.close()

if __name__ == "__main__":
    test_stockfish()
