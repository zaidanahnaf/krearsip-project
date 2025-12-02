# app/core/admin_auth.py

from app.core.config import settings
from fastapi import Header, HTTPException, status, Depends, Request
from typing import Optional, Annotated
from jose import jwt, JWTError
import os


# Configuration
ADMIN_API_TOKEN = os.getenv("ADMIN_API_TOKEN", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


class AdminUser:
    """Represents an authenticated admin user"""
    def __init__(self, user_id: str, email: Optional[str] = None):
        self.user_id = user_id
        self.email = email


async def require_admin(
    request: Request,
    x_admin_token: Annotated[Optional[str], Header(alias="X-ADMIN-TOKEN")] = None,
    authorization: Annotated[Optional[str], Header()] = None,
) -> AdminUser:
    """
    Dependency to verify admin access via:
    1. X-ADMIN-TOKEN header (shared secret), OR
    2. JWT Bearer token with 'admin' scope
    
    Returns AdminUser instance if valid, raises 401 otherwise.
    """

    print("="*50)
    print("DEBUG ALL HEADERS:")
    for key, value in request.headers.items():
        print(f"  {key}: {value}")
    print("="*50)
    print(f"DEBUG: x_admin_token param: {x_admin_token}")
    print(f"DEBUG: ADMIN_API_TOKEN from settings: {settings.ADMIN_API_TOKEN}")
    print("="*50)
    
    # Method 1: Check admin token header
    if x_admin_token:
        if not settings.ADMIN_API_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Admin token not configured on server"
            )
        
        if x_admin_token == settings.ADMIN_API_TOKEN:
            print("Admin token valid!")
            return AdminUser(user_id="admin-token-user")
        else:
            print(f"Token mismatch! Got: '{x_admin_token}', Expected: '{settings.ADMIN_API_TOKEN}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin token"
            )
    
    # Method 2: Check JWT Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            scopes = payload.get("scope", "").split()
            
            if "admin" not in scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin scope required"
                )
            
            user_id = payload.get("sub")
            email = payload.get("email")
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            return AdminUser(user_id=user_id, email=email)
            
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid JWT token: {str(e)}"
            )
    
    # No valid authentication provided
    print("No valid authentication provided!")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Admin authentication required (X-ADMIN-TOKEN or Bearer token with admin scope)",
        headers={"WWW-Authenticate": "Bearer"},
    )