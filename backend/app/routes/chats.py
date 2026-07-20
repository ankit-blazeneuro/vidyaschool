import os
import httpx
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.auth import get_current_user
from app.core.database import get_db
from models import User, ChatRoom, ChatMessage

router = APIRouter()

# Schema definitions
class ChatInitRequest(BaseModel):
    uuid: str
    title: str
    message: str

class ChatMessageRequest(BaseModel):
    message: str
    title: str = None

# Get API Key from environment or fallback to user provided key
NVIDIA_API_KEY = os.getenv(
    "NVIDIA_API_KEY", 
    "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"
)
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

async def call_nvidia_api(messages_payload: list) -> str:
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": messages_payload,
        "temperature": 0.8,
        "top_p": 1,
        "max_tokens": 4096,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                NVIDIA_BASE_URL,
                headers=headers,
                json=payload,
                timeout=45.0
            )
            if response.status_code == 200:
                res_data = response.json()
                return res_data["choices"][0]["message"]["content"]
            else:
                error_msg = f"NVIDIA API Error: Status {response.status_code} - {response.text}"
                print(error_msg)
                return f"Sorry, I encountered an error communicating with the NVIDIA AI model. ({response.status_code})"
    except Exception as e:
        print(f"Failed to reach NVIDIA API: {str(e)}")
        return f"Failed to establish connection with the AI assistant. ({str(e)})"


@router.post("/api/chats")
async def start_chat(
    req: ChatInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Check if chat room already exists
    room = db.query(ChatRoom).filter(ChatRoom.id == req.uuid).first()
    if not room:
        room = ChatRoom(
            id=req.uuid,
            user_id=current_user.id,
            title=req.title,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(room)
        db.commit()
        db.refresh(room)

    # 2. Add user message
    user_msg = ChatMessage(
        id=f"msg_{crypto_uuid()}" if "crypto_uuid" in globals() else f"msg_{datetime.utcnow().timestamp()}",
        room_id=room.id,
        role="user",
        content=req.message,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    # 3. Call NVIDIA completion
    nvidia_payload = [{"role": "user", "content": req.message}]
    assistant_content = await call_nvidia_api(nvidia_payload)

    # 4. Save assistant response
    assistant_msg = ChatMessage(
        id=f"msg_{datetime.utcnow().timestamp()}_ai",
        room_id=room.id,
        role="assistant",
        content=assistant_content,
        created_at=datetime.utcnow()
    )
    db.add(assistant_msg)
    
    # Update room update timestamp
    room.updated_at = datetime.utcnow()
    db.commit()

    return {
        "uuid": room.id,
        "title": room.title,
        "content": assistant_content
    }


@router.get("/api/chats")
def get_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rooms = (
        db.query(ChatRoom)
        .filter(ChatRoom.user_id == current_user.id)
        .order_by(ChatRoom.updated_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "title": r.title,
            "createdAt": r.created_at.isoformat() + "Z"
        }
        for r in rooms
    ]


@router.get("/api/chats/{uuid}")
def get_chat_messages(
    uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    if room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == uuid)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return {
        "id": room.id,
        "title": room.title,
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "createdAt": m.created_at.isoformat() + "Z"
            }
            for m in messages
        ],
        "createdAt": room.created_at.isoformat() + "Z"
    }


@router.post("/api/chats/{uuid}")
async def send_chat_message(
    uuid: str,
    req: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    if room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 1. Add user message
    user_msg = ChatMessage(
        id=f"msg_user_{datetime.utcnow().timestamp()}",
        room_id=room.id,
        role="user",
        content=req.message,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    
    # Update title dynamically if provided
    if req.title and room.title != req.title:
        room.title = req.title
        
    db.commit()

    # 2. Get conversational context
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == uuid)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    messages_payload = [{"role": m.role, "content": m.content} for m in history]

    # 3. Call NVIDIA completion
    assistant_content = await call_nvidia_api(messages_payload)

    # 4. Save assistant response
    assistant_msg = ChatMessage(
        id=f"msg_ai_{datetime.utcnow().timestamp()}",
        room_id=room.id,
        role="assistant",
        content=assistant_content,
        created_at=datetime.utcnow()
    )
    db.add(assistant_msg)
    
    room.updated_at = datetime.utcnow()
    db.commit()

    return {
        "role": "assistant",
        "content": assistant_content
    }
