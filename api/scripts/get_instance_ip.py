import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def get_ip():
    ec2 = boto3.resource('ec2', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
    # Find running instance with tag Name=Chess-Platform-Server
    instances = ec2.instances.filter(
        Filters=[
            {'Name': 'tag:Name', 'Values': ['Chess-Platform-Server']},
            {'Name': 'instance-state-name', 'Values': ['running']}
        ]
    )
    
    found = False
    for instance in instances:
        print(f"✅ Found Instance: {instance.id}")
        print(f"🌍 Public IP: {instance.public_ip_address}")
        found = True
        break
        
    if not found:
        print("❌ No running 'Chess-Platform-Server' instance found.")

if __name__ == "__main__":
    get_ip()
