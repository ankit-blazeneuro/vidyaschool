import os
import uuid
from datetime import datetime
from contextlib import asynccontextmanager

import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", ""),
    send_default_pii=False,
    traces_sample_rate=0.1,
    enable_logs=True,
)

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine, Session, select
from typing import Optional
import socketio

from app.core.auth import decode_session_token, require_role, get_current_user
from app.core.database import init_db, get_db
from app.core.fees import build_default_fee_installments
from app.routes.fees import router as fees_router
from app.routes.teacher import router as teacher_router
from app.routes.slider import router as slider_router
from app.routes.library import router as library_router
from app.routes.notices import router as notices_router
from app.routes.search import router as search_router
from app.routes.chats import router as chats_router
from app.routes.page_builder_ai import router as page_builder_ai_router
from models import User

# Load env variables from .env (local dev only — on Render, system env vars take precedence)
load_dotenv(override=False)

# Load database URL and adjust for SQLAlchemy PostgreSQL driver
db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(
    db_url or "",
    pool_pre_ping=True,
    pool_recycle=300
)

# Set up Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=['http://localhost:3000', 'https://vidyaschool.vercel.app'])

active_users = {}

@sio.event
async def connect(sid, environ):
    print(f"Socket.IO client connected: {sid}")

@sio.event
async def join(sid, data):
    user_id = data.get("userId")
    name = data.get("name")
    role = data.get("role")
    image = data.get("image")
    
    active_users[sid] = {
        "userId": user_id,
        "name": name,
        "role": role,
        "image": image,
        "sid": sid
    }
    
    await sio.enter_room(sid, 'community')
    await sio.emit('online_users', list(active_users.values()), room='community')
    
    # Load recent 30 messages from the database
    with Session(engine) as db:
        from models import CommunityMessage, User
        import json
        results = db.query(CommunityMessage, User).join(
            User, CommunityMessage.user_id == User.id
        ).order_by(CommunityMessage.created_at.desc()).limit(30).all()
        
        recent = []
        for msg, u in reversed(results):
            reply_to_val = None
            if msg.reply_to:
                try:
                    reply_to_val = json.loads(msg.reply_to)
                except Exception:
                    reply_to_val = msg.reply_to
                    
            recent.append({
                "id": msg.id,
                "userId": msg.user_id,
                "name": u.name,
                "role": u.role,
                "image": u.image,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat() + "Z",
                "replyTo": reply_to_val
            })
            
        await sio.emit('recent_messages', {
            "messages": recent,
            "hasMore": len(results) == 30
        }, to=sid)

@sio.event
async def load_more(sid, data):
    sender = active_users.get(sid)
    if not sender:
        return
        
    before_str = data.get("before")
    if not before_str:
        return
        
    try:
        timestamp_str = before_str.replace("Z", "+00:00")
        before_dt = datetime.fromisoformat(timestamp_str)
    except Exception as e:
        print(f"Error parsing before timestamp: {e}")
        return
        
    with Session(engine) as db:
        from models import CommunityMessage, User
        import json
        results = db.query(CommunityMessage, User).join(
            User, CommunityMessage.user_id == User.id
        ).filter(CommunityMessage.created_at < before_dt).order_by(CommunityMessage.created_at.desc()).limit(30).all()
        
        more_msgs = []
        for msg, u in reversed(results):
            reply_to_val = None
            if msg.reply_to:
                try:
                    reply_to_val = json.loads(msg.reply_to)
                except Exception:
                    reply_to_val = msg.reply_to
                    
            more_msgs.append({
                "id": msg.id,
                "userId": msg.user_id,
                "name": u.name,
                "role": u.role,
                "image": u.image,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat() + "Z",
                "replyTo": reply_to_val
            })
            
        await sio.emit('more_messages', {
            "messages": more_msgs,
            "hasMore": len(results) == 30
        }, to=sid)

@sio.event
async def send_message(sid, data):
    sender = active_users.get(sid)
    if not sender:
        return
        
    msg_id = str(uuid.uuid4())
    timestamp = datetime.utcnow()
    
    # Store message in DB
    import json
    reply_to_str = None
    if data.get("replyTo"):
        reply_to_str = json.dumps(data.get("replyTo"))

    with Session(engine) as db:
        from models import CommunityMessage
        db_msg = CommunityMessage(
            id=msg_id,
            user_id=sender["userId"],
            content=data.get("content"),
            reply_to=reply_to_str,
            created_at=timestamp,
            updated_at=timestamp
        )
        db.add(db_msg)
        db.commit()
        
    msg = {
        "id": msg_id,
        "userId": sender["userId"],
        "name": sender["name"],
        "role": sender["role"],
        "image": sender.get("image"),
        "content": data.get("content"),
        "timestamp": timestamp.isoformat() + "Z",
        "replyTo": data.get("replyTo")
    }
    
    await sio.emit('new_message', msg, room='community')

