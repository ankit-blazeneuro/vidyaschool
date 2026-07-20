import os
import json
import httpx
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
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

async def response_stream_generator(messages_payload: list, room_id: str, db: Session):
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
        "stream": True
    }
    
    full_content = ""
    try:
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST", 
                NVIDIA_BASE_URL, 
                headers=headers, 
                json=payload, 
                timeout=60.0
            ) as r:
                if r.status_code != 200:
                    err_msg = f"NVIDIA error status {r.status_code}"
                    yield f"data: {json.dumps({'content': 'AI model connection failed.'})}\n\n"
                    return
                
                async for line in r.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk_data = json.loads(data_str)
                            content = chunk_data["choices"][0]["delta"].get("content", "")
                            if content:
                                full_content += content
                                yield f"data: {json.dumps({'content': content})}\n\n"
                        except Exception:
                            pass
    except Exception as e:
        yield f"data: {json.dumps({'content': f'Connection error: {str(e)}'})}\n\n"
        return

    # After full stream finishes, write complete response to DB
    try:
        assistant_msg = ChatMessage(
            id=f"msg_ai_{datetime.utcnow().timestamp()}",
            room_id=room_id,
            role="assistant",
            content=full_content,
            created_at=datetime.utcnow()
        )
        db.add(assistant_msg)
        
        room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
        if room:
            room.updated_at = datetime.utcnow()
            
        db.commit()
    except Exception as ex:
        print(f"Failed to save assistant stream to DB: {ex}")


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
        id=f"msg_user_{datetime.utcnow().timestamp()}",
        room_id=room.id,
        role="user",
        content=req.message,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    # 3. Stream NVIDIA completion
    nvidia_payload = [{"role": "user", "content": req.message}]
    return StreamingResponse(
        response_stream_generator(nvidia_payload, room.id, db),
        media_type="text/event-stream"
    )


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

    # 3. Stream NVIDIA completion
    return StreamingResponse(
        response_stream_generator(messages_payload, room.id, db),
        media_type="text/event-stream"
    )
