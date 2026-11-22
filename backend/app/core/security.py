import logging
import os
from typing import Optional
from fastapi import Header, HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try initializing Firebase Admin SDK if credentials are available
_firebase_initialized = False
try:
    import firebase_admin
    from firebase_admin import auth, credentials
    
    if not firebase_admin._apps:
        service_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
        if not service_path or not os.path.exists(service_path):
            if os.path.exists("/app/serviceAccountKey.json"):
                service_path = "/app/serviceAccountKey.json"
            elif os.path.exists("serviceAccountKey.json"):
                service_path = "serviceAccountKey.json"

        if service_path and os.path.exists(service_path):
            cred = credentials.Certificate(service_path)
            firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with service account certificate.")
        elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")):
            firebase_admin.initialize_app()
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS.")
        else:
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with default projectId.")
except Exception as e:
    logger.warning(f"Firebase Admin SDK not initialized: {e}. Fallback dev auth available.")
    _firebase_initialized = False


async def verify_firebase_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verifies the Firebase ID token from Authorization: Bearer <token>.
    Extracts and returns the authenticated user context { 'uid': str, 'email': str }.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = parts[1]
    
    # 1. Real Firebase Token Verification
    if _firebase_initialized:
        try:
            from firebase_admin import auth
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get("uid")
            if uid:
                return {
                    "uid": uid,
                    "email": decoded_token.get("email", ""),
                    "name": decoded_token.get("name", "User"),
                    "auth_provider": "firebase"
                }
        except Exception as e:
            logger.debug(f"Firebase ID token verification failed: {e}")
            if not settings.USE_MOCK_AUTH_IN_DEV:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid Firebase ID token: {str(e)}",
                    headers={"WWW-Authenticate": "Bearer"},
                )
    
    # 2. Development / Demo Mode Token Support
    # Enables offline testing and hackathon demo runs
    if settings.USE_MOCK_AUTH_IN_DEV:
        if token.startswith("demo-") or token == "demo-user-123" or token.startswith("user_"):
            return {
                "uid": token,
                "email": f"{token}@relationship-intelligence.local",
                "name": "Demo User",
                "auth_provider": "demo_local"
            }
        # If frontend passes any custom string in dev mode:
        return {
            "uid": token if len(token) < 128 else f"user_{token[:16]}",
            "email": "user@relationship-intelligence.local",
            "name": "Authenticated User",
            "auth_provider": "dev_token"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Unable to verify Firebase token",
        headers={"WWW-Authenticate": "Bearer"},
    )
