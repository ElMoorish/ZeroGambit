import paramiko
import os
import time
from dotenv import load_dotenv

load_dotenv()

HOST = "16.171.21.130"
USER = "ec2-user"
KEY_FILE = "chess-platform-key.pem"

def setup_server():
    print(f"🚀 Connecting to {HOST}...")
    
    k = paramiko.RSAKey.from_private_key_file(KEY_FILE)
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        c.connect(hostname=HOST, username=USER, pkey=k)
        print("✅ Connected successfully!")
        
        # Phase 1: System Setup & Git Clone
        commands_part_1 = [
            "sudo fallocate -l 4G /swapfile || true",
            "sudo chmod 600 /swapfile || true",
            "sudo mkswap /swapfile || true",
            "sudo swapon /swapfile || true",
            "sudo dnf update -y",
            "sudo dnf install -y docker",
            "sudo systemctl start docker",
            "sudo systemctl enable docker",
            "sudo usermod -aG docker ec2-user",
            "sudo dnf install -y docker-compose-plugin || true",
            "sudo mkdir -p /usr/local/lib/docker/cli-plugins",
            "sudo mkdir -p /usr/lib/docker/cli-plugins",
            "sudo mkdir -p /usr/libexec/docker/cli-plugins",
            "sudo mkdir -p /root/.docker/cli-plugins",
            "sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose",
            "sudo cp /usr/local/lib/docker/cli-plugins/docker-compose /usr/lib/docker/cli-plugins/docker-compose",
            "sudo cp /usr/local/lib/docker/cli-plugins/docker-compose /usr/libexec/docker/cli-plugins/docker-compose",
            "sudo cp /usr/local/lib/docker/cli-plugins/docker-compose /root/.docker/cli-plugins/docker-compose",
            "sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose",
            "sudo chmod +x /usr/lib/docker/cli-plugins/docker-compose",
            "sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose",
            "sudo chmod +x /root/.docker/cli-plugins/docker-compose",
            "sudo dnf install -y git",
            "rm -rf ZeroGambit",
            "git clone https://github.com/ElMoorish/ZeroGambit.git",
            f"cd ZeroGambit && echo 'MONGODB_URI=mongodb://mongodb:27017/grandmaster_guard' > .env",
            f"cd ZeroGambit && echo 'STOCKFISH_PATH=/usr/local/bin/stockfish' >> .env",
            f"cd ZeroGambit && echo 'AWS_ACCESS_KEY_ID={os.getenv('AWS_ACCESS_KEY_ID')}' >> .env",
            f"cd ZeroGambit && echo 'AWS_SECRET_ACCESS_KEY={os.getenv('AWS_SECRET_ACCESS_KEY')}' >> .env",
            f"cd ZeroGambit && echo 'AWS_REGION={os.getenv('AWS_REGION', 'eu-north-1')}' >> .env",
        ]

        def run_cmds(cmds):
            for cmd in cmds:
                print(f"🔄 Running: {cmd}")
                stdin, stdout, stderr = c.exec_command(cmd)
                out = stdout.read().decode()
                err = stderr.read().decode()
                if out: print(f"   STDOUT: {out}")
                if err: print(f"   STDERR: {err}")
                if stdout.channel.recv_exit_status() == 0:
                    print("   ✅ Success")
                else:
                    print(f"   ❌ Failed: {cmd}")

        print("\n--- PHASE 1: System Init ---")
        run_cmds(commands_part_1)

        # Phase 2: SFTP Upload of local docker-compose.prod.yml
        print("\n--- PHASE 2: Upload Config ---")
        try:
            transport = c.get_transport()
            sftp = paramiko.SFTPClient.from_transport(transport)
            local_compose = os.path.join(os.getcwd(), 'docker-compose.prod.yml')
            remote_compose = '/home/ec2-user/ZeroGambit/docker-compose.prod.yml' 
            
            print(f"📂 Uploading {local_compose} to {remote_compose}...")
            sftp.put(local_compose, remote_compose)
            print("✅ Upload successful!")
            sftp.close()
        except Exception as e:
            print(f"❌ Upload failed: {e}")

        # Phase 3: Start Docker
        print("\n--- PHASE 3: Launch Containers ---")
        commands_part_2 = [
             "echo '🚀 Starting Docker Compose...'",
             "cd ZeroGambit && sudo docker compose -f docker-compose.prod.yml up -d --build",
             "echo '✅ Backend Deployed successfully!'",
             "sudo docker ps"
        ]
        run_cmds(commands_part_2)


                
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
    finally:
        c.close()

if __name__ == "__main__":
    setup_server()
