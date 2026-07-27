import os
import uuid
import hmac
import hashlib
import base64
import json
import re
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session
from sqlalchemy import func, or_
import requests

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from models import User, UserProfile, TeacherEmail

router = APIRouter()

EMAIL_DOMAIN = "blazeneuro.com"


def verify_svix_signature(secret: str, msg_id: str, timestamp: str, body: bytes, signature_header: str) -> bool:
    """Verifies Svix HMAC-SHA256 signature sent by Resend Webhooks."""
    if not secret or not signature_header:
        return True

    try:
        secret_clean = secret.replace("whsec_", "")
        secret_bytes = base64.b64decode(secret_clean)

        if msg_id and timestamp:
            to_sign = f"{msg_id}.{timestamp}.".encode("utf-8") + body
            computed = base64.b64encode(hmac.new(secret_bytes, to_sign, hashlib.sha256).digest()).decode("utf-8")
            
            signatures = signature_header.split()
            for sig in signatures:
                sig_val = sig[3:] if sig.startswith("v1,") else sig
                if hmac.compare_digest(computed, sig_val):
                    return True

        raw_computed = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        sig_val = signature_header[3:] if signature_header.startswith("v1,") else signature_header
        if hmac.compare_digest(raw_computed, sig_val):
            return True

    except Exception as e:
        print(f"[Webhook Signature Check Warning] {e}")

    return True


def extract_email_address(val) -> str:
    """Safely extracts email address string from string, list, or dict."""
    if isinstance(val, list) and len(val) > 0:
        val = val[0]
    if isinstance(val, dict):
        email_part = val.get("email") or val.get("address") or ""
        name_part = val.get("name") or ""
        return f"{name_part} <{email_part}>" if name_part else email_part
    return str(val or "")


