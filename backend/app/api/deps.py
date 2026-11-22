from fastapi import Depends
from app.core.security import verify_firebase_token


async def get_current_user(user: dict = Depends(verify_firebase_token)) -> dict:
    return user
