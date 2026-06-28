import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine, Session
import socketio

from app.core.auth import decode_session_token
from app.core.database import init_db
from app.core.fees import build_default_fee_installments
from app.routes.fees import router as fees_router
from app.routes.teacher import router as teacher_router

# Load env variables from .env
load_dotenv()

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
                user.role = "teacher"
                user.teacher_approval_status = "approved"
                print(f"Updated user role to teacher")
                
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

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fees_router)
app.include_router(teacher_router)


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


@app.on_event("startup")
def on_startup():
    init_db()


# Wrap FastAPI application with Socket.IO ASGIApp
app = socketio.ASGIApp(sio, other_asgi_app=app)

__all__ = ["app", "build_default_fee_installments", "decode_session_token"]




