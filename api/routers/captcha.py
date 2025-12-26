"""
Captcha Router - 2captcha.com integration for verification
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
import asyncio

router = APIRouter()

TWOCAPTCHA_API_KEY = os.getenv("TWOCAPTCHA_API_KEY", "dfd1102b9937489ff86d4eac3cfb4ae3")
TWOCAPTCHA_API_URL = "http://2captcha.com/in.php"
TWOCAPTCHA_RESULT_URL = "http://2captcha.com/res.php"

# Store pending captcha tasks
captcha_tasks = {}


class CaptchaRequest(BaseModel):
    gameId: str
    siteKey: str = "6LfD3PIbAAAAAJs_eEHvoOl75_83eXSqpPSRFJ_u"  # Default reCAPTCHA site key
    pageUrl: str = "https://grandmaster-guard.vercel.app"


class CaptchaResponse(BaseModel):
    taskId: str
    status: str


class CaptchaCheckResponse(BaseModel):
    status: str  # "processing", "ready", "error"
    solution: str = None
    error: str = None


@router.post("/request", response_model=CaptchaResponse)
async def request_captcha(request: CaptchaRequest):
    """
    Request a CAPTCHA solution from 2captcha.com
    """
    try:
        async with httpx.AsyncClient() as client:
            # Submit CAPTCHA to 2captcha
            response = await client.post(
                TWOCAPTCHA_API_URL,
                data={
                    "key": TWOCAPTCHA_API_KEY,
                    "method": "userrecaptcha",
                    "googlekey": request.siteKey,
                    "pageurl": request.pageUrl,
                    "json": 1
                }
            )
            
            result = response.json()
            
            if result.get("status") != 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"2captcha error: {result.get('request', 'Unknown error')}"
                )
            
            task_id = result.get("request")
            
            # Store task info
            captcha_tasks[task_id] = {
                "gameId": request.gameId,
                "status": "processing",
                "created_at": asyncio.get_event_loop().time()
            }
            
            return CaptchaResponse(taskId=task_id, status="processing")
    
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"2captcha service unavailable: {str(e)}")


@router.get("/check/{task_id}", response_model=CaptchaCheckResponse)
async def check_captcha(task_id: str):
    """
    Check the status of a CAPTCHA solution
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                TWOCAPTCHA_RESULT_URL,
                params={
                    "key": TWOCAPTCHA_API_KEY,
                    "action": "get",
                    "id": task_id,
                    "json": 1
                }
            )
            
            result = response.json()
            
            if result.get("status") == 1:
                # CAPTCHA solved
                solution = result.get("request")
                
                # Update task status
                if task_id in captcha_tasks:
                    captcha_tasks[task_id]["status"] = "ready"
                    captcha_tasks[task_id]["solution"] = solution
                
                return CaptchaCheckResponse(status="ready", solution=solution)
            
            elif result.get("request") == "CAPCHA_NOT_READY":
                return CaptchaCheckResponse(status="processing")
            
            else:
                error_msg = result.get("request", "Unknown error")
                return CaptchaCheckResponse(status="error", error=error_msg)
    
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"2captcha service unavailable: {str(e)}")


@router.post("/verify")
async def verify_captcha(task_id: str, game_id: str):
    """
    Verify that a CAPTCHA was solved and authorize game analysis
    """
    if task_id not in captcha_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = captcha_tasks[task_id]
    
    if task["status"] != "ready":
        raise HTTPException(status_code=400, detail="CAPTCHA not yet solved")
    
    if task["gameId"] != game_id:
        raise HTTPException(status_code=403, detail="Game ID mismatch")
    
    # Clean up task
    del captcha_tasks[task_id]
    
    return {"verified": True, "gameId": game_id}


@router.get("/config")
async def get_captcha_config():
    """
    Get CAPTCHA configuration for frontend
    """
    return {
        "provider": "2captcha",
        "siteKey": "6LfD3PIbAAAAAJs_eEHvoOl75_83eXSqpPSRFJ_u",
        "enabled": bool(TWOCAPTCHA_API_KEY)
    }