@sio.event
async def edit_message(sid, data):
    sender = active_users.get(sid)
    if not sender:
        return
        
    msg_id = data.get("messageId")
    new_content = data.get("content")
    
    with Session(engine) as db:
        from models import CommunityMessage
        db_msg = db.query(CommunityMessage).filter(CommunityMessage.id == msg_id).first()
        if db_msg and db_msg.user_id == sender["userId"]:
            db_msg.content = new_content
            db_msg.updated_at = datetime.utcnow()
            db.add(db_msg)
            db.commit()
            
            await sio.emit('message_edited', {"id": msg_id, "content": new_content}, room='community')

@sio.event
async def delete_message(sid, data):
    sender = active_users.get(sid)
    if not sender:
        return
        
    msg_id = data.get("messageId")
    
    with Session(engine) as db:
        from models import CommunityMessage
        db_msg = db.query(CommunityMessage).filter(CommunityMessage.id == msg_id).first()
        if db_msg and db_msg.user_id == sender["userId"]:
            db.delete(db_msg)
            db.commit()
            
            await sio.emit('message_deleted', {"id": msg_id}, room='community')

@sio.event
async def typing(sid, data):
    sender = active_users.get(sid)
    if not sender:
        return
    await sio.emit('user_typing', {
        "userId": sender["userId"],
        "name": sender["name"],
        "isTyping": data.get("isTyping", False)
    }, room='community')

@sio.event
async def disconnect(sid):
    if sid in active_users:
        del active_users[sid]
        await sio.emit('online_users', list(active_users.values()), room='community')
    print(f"Socket.IO client disconnected: {sid}")

@sio.event
async def teacher_request_status(sid, data):
    user_id = data.get("userId")
    with Session(engine) as db:
        from models import TeacherRequest
        request = db.query(TeacherRequest).filter(TeacherRequest.user_id == user_id).first()
        if request:
            await sio.emit('approval_status', {"status": request.status, "userId": user_id}, to=sid)

@sio.event
async def new_teacher_request(sid, data):
    user_id = data.get("userId")
    with Session(engine) as db:
        from models import TeacherRequest, User
        existing = db.query(TeacherRequest).filter(TeacherRequest.user_id == user_id).first()
        if not existing:
            request_id = str(uuid.uuid4())
            new_request = TeacherRequest(
                id=request_id,
                user_id=user_id,
                status="pending",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_request)
            db.commit()
            db.refresh(new_request)
            
            user = db.query(User).filter(User.id == user_id).first()
            await sio.emit('teacher_request_created', {
                "id": request_id,
                "userId": user_id,
                "userName": user.name if user else "",
                "userEmail": user.email if user else "",
                "status": "pending",
                "createdAt": new_request.created_at.isoformat()
            }, room='admin_room')

@sio.event
async def join_admin_room(sid, data):
    admin_id = data.get("adminId")
    with Session(engine) as db:
        from models import User
        admin = db.query(User).filter(User.id == admin_id).first()
        if admin and admin.role == "admin":
            await sio.enter_room(sid, 'admin_room')

@sio.event
async def approve_teacher(sid, data):
    print(f"🟢 Approve teacher called: {data}")
    request_id = data.get("requestId")
    admin_id = data.get("adminId")
    
    with Session(engine) as db:
        from models import TeacherRequest, User
        request = db.query(TeacherRequest).filter(TeacherRequest.id == request_id).first()
        print(f"Found request: {request}")
        if request:
            request.status = "approved"
            request.admin_id = admin_id
            request.updated_at = datetime.utcnow()
            
            user = db.query(User).filter(User.id == request.user_id).first()
            print(f"Found user: {user}")
            if user:
                user.role = user.preferred_role if user.preferred_role in ("teacher", "librarian") else "teacher"
                user.teacher_approval_status = "approved"
                print(f"Updated user role to {user.role}")
                
            db.add(request)
            db.add(user)
            db.commit()
            
            # Emit to all clients
            print(f"Emitting approval_status for user {request.user_id}")
            await sio.emit('approval_status', {"status": "approved", "userId": request.user_id}, broadcast=True)
            await sio.emit('request_updated', {"requestId": request_id, "status": "approved"}, broadcast=True)
            print(f"✅ Approved teacher request {request_id} for user {request.user_id}")

