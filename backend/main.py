import os
import uuid
from datetime import datetime

import sentry_sdk

sentry_sdk.init(
    dsn="https://42fb3541f8375e80add25a786495678f@o4511647082872832.ingest.de.sentry.io/4511647092179024",
    send_default_pii=True,
    traces_sample_rate=1.0,
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
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

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
    allow_origins=["http://localhost:3000", "https://vidyaschool.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fees_router)
app.include_router(teacher_router)
app.include_router(slider_router)
app.include_router(library_router)
app.include_router(notices_router)

# Admin endpoints for teacher approval and subject requests
@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/admin/requests")
async def get_admin_subject_requests(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get all pending subject-class requests for admin"""
    from models import SubjectClassRequest, User as UserModel
    requests = db.exec(
        select(SubjectClassRequest, UserModel)
        .join(UserModel, SubjectClassRequest.teacher_id == UserModel.id)
        .where(SubjectClassRequest.status == "pending")
    ).all()
    
    return [
        {
            "id": r.id,
            "class": r.class_,
            "section": r.section,
            "subject": r.subject,
            "status": r.status,
            "createdAt": r.created_at.isoformat(),
            "teacher": {
                "id": u.id,
                "name": u.name,
                "email": u.email
            }
        } for r, u in requests
    ]

@app.get("/api/admin/teacher-requests")
async def get_teacher_approval_requests(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get all pending teacher approval requests"""
    from models import TeacherRequest, User as UserModel
    requests = db.exec(
        select(TeacherRequest, UserModel)
        .join(UserModel, TeacherRequest.user_id == UserModel.id)
        .where(TeacherRequest.status == "pending")
    ).all()
    
    return [
        {
            "id": r.id,
            "userId": r.user_id,
            "status": r.status,
            "createdAt": r.created_at.isoformat(),
            "user": {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "image": u.image
            }
        } for r, u in requests
    ]

@app.post("/api/admin/requests/{request_id}/approve")
async def approve_subject_request(
    request_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Approve a subject-class request"""
    from models import SubjectClassRequest, SubjectClassAssignment
    import uuid
    
    req = db.get(SubjectClassRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "approved"
    req.updated_at = datetime.utcnow()
    db.add(req)
    
    # Create assignment
    assignment = SubjectClassAssignment(
        id=f"asgn_{uuid.uuid4().hex[:8]}",
        teacher_id=req.teacher_id,
        class_=req.class_,
        section=req.section,
        subject=req.subject
    )
    db.add(assignment)
    db.commit()
    return {"status": "success"}

@app.post("/api/admin/requests/{request_id}/reject")
async def reject_subject_request(
    request_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Reject a subject-class request"""
    from models import SubjectClassRequest
    
    req = db.get(SubjectClassRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "rejected"
    req.updated_at = datetime.utcnow()
    db.add(req)
    db.commit()
    return {"status": "success"}

@app.post("/api/admin/teacher-requests/{request_id}/approve")
async def approve_teacher_request(
    request_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Approve a teacher approval request"""
    from models import TeacherRequest, User as UserModel
    
    req = db.get(TeacherRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update user role to teacher/librarian
    user = db.get(UserModel, req.user_id)
    if user:
        user.role = user.preferred_role if user.preferred_role in ("teacher", "librarian") else "teacher"
        db.add(user)
    
    req.status = "approved"
    req.admin_id = current_user.id
    req.updated_at = datetime.utcnow()
    db.add(req)
    db.commit()
    return {"status": "success"}

@app.post("/api/admin/teacher-requests/{request_id}/reject")
async def reject_teacher_request(
    request_id: str,
    reason: str = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Reject a teacher approval request"""
    from models import TeacherRequest
    from pydantic import BaseModel
    
    class RejectRequest(BaseModel):
        reason: Optional[str] = None
    
    req = db.get(TeacherRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "rejected"
    req.admin_id = current_user.id
    req.rejection_reason = reason
    req.updated_at = datetime.utcnow()
    db.add(req)
    db.commit()
    return {"status": "success"}


@app.get("/accounts/dashboard")
async def get_accounts_dashboard():
    return {
        "totalRevenue": 1245000,
        "outstandingFees": 325000,
        "totalExpenses": 850000,
        "netIncome": 395000,
        "monthlyRevenue": [
            {"month": "Jan", "revenue": 120000},
            {"month": "Feb", "revenue": 135000},
            {"month": "Mar", "revenue": 142000},
            {"month": "Apr", "revenue": 155000},
            {"month": "May", "revenue": 148000},
            {"month": "Jun", "revenue": 165000},
        ],
        "paymentMethods": [
            {"name": "Cash", "value": 35},
            {"name": "UPI", "value": 40},
            {"name": "Card", "value": 15},
            {"name": "Bank Transfer", "value": 10},
        ],
        "recentTransactions": [
            {
                "id": 1,
                "description": "Student Fee Payment - John Doe",
                "category": "Class 10 - Section A",
                "amount": 15000,
                "date": "2024-06-27"
            },
            {
                "id": 2,
                "description": "Electricity Bill",
                "category": "Maintenance",
                "amount": -8500,
                "date": "2024-06-26"
            },
            {
                "id": 3,
                "description": "Student Fee Payment - Jane Smith",
                "category": "Class 9 - Section B",
                "amount": 14000,
                "date": "2024-06-25"
            },
        ]
    }


@app.post("/notify-teacher-request")
async def notify_teacher_request(data: dict):
    await sio.emit('teacher_request_created', data, broadcast=True)
    return {"success": True}


@app.post("/notify-complaint")
async def notify_complaint(data: dict):
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
    message = messaging.MulticastMessage(
        data={"title": title, "body": body},
        android=messaging.AndroidConfig(
            priority="high",
            ttl=86400,
        ),
        tokens=tokens,
    )
    try:
        response = messaging.send_each_for_multicast(message)
        print(f"FCM multicast sent: {response.success_count} success, {response.failure_count} failure")
        if response.failure_count:
            for idx, send_response in enumerate(response.responses):
                if not send_response.success:
                    print(f"FCM token failure [{idx}]: {send_response.exception}")
    except Exception as e:
        print(f"Error sending FCM multicast: {e}")

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
    from models import FCMToken

    sids = get_online_sids_for_user(user_id)
    if sids:
        for sid in sids:
            try:
                await sio.emit('notification', {"title": title, "body": body}, room=sid)
            except Exception as e:
                print(f"Error emitting socket notification: {e}")
        print(f"Sent notification to online user {user_id} via socket.")

    tokens = db.query(FCMToken).filter(FCMToken.user_id == user_id).all()
    if tokens:
        token_list = [t.token for t in tokens]
        send_fcm_notification(token_list, title, body)
        print(f"Sent notification to user {user_id} via FCM ({len(token_list)} token(s)).")

@app.post("/api/notifications/register-token")
def register_fcm_token(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
        
    from models import FCMToken
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
        db.commit()
    return {"success": True}

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
    count = 0
    for u in users:
        await send_notification_to_user(u.id, title, body, db)
        count += 1
        
    return {"success": True, "deliveredCount": count}


@app.on_event("startup")
def on_startup():
    init_db()


# Wrap FastAPI application with Socket.IO ASGIApp
app = socketio.ASGIApp(sio, other_asgi_app=app)

__all__ = ["app", "build_default_fee_installments", "decode_session_token"]




