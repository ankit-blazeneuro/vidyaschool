import uuid
import random
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_db
from app.core.auth import get_current_user, create_session_token
from models import User, UserProfile

router = APIRouter(tags=["auth-device"])

# In-memory store for device authentication requests
# Format: { "user_code": dict_data, "device_token": dict_data }
DEVICE_AUTH_STORE: Dict[str, Dict[str, Any]] = {}
DEVICE_TOKEN_MAP: Dict[str, str] = {}  # device_token -> user_code


def _generate_user_code() -> str:
    """Generate a clean, easy-to-type 8-char code formatted as KV3K-VS34."""
    part1 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{part1}-{part2}"


class DeviceCodeResponse(BaseModel):
    user_code: str
    device_token: str
    verification_uri: str
    expires_in: int = 600
    interval: int = 3


class DevicePollRequest(BaseModel):
    device_token: str


class DeviceApproveRequest(BaseModel):
    user_code: str


@router.post("/api/auth/device/code", response_model=DeviceCodeResponse)
def request_device_code():
    """
    Step 1 (Desktop / Mobile App):
    Request a new device pairing code (e.g. KV3K-VS34) and device_token.
    """
    user_code = _generate_user_code()
    device_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    data = {
        "user_code": user_code,
        "device_token": device_token,
        "status": "pending",
        "user_id": None,
        "session_token": None,
        "user_info": None,
        "expires_at": expires_at
    }

    DEVICE_AUTH_STORE[user_code] = data
    DEVICE_TOKEN_MAP[device_token] = user_code

    verification_uri = f"https://vidyaschool.vercel.app/auth/device?code={user_code}"

    return DeviceCodeResponse(
        user_code=user_code,
        device_token=device_token,
        verification_uri=verification_uri,
        expires_in=600,
        interval=3
    )


@router.post("/api/auth/device/approve")
def approve_device_code(
    body: DeviceApproveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 2 (Web Browser):
    Logged-in web user approves the device login request by code.
    """
    code = body.user_code.strip().upper()
    if code not in DEVICE_AUTH_STORE:
        raise HTTPException(status_code=404, detail="Invalid or expired device pairing code.")

    session_data = DEVICE_AUTH_STORE[code]

    if datetime.utcnow() > session_data["expires_at"]:
        del DEVICE_AUTH_STORE[code]
        if session_data["device_token"] in DEVICE_TOKEN_MAP:
            del DEVICE_TOKEN_MAP[session_data["device_token"]]
        raise HTTPException(status_code=410, detail="Device pairing code has expired. Please try again.")

    # Create a new persistent session token for the requesting device
    new_session_token = create_session_token(current_user.id, db)

    # Fetch user profile details
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    session_data["status"] = "approved"
    session_data["user_id"] = current_user.id
    session_data["session_token"] = new_session_token
    session_data["user_info"] = {
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "image": current_user.image,
        "class": profile.class_ if profile else None,
        "section": profile.section if profile else None,
    }

    return {
        "success": True,
        "message": f"Device authorized successfully for {current_user.name or current_user.email}!",
        "user_code": code
    }


@router.post("/api/auth/device/poll")
def poll_device_status(
    body: DevicePollRequest,
    db: Session = Depends(get_db)
):
    """
    Step 3 (Desktop / Mobile App):
    App polls every few seconds using device_token to check if user approved on web.
    """
    device_token = body.device_token
    user_code = DEVICE_TOKEN_MAP.get(device_token)

    if not user_code or user_code not in DEVICE_AUTH_STORE:
        return {"status": "expired", "message": "Code expired or not found."}

    session_data = DEVICE_AUTH_STORE[user_code]

    if datetime.utcnow() > session_data["expires_at"]:
        del DEVICE_AUTH_STORE[user_code]
        del DEVICE_TOKEN_MAP[device_token]
        return {"status": "expired", "message": "Code expired."}

    if session_data["status"] == "approved":
        token = session_data["session_token"]
        user_info = session_data["user_info"]

        # Clean up store
        del DEVICE_AUTH_STORE[user_code]
        del DEVICE_TOKEN_MAP[device_token]

        return {
            "status": "approved",
            "session_token": token,
            "user": user_info
        }

    return {"status": "pending"}