@sio.event
async def reject_teacher(sid, data):
    request_id = data.get("requestId")
    admin_id = data.get("adminId")
    reason = data.get("reason", "")
    
    with Session(engine) as db:
        from models import TeacherRequest, User
        request = db.query(TeacherRequest).filter(TeacherRequest.id == request_id).first()
        if request:
            request.status = "rejected"
            request.admin_id = admin_id
            request.rejection_reason = reason
            request.updated_at = datetime.utcnow()
            
            user = db.query(User).filter(User.id == request.user_id).first()
            if user:
                user.role = "student"
                user.teacher_approval_status = "rejected"
                
            db.add(request)
            db.add(user)
            db.commit()
            
            # Emit to all clients
            await sio.emit('approval_status', {"status": "rejected", "userId": request.user_id}, broadcast=True)
            await sio.emit('request_updated', {"requestId": request_id, "status": "rejected"}, broadcast=True)
            print(f"Rejected teacher request {request_id} for user {request.user_id}")

app = FastAPI(title="VidyaSchool Fees Backend API")

# Enable CORS for Next.js frontend and mobile apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://vidyaschool.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fees_router)
app.include_router(teacher_router)
app.include_router(slider_router)
app.include_router(library_router)
app.include_router(notices_router)
app.include_router(search_router)
app.include_router(chats_router)
app.include_router(page_builder_ai_router, prefix="/api/page-builder", tags=["page-builder"])

# Admin endpoints for teacher approval and subject requests
@app.get("/api/health")
def health():
    return {"ok": True}



@app.post("/notify-teacher-request")
async def notify_teacher_request(data: dict, current_user: User = Depends(require_role(["admin"]))):
    await sio.emit('teacher_request_created', data, broadcast=True)
    return {"success": True}


@app.post("/notify-complaint")
async def notify_complaint(data: dict, current_user: User = Depends(require_role(["admin", "teacher"]))):
    event = data.get("event", "complaint_created")
    payload = data.get("payload", data)
    await sio.emit(event, payload, room='admin_room')
    await sio.emit(event, payload, broadcast=True)
    return {"success": True}

# Firebase Admin SDK Configuration
import firebase_admin
from firebase_admin import credentials, messaging

firebase_app = None
try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_JSON")
    cred_content = os.getenv("FIREBASE_CREDENTIALS_JSON_CONTENT")
    default_path = os.path.join(os.path.dirname(__file__), "firebase-credentials.json")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_app = firebase_admin.initialize_app(cred)
    elif cred_content:
        import json
        cred_info = json.loads(cred_content)
        cred = credentials.Certificate(cred_info)
        firebase_app = firebase_admin.initialize_app(cred)
    elif os.path.exists(default_path):
        cred = credentials.Certificate(default_path)
        firebase_app = firebase_admin.initialize_app(cred)
    else:
        firebase_app = firebase_admin.initialize_app()
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"Firebase Admin SDK not initialized (optional, will fall back to log): {e}")

def send_fcm_notification(tokens: list[str], title: str, body: str):
    if not firebase_app:
        print(f"FCM send skipped (Firebase not initialized). Notification details: Title='{title}', Body='{body}'")
        return
    if not tokens:
        return
    # FCM multicast supports max 500 tokens per call
    for i in range(0, len(tokens), 500):
        batch = tokens[i:i + 500]
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={"title": title, "body": body},
            android=messaging.AndroidConfig(
                priority="high",
                ttl=86400,
                notification=messaging.AndroidNotification(
                    channel_id="school_notifications",
                    priority="high",
                    default_sound=True,
                    default_vibrate_timings=True,
                ),
            ),
            tokens=batch,
        )
        try:
            response = messaging.send_each_for_multicast(message)
            print(f"FCM multicast batch sent: {response.success_count} success, {response.failure_count} failure")
            if response.failure_count:
                for idx, send_response in enumerate(response.responses):
                    if not send_response.success:
                        print(f"FCM token failure [{idx}]: {send_response.exception}")
        except Exception as e:
            print(f"Error sending FCM multicast batch: {e}")

def get_online_sids_for_user(user_id: str) -> list[str]:
    return [sid for sid, info in active_users.items() if info["userId"] == user_id]

def get_target_users(target_role: str, target_class: str | None, target_section: str | None, db: Session):
    from models import User, UserProfile
    query = db.query(User)
    
    if target_class or target_section:
        query = query.join(UserProfile, User.id == UserProfile.user_id)
        if target_class:
            query = query.filter(UserProfile.class_ == target_class)
        if target_section:
            query = query.filter(UserProfile.section == target_section)
    elif target_role and target_role != "all":
        query = query.filter(User.role == target_role)
        
    return query.all()

