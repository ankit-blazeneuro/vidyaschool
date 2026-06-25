from datetime import datetime
from typing import List, Optional
from urllib.parse import unquote

from fastapi import Depends, HTTPException, Request
from sqlmodel import Session

from app.core.database import get_db
from models import User, Session as SessionModel
from app.core.config import DEBUG_LOG_PATH


def decode_session_token(token: Optional[str]) -> Optional[str]:
    if not token:
        return None

    try:
        decoded = unquote(token)
    except Exception:
        decoded = token

    if "." in decoded:
        parts = decoded.split(".", 1)
        if len(parts) == 2 and parts[0] and parts[1]:
            return parts[0]

    return decoded


def log_request_debug(request: Request) -> None:
    with DEBUG_LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(f"\n--- {datetime.utcnow()} ---\n")
        fh.write(f"Headers: {dict(request.headers)}\n")
        fh.write(f"Cookies: {dict(request.cookies)}\n")


def get_current_user(request: Request, db: Session = Depends(get_db)):
    log_request_debug(request)

    token = decode_session_token(request.cookies.get("better-auth.session_token"))
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = decode_session_token(auth_header.split(" ", 1)[1])

    with DEBUG_LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(f"Extracted token: {token}\n")

    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized: No session token found")

    db_session = db.query(SessionModel).filter(SessionModel.token == token).first()

    with DEBUG_LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(f"Found db_session: {db_session is not None}\n")
        if db_session:
            fh.write(f"db_session user_id: {db_session.user_id}, expires_at: {db_session.expires_at}\n")

    if not db_session:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid session")

    if db_session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Unauthorized: Session expired")

    db_user = db.query(User).filter(User.id == db_session.user_id).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not found")

    return db_user


def require_role(allowed_roles: List[str]):
    def dependency(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden: Access denied")
        return user

    return dependency
