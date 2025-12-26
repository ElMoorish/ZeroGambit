import boto3
import os
import time
from dotenv import load_dotenv

load_dotenv()

def provision_ec2():
    print("🚀 Starting AWS Infrastructure Provisioning...")
    
    # Initialize sessions
    ec2 = boto3.client('ec2', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
    ec2_resource = boto3.resource('ec2', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
    
    # Configuration
    TAGS = [
        {'Key': 'Name', 'Value': 'Chess-Platform-Server'},
        {'Key': 'Project', 'Value': 'ChessPlatform'},
        {'Key': 'Environment', 'Value': 'Production'},
        {'Key': 'Owner', 'Value': 'DevOps'},
        {'Key': 'ManagedBy', 'Value': 'Boto3Script'}
    ]

    # 1. Create Key Pair
    key_name = 'chess-platform-key'
    try:
        # Check if key exists
        ec2.describe_key_pairs(KeyNames=[key_name])
        print(f"✅ Key Pair '{key_name}' already exists.")
    except Exception:
        print(f"🔑 Creating Key Pair '{key_name}'...")
        key_pair = ec2.create_key_pair(
            KeyName=key_name,
            TagSpecifications=[{'ResourceType': 'key-pair', 'Tags': TAGS}]
        )
        # Save private key locally
        with open(f"{key_name}.pem", "w") as f:
            f.write(key_pair['KeyMaterial'])
        print(f"✅ Key saved to {key_name}.pem (KEEP THIS SAFE!)")
        os.chmod(f"{key_name}.pem", 0o400)

    # 2. Create Security Group
    sg_name = 'chess-platform-sg'
    try:
        response = ec2.describe_security_groups(GroupNames=[sg_name])
        sg_id = response['SecurityGroups'][0]['GroupId']
        print(f"✅ Security Group '{sg_name}' found ({sg_id}).")
    except Exception:
        print(f"🛡️ Creating Security Group '{sg_name}'...")
        response = ec2.create_security_group(
            GroupName=sg_name,
            Description='Security group for Chess Platform (SSH, HTTP, HTTPS)',
            TagSpecifications=[{'ResourceType': 'security-group', 'Tags': TAGS}]
        )
        sg_id = response['GroupId']
        
        # Add Rules
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                # SSH
                {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                # HTTP
                {'IpProtocol': 'tcp', 'FromPort': 80, 'ToPort': 80, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                # HTTPS
                {'IpProtocol': 'tcp', 'FromPort': 443, 'ToPort': 443, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                # App (Direct test)
                {'IpProtocol': 'tcp', 'FromPort': 3000, 'ToPort': 3000, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                # Backend (Direct test)
                {'IpProtocol': 'tcp', 'FromPort': 8000, 'ToPort': 8000, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
            ]
        )
        print(f"✅ Security Group Rules added.")

    # 3. Launch Instance (t3.medium)
    print("🖥️  Launching t3.medium instance...")
    
    # Amazon Linux 2023 AMI (eu-north-1) - Need to fetch latest dynamically or use fixed
    # Using dynamic fetch for Amazon Linux 2023
    ssm = boto3.client('ssm', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
    response = ssm.get_parameter(
        Name='/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64'
    )
    ami_id = response['Parameter']['Value']
    
    instances = ec2_resource.create_instances(
        ImageId=ami_id,
        MinCount=1,
        MaxCount=1,
        InstanceType='t3.medium',
        KeyName=key_name,
        SecurityGroupIds=[sg_id],
        TagSpecifications=[
            {'ResourceType': 'instance', 'Tags': TAGS},
            {'ResourceType': 'volume', 'Tags': TAGS} # Tag the EBS volume too
        ],
        BlockDeviceMappings=[{
            'DeviceName': '/dev/xvda',
            'Ebs': {
                'VolumeSize': 20, # 20GB Storage
                'VolumeType': 'gp3'
            }
        }]
    )
    
    instance = instances[0]
    print(f"⏳ Waiting for instance {instance.id} to be running...")
    instance.wait_until_running()
    instance.reload()
    
    print("\n" + "="*50)
    print("✅ INSTANCE PROVISIONED SUCCESSFULLY!")
    print("="*50)
    print(f"Public IP: {instance.public_ip_address}")
    print(f"Instance ID: {instance.id}")
    print(f"SSH Command: ssh -i {key_name}.pem ec2-user@{instance.public_ip_address}")
    print("="*50)

if __name__ == "__main__":
    provision_ec2()
