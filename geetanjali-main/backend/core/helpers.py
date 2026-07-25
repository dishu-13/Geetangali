"""Shared helper functions used across routers."""
import os
import uuid
import bcrypt
import jwt as pyjwt
import pandas as pd
from datetime import datetime, timezone, timedelta, date
from typing import Optional
from fastapi import HTTPException, Request, Depends
from core.database import db

JWT_SECRET = os.environ.get("JWT_SECRET", "supersecret")
JWT_ALG = "HS256"


def now_utc() -> str:
    """Return current UTC time as ISO string."""
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


def hash_pw(pw: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def make_token(user_id: str, role: str) -> str:
    """Create a JWT access token."""
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    """Extract and validate the current user from JWT token."""
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def require_role(*roles):
    """Dependency that checks user role."""
    async def _dep(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, f"Requires role: {roles}")
        return user
    return _dep


def parse_date_flex(v) -> Optional[str]:
    """Return YYYY-MM-DD or None. Accepts multiple date formats."""
    if not v or (isinstance(v, float) and pd.isna(v)):
        return None
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def to_float(v) -> float:
    """Safely convert a value to float."""
    try:
        if v is None or (isinstance(v, float) and pd.isna(v)):
            return 0.0
        s = str(v).strip().replace(",", "")
        if s == "" or s.lower() == "nan":
            return 0.0
        return float(s)
    except (ValueError, TypeError):
        return 0.0


def _s(v):
    """Safely convert to string for Excel parsing."""
    if v is None:
        return ""
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    return str(v).strip()


def _f(v):
    """Safely convert to float for Excel parsing."""
    try:
        if v is None or v == "":
            return 0.0
        return float(v)
    except (ValueError, TypeError):
        return 0.0
