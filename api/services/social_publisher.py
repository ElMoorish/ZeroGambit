"""
Social Media Publisher - Upload videos to TikTok and Instagram
"""

import httpx
import os
from typing import Optional
from pathlib import Path

# API Configuration (to be set via environment variables)
TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "")
INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_USER_ID = os.getenv("INSTAGRAM_USER_ID", "")


class TikTokPublisher:
    """
    TikTok Content Posting API client.
    
    Prerequisites:
    - Registered app on TikTok for Developers
    - video.upload or video.publish scope approved
    - User authorization with access token
    """
    
    BASE_URL = "https://open.tiktokapis.com/v2"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.client = httpx.AsyncClient(timeout=120)
    
    async def upload_video(
        self,
        video_path: str,
        caption: str = "",
        hashtags: list[str] = None,
        draft: bool = True  # Upload as draft (user completes in TikTok app)
    ) -> dict:
        """
        Upload video to TikTok.
        
        Args:
            video_path: Local path to MP4 video
            caption: Video description
            hashtags: List of hashtags to include
            draft: If True, upload as draft; if False, publish directly
            
        Returns:
            dict with status and publish_id
        """
        if hashtags:
            caption = f"{caption} {' '.join(f'#{tag}' for tag in hashtags)}"
        
        # Step 1: Initialize upload
        endpoint = "inbox/video/init" if draft else "video/init"
        init_url = f"{self.BASE_URL}/post/publish/{endpoint}/"
        
        video_size = os.path.getsize(video_path)
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        init_data = {
            "post_info": {
                "title": caption[:150],  # TikTok title limit
                "privacy_level": "SELF_ONLY" if draft else "PUBLIC_TO_EVERYONE",
            },
            "source_info": {
                "source": "FILE_UPLOAD",
                "video_size": video_size,
                "chunk_size": video_size,  # Single chunk upload
                "total_chunk_count": 1
            }
        }
        
        try:
            # Initialize upload
            response = await self.client.post(init_url, json=init_data, headers=headers)
            response.raise_for_status()
            init_result = response.json()
            
            upload_url = init_result.get("data", {}).get("upload_url")
            publish_id = init_result.get("data", {}).get("publish_id")
            
            if not upload_url:
                return {"success": False, "error": "No upload URL received"}
            
            # Step 2: Upload video file
            with open(video_path, "rb") as f:
                video_data = f.read()
            
            upload_headers = {
                "Content-Type": "video/mp4",
                "Content-Length": str(video_size),
                "Content-Range": f"bytes 0-{video_size-1}/{video_size}"
            }
            
            upload_response = await self.client.put(
                upload_url,
                content=video_data,
                headers=upload_headers
            )
            upload_response.raise_for_status()
            
            return {
                "success": True,
                "publish_id": publish_id,
                "draft": draft,
                "message": "Video uploaded to drafts" if draft else "Video published"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}


class InstagramPublisher:
    """
    Instagram Graph API client for Reels publishing.
    
    Prerequisites:
    - Instagram Business or Creator Account
    - Facebook Developer App with Instagram Graph API
    - Access token with instagram_content_publish permission
    - Video must be hosted on public URL
    """
    
    BASE_URL = "https://graph.facebook.com/v18.0"
    
    def __init__(self, access_token: str, user_id: str):
        self.access_token = access_token
        self.user_id = user_id
        self.client = httpx.AsyncClient(timeout=120)
    
    async def upload_reel(
        self,
        video_url: str,  # Must be publicly accessible URL
        caption: str = "",
        hashtags: list[str] = None,
        share_to_feed: bool = True
    ) -> dict:
        """
        Upload Reel to Instagram.
        
        Args:
            video_url: Public URL of MP4 video (Instagram will fetch it)
            caption: Reel caption
            hashtags: List of hashtags
            share_to_feed: Also show in main feed
            
        Returns:
            dict with status and media_id
        """
        if hashtags:
            caption = f"{caption}\n\n{' '.join(f'#{tag}' for tag in hashtags)}"
        
        try:
            # Step 1: Create media container
            create_url = f"{self.BASE_URL}/{self.user_id}/media"
            create_data = {
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption,
                "share_to_feed": str(share_to_feed).lower(),
                "access_token": self.access_token
            }
            
            response = await self.client.post(create_url, data=create_data)
            response.raise_for_status()
            container_result = response.json()
            
            container_id = container_result.get("id")
            if not container_id:
                return {"success": False, "error": "No container ID received"}
            
            # Step 2: Wait for processing (poll status)
            import asyncio
            for _ in range(30):  # Max 30 attempts (5 minutes)
                status_url = f"{self.BASE_URL}/{container_id}"
                status_response = await self.client.get(
                    status_url,
                    params={"fields": "status_code", "access_token": self.access_token}
                )
                status_data = status_response.json()
                
                if status_data.get("status_code") == "FINISHED":
                    break
                elif status_data.get("status_code") == "ERROR":
                    return {"success": False, "error": "Video processing failed"}
                    
                await asyncio.sleep(10)  # Wait 10 seconds
            
            # Step 3: Publish the reel
            publish_url = f"{self.BASE_URL}/{self.user_id}/media_publish"
            publish_data = {
                "creation_id": container_id,
                "access_token": self.access_token
            }
            
            publish_response = await self.client.post(publish_url, data=publish_data)
            publish_response.raise_for_status()
            publish_result = publish_response.json()
            
            return {
                "success": True,
                "media_id": publish_result.get("id"),
                "message": "Reel published successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}


# Factory function
def get_tiktok_publisher(access_token: str) -> TikTokPublisher:
    return TikTokPublisher(access_token)

def get_instagram_publisher(access_token: str = None, user_id: str = None) -> InstagramPublisher:
    return InstagramPublisher(
        access_token or INSTAGRAM_ACCESS_TOKEN,
        user_id or INSTAGRAM_USER_ID
    )
