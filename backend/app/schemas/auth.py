from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"
    user: UserResponse