async def send_notification_to_user(user_id: str, title: str, body: str, db: Session):
    from models import FCMToken, NotificationHistory

    # Log to notification history
    try:
        new_history = NotificationHistory(
            id=f"notif-{uuid.uuid4()}",
            user_id=user_id,
            title=title,
            body=body,
            created_at=datetime.utcnow()
        )
        db.add(new_history)
        db.commit()
    except Exception as e:
        print(f"Failed to log notification history for user {user_id}: {e}")
        db.rollback()

    sids = list(set(get_online_sids_for_user(user_id)))
    if sids:
        for sid in sids:
            try:
                await sio.emit('notification', {"title": title, "body": body}, room=sid)
            except Exception as e:
                print(f"Error emitting socket notification: {e}")
        print(f"Sent notification to online user {user_id} via socket.")

    tokens = db.query(FCMToken).filter(FCMToken.user_id == user_id).all()
    if tokens:
        token_list = list(set([t.token for t in tokens if t.token]))  # De-duplicate tokens
        if token_list:
            send_fcm_notification(token_list, title, body)
            print(f"Sent notification to user {user_id} via FCM ({len(token_list)} token(s)).")

@app.post("/api/notifications/register-token")
def register_fcm_token(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
        
    from models import FCMToken
    # Remove token from any other users (prevents duplicate delivery on shared/re-logged devices)
    try:
        db.query(FCMToken).filter(FCMToken.token == token, FCMToken.user_id != current_user.id).delete(synchronize_session=False)
    except Exception as e:
        print(f"Failed to clean up stale FCM tokens: {e}")

    existing = db.query(FCMToken).filter(FCMToken.user_id == current_user.id, FCMToken.token == token).first()
    if not existing:
        new_token = FCMToken(
            id=f"fcm-{uuid.uuid4()}",
            user_id=current_user.id,
            token=token,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_token)
    else:
        existing.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True}

@app.get("/api/notifications/history")
def get_notification_history(days: int = 30, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import NotificationHistory
    notifications = db.query(NotificationHistory).filter(NotificationHistory.user_id == current_user.id).order_by(NotificationHistory.created_at.desc()).limit(days).all()
    
    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "createdAt": n.created_at.isoformat() + "Z"
        })
    return result

@app.post("/api/notifications/send")
async def send_custom_notification(data: dict, current_user: User = Depends(require_role(["admin", "teacher", "librarian"])), db: Session = Depends(get_db)):
    title = data.get("title")
    body = data.get("body")
    target_role = data.get("targetRole", "all")
    target_class = data.get("targetClass")
    target_section = data.get("targetSection")
    
    if not title or not body:
        raise HTTPException(status_code=400, detail="Title and body are required")
        
    users = get_target_users(target_role, target_class, target_section, db)
    user_ids = [u.id for u in users]
    
    if not user_ids:
        return {"success": True, "deliveredCount": 0}

    from models import FCMToken, NotificationHistory

    # 1. Log notification history for all target users
    history_entries = [
        NotificationHistory(
            id=f"notif-{uuid.uuid4()}",
            user_id=uid,
            title=title,
            body=body,
            created_at=datetime.utcnow()
        )
        for uid in user_ids
    ]
    try:
        db.bulk_save_objects(history_entries)
        db.commit()
    except Exception as e:
        print(f"Failed to save bulk notification history: {e}")
        db.rollback()

    # 2. Emit socket notifications to online users (deduplicated SIDs)
    for uid in user_ids:
        sids = set(get_online_sids_for_user(uid))
        for sid in sids:
            try:
                await sio.emit('notification', {"title": title, "body": body}, room=sid)
            except Exception as e:
                print(f"Error emitting socket notification to {sid}: {e}")

    # 3. Collect and deduplicate all FCM tokens across all target users into ONE multicast request
    fcm_records = db.query(FCMToken).filter(FCMToken.user_id.in_(user_ids)).all()
    all_tokens = list(set([r.token for r in fcm_records if r.token]))
    
    if all_tokens:
        send_fcm_notification(all_tokens, title, body)
        print(f"[Push Broadcast] Multicast FCM sent to {len(all_tokens)} unique device token(s) for {len(user_ids)} target user(s).")
        
    return {"success": True, "deliveredCount": len(user_ids)}


@app.on_event("startup")
def on_startup():
    init_db()
    # Init and start the automated notification scheduler
    try:
        from scheduler import init_scheduler, create_scheduler
        init_scheduler(engine, send_notification_to_user)
        scheduler = create_scheduler()
        scheduler.start()
        app.state.scheduler = scheduler
        print("[Scheduler] Automated notification scheduler started.")
    except Exception as e:
        print(f"[Scheduler] Could not start scheduler: {e}")


@app.on_event("shutdown")
def on_shutdown():
    scheduler = getattr(app.state, "scheduler", None)
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Scheduler] Scheduler stopped.")


# Wrap FastAPI application with Socket.IO ASGIApp
app = socketio.ASGIApp(sio, other_asgi_app=app)

__all__ = ["app", "build_default_fee_installments", "decode_session_token"]