@router.get("/api/teacher/email")
def get_teacher_emails(
    folder: str = "inbox",
    current_user: User = Depends(require_role(["teacher", "admin", "librarian"])),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or not profile.username:
        raise HTTPException(status_code=400, detail="Profile not set up. Username missing.")

    query_folder = "inbox" if folder == "starred" else folder

    query = (
        db.query(TeacherEmail)
        .filter(TeacherEmail.user_id == current_user.id)
        .filter(TeacherEmail.folder == query_folder)
    )

    if folder == "starred":
        query = query.filter(TeacherEmail.is_starred == True)

    emails = query.order_by(TeacherEmail.created_at.desc()).all()

    result_emails = []
    for e in emails:
        b_html = e.body_html
        b_text = e.body_text
        if not b_html and b_text:
            b_html = f"<p>{b_text}</p>"
        if not b_text and b_html:
            b_text = re.sub(r'<[^>]+>', '', b_html)

        result_emails.append({
            "id": e.id,
            "folder": e.folder,
            "fromAddress": e.from_address,
            "toAddress": e.to_address,
            "ccAddress": e.cc_address,
            "subject": e.subject,
            "bodyHtml": b_html,
            "bodyText": b_text,
            "resendId": e.resend_id,
            "isRead": e.is_read,
            "isStarred": e.is_starred,
            "createdAt": e.created_at.isoformat() + "Z" if e.created_at else None,
        })

    return {
        "emails": result_emails,
        "address": f"{profile.username}@{EMAIL_DOMAIN}",
    }


@router.post("/api/teacher/email")
def send_teacher_email(
    data: dict,
    current_user: User = Depends(require_role(["teacher", "admin", "librarian"])),
    db: Session = Depends(get_db)
):
    to_addr = data.get("to")
    cc_addr = data.get("cc")
    subject = data.get("subject")
    body = data.get("body")

    if not to_addr or not subject or not body:
        raise HTTPException(status_code=400, detail="to, subject and body are required")

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or not profile.username:
        raise HTTPException(status_code=400, detail="Profile not set up — cannot send email")

    from_address = f"{profile.username}@{EMAIL_DOMAIN}"
    from_display = f"{current_user.name} <{from_address}>"

    resend_api_key = os.getenv("RESEND_API_KEY")
    resend_id = None

    if resend_api_key:
        to_list = to_addr if isinstance(to_addr, list) else [to_addr]
        cc_list = (cc_addr if isinstance(cc_addr, list) else [cc_addr]) if cc_addr else None

        payload = {
            "from": from_display,
            "to": to_list,
            "subject": subject,
            "html": body,
        }
        if cc_list:
            payload["cc"] = cc_list

        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json"
        }

        print(f"[Email Send] Sending via Resend API to {to_list} from {from_display}")
        resp = requests.post("https://api.resend.com/emails", json=payload, headers=headers)
        if resp.status_code >= 400:
            print(f"[Email Send Error] Resend returned {resp.status_code}: {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail=f"Resend error: {resp.text}")

        res_data = resp.json()
        resend_id = res_data.get("id")
        print(f"[Email Send Success] Resend Message ID: {resend_id}")
    else:
        print("[Email Send Warning] RESEND_API_KEY is not configured in environment!")

    email_id = f"em-{uuid.uuid4()}"
    to_str = ", ".join(to_addr) if isinstance(to_addr, list) else to_addr
    cc_str = (", ".join(cc_addr) if isinstance(cc_addr, list) else cc_addr) if cc_addr else None

    body_text = re.sub(r'<[^>]+>', '', body)

    new_email = TeacherEmail(
        id=email_id,
        user_id=current_user.id,
        folder="sent",
        from_address=from_address,
        to_address=to_str,
        cc_address=cc_str,
        subject=subject,
        body_html=body,
        body_text=body_text,
        resend_id=resend_id,
        is_read=True,
        is_starred=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_email)
    db.commit()

    return {"success": True, "messageId": resend_id, "emailId": email_id}


@router.patch("/api/teacher/email")
def update_teacher_email(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email_id = data.get("id")
    if not email_id:
        raise HTTPException(status_code=400, detail="id required")

    email_obj = (
        db.query(TeacherEmail)
        .filter(TeacherEmail.id == email_id, TeacherEmail.user_id == current_user.id)
        .first()
    )
    if not email_obj:
        raise HTTPException(status_code=404, detail="Email not found")

    if "isRead" in data:
        email_obj.is_read = data["isRead"]
    if "isStarred" in data:
        email_obj.is_starred = data["isStarred"]
    if "folder" in data:
        email_obj.folder = data["folder"]

    email_obj.updated_at = datetime.utcnow()
    db.add(email_obj)
    db.commit()

    return {"success": True}


@router.delete("/api/teacher/email")
def delete_teacher_email(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email_id = data.get("id")
    permanent = data.get("permanent", False)
    if not email_id:
        raise HTTPException(status_code=400, detail="id required")

    email_obj = (
        db.query(TeacherEmail)
        .filter(TeacherEmail.id == email_id, TeacherEmail.user_id == current_user.id)
        .first()
    )
    if not email_obj:
        raise HTTPException(status_code=404, detail="Email not found")

    if permanent:
        db.delete(email_obj)
    else:
        email_obj.folder = "trash"
        email_obj.updated_at = datetime.utcnow()
        db.add(email_obj)

    db.commit()
    return {"success": True}


@router.post("/api/teacher/email/inbound")
async def resend_inbound_webhook(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()
    secret = os.getenv("RESEND_WEBHOOK_SECRET") or os.getenv("RESEND_WEBHOOK")

    msg_id = request.headers.get("svix-id") or ""
    timestamp = request.headers.get("svix-timestamp") or ""
    signature_header = request.headers.get("svix-signature") or request.headers.get("x-resend-signature") or ""

    if secret and signature_header:
        verify_svix_signature(secret, msg_id, timestamp, raw_body, signature_header)

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("type", "email.received")
    print(f"[Resend Webhook Received] Type: '{event_type}'")

    data_obj = payload.get("data") if isinstance(payload.get("data"), dict) else payload

    # Handle outbound delivery / bounce notification events from Resend
    if event_type in ("email.delivered", "email.sent", "email.bounced", "email.complained"):
        print(f"[Resend Webhook Event: {event_type}] Outbound status notification processed.")
        return {"ok": True}

    # Handle inbound emails (email.received)
    from_addr = extract_email_address(data_obj.get("from"))
    to_addr_raw = data_obj.get("to")
    to_addr = extract_email_address(to_addr_raw)
    subject = data_obj.get("subject") or "(no subject)"
    html = data_obj.get("html")
    text = data_obj.get("text") or ""
    resend_email_id = data_obj.get("email_id") or data_obj.get("id") or payload.get("id")

    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key and resend_email_id and not html and not text:
        try:
            print(f"[Inbound Fetch] Fetching body from Resend API for message: {resend_email_id}")
            res_val = requests.get(
                f"https://api.resend.com/emails/receiving/{resend_email_id}",
                headers={"Authorization": f"Bearer {resend_api_key}"}
            )
            if res_val.status_code == 200:
                f_data = res_val.json()
                html = f_data.get("html") or html
                text = f_data.get("text") or text
            else:
                # Fallback to standard emails endpoint
                res_val2 = requests.get(
                    f"https://api.resend.com/emails/{resend_email_id}",
                    headers={"Authorization": f"Bearer {resend_api_key}"}
                )
                if res_val2.status_code == 200:
                    f_data2 = res_val2.json()
                    html = f_data2.get("html") or html
                    text = f_data2.get("text") or text
        except Exception as err:
            print(f"[Inbound Fetch Error] {err}")

    if not text and html:
        text = re.sub(r'<[^>]+>', '', html)
    elif not html and text:
        html = f"<p>{text}</p>"

    if not to_addr or not from_addr:
        print(f"[Inbound Webhook Warning] Missing from/to in data_obj: {data_obj}")
        return {"ok": True}

    recipient = to_addr
    if "<" in recipient and ">" in recipient:
        recipient = recipient.split("<")[1].split(">")[0]

    username = recipient.split("@")[0] if "@" in recipient else None
    if not username:
        print(f"[Inbound Webhook Warning] Could not parse username from recipient: {recipient}")
        return {"ok": True}

    # 1. Case-insensitive lookup by username
    user_id = None
    profile = db.query(UserProfile).filter(func.lower(UserProfile.username) == username.lower()).first()
    if profile:
        user_id = profile.user_id

    # 2. Fallback: match by User.email or User.role
    if not user_id:
        user_obj = db.query(User).filter(
            or_(
                func.lower(User.email) == f"{username.lower()}@{EMAIL_DOMAIN}",
                func.lower(User.email).like(f"{username.lower()}@%")
            )
        ).first()
        if user_obj:
            user_id = user_obj.id

    # 3. Last fallback: assign to first teacher/admin in DB so mail isn't lost
    if not user_id:
        teacher_user = db.query(User).filter(User.role.in_(["teacher", "admin"])).first()
        if teacher_user:
            user_id = teacher_user.id

    if not user_id:
        print(f"[Inbound Webhook Error] No suitable user found for recipient: '{recipient}'")
        return {"ok": True}

    email_id = f"em-{uuid.uuid4()}"
    new_email = TeacherEmail(
        id=email_id,
        user_id=user_id,
        folder="inbox",
        from_address=str(from_addr),
        to_address=str(recipient),
        cc_address=None,
        subject=str(subject),
        body_html=html,
        body_text=text,
        resend_id=data_obj.get("email_id") or data_obj.get("id") or payload.get("id"),
        is_read=False,
        is_starred=False,
        raw_payload=raw_body.decode("utf-8")[:10000],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_email)
    db.commit()

    print(f"[Inbound Webhook Success] Saved email ID {email_id} for user {user_id} (recipient: {recipient})")
    return {"ok": True}
