import os
import json
import uuid
import httpx
import asyncio
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.core.auth import require_role
from app.core.database import get_db
from models import (
    User, 
    UserProfile, 
    SubjectClassAssignment, 
    SubjectClassRequest, 
    Exam, 
    StudentSubjectMarks, 
    Notice, 
    TeacherNote,
    Timetable,
    ChatRoom,
    ChatMessage
)

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

# Restrict routes to portal personnel roles
authorized_roles = ["teacher", "librarian", "admin"]

# ── Define OpenAI Tool Specifications for NVIDIA LLM ──
NVIDIA_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_students_with_marks",
            "description": "Retrieve names of students who scored above a certain score in an exam.",
            "parameters": {
                "type": "object",
                "properties": {
                    "exam_name": {"type": "string", "description": "Name of the exam (e.g. 'Mid-Term', 'Annual Exams')"},
                    "subject": {"type": "string", "description": "Optional subject filter (e.g. 'Mathematics')"},
                    "min_score": {"type": "number", "description": "Minimum score threshold (defaults to 70.0)"}
                },
                "required": ["exam_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_student_roster",
            "description": "List students enrolled in a specific class and section.",
            "parameters": {
                "type": "object",
                "properties": {
                    "class_name": {"type": "string", "description": "Class name (e.g. 'Class 10' or '10')"},
                    "section": {"type": "string", "description": "Section letter (e.g. 'A')"}
                },
                "required": ["class_name", "section"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "submit_student_marks",
            "description": "Submit or update examination marks for a student.",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_email": {"type": "string", "description": "Student email"},
                    "exam_name": {"type": "string", "description": "Exam name"},
                    "subject": {"type": "string", "description": "Subject name"},
                    "score": {"type": "number", "description": "Score value"},
                    "max_score": {"type": "number", "description": "Max possible score (defaults to 100.0)"}
                },
                "required": ["student_email", "exam_name", "subject", "score"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "publish_notice",
            "description": "Publish a school notice for students or staff.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Notice title"},
                    "content": {"type": "string", "description": "Notice content body"},
                    "category": {"type": "string", "description": "Category: 'Academic', 'General', 'Administrative'"},
                    "target_class": {"type": "string", "description": "Optional target class (e.g. 'Class 10')"},
                    "target_section": {"type": "string", "description": "Optional target section (e.g. 'A')"}
                },
                "required": ["title", "content", "category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "manage_notes",
            "description": "CRUD operations on lesson planner notes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "description": "Action: 'create', 'read', 'update', 'delete', 'list'"},
                    "note_id": {"type": "string", "description": "ID of note (for read/update/delete)"},
                    "title": {"type": "string", "description": "Title (for create/update)"},
                    "content": {"type": "string", "description": "Content (for create/update)"},
                    "class_name": {"type": "string", "description": "Class filter"},
                    "section": {"type": "string", "description": "Section filter"},
                    "subject": {"type": "string", "description": "Subject filter"}
                },
                "required": ["action"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_timetable_slot",
            "description": "Schedule a teaching slot in the weekly timetable.",
            "parameters": {
                "type": "object",
                "properties": {
                    "class_name": {"type": "string", "description": "Class name (e.g. 'Class 10')"},
                    "section": {"type": "string", "description": "Section letter (e.g. 'A')"},
                    "subject": {"type": "string", "description": "Subject"},
                    "day_of_week": {"type": "string", "description": "Day of week ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')"},
                    "start_time": {"type": "string", "description": "Start time 24h format (e.g. '09:00')"},
                    "end_time": {"type": "string", "description": "End time 24h format (e.g. '09:45')"},
                    "room": {"type": "string", "description": "Optional room location"}
                },
                "required": ["class_name", "section", "subject", "day_of_week", "start_time", "end_time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_teacher_timetable",
            "description": "Retrieve the current teacher's weekly scheduled timetable slots.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]

# ── Database Tool Execution Logic ──
def execute_tool_call(name: str, args: dict, current_user: User, db: Session) -> str:
    try:
        if name == "get_students_with_marks":
            exam_name = args.get("exam_name")
            subject = args.get("subject")
            min_score = args.get("min_score", 70.0)

            stmt = select(User, StudentSubjectMarks).join(
                StudentSubjectMarks, User.id == StudentSubjectMarks.student_id
            ).join(
                Exam, StudentSubjectMarks.exam_id == Exam.id
            ).where(
                Exam.name == exam_name,
                StudentSubjectMarks.score >= min_score
            )
            if subject:
                stmt = stmt.where(StudentSubjectMarks.subject == subject)
            results = db.exec(stmt).all()
            if not results:
                return f"No students found with score >= {min_score} in {exam_name}."
            
            res = [f"Students with score >= {min_score} in {exam_name}:"]
            for u, m in results:
                res.append(f"- {u.name} ({u.email}): {m.score}/{m.max_score} in {m.subject}")
            return "\n".join(res)

        elif name == "get_student_roster":
            class_name = args.get("class_name")
            section = args.get("section")
            stmt = select(User, UserProfile).join(
                UserProfile, User.id == UserProfile.user_id
            ).where(
                UserProfile.class_ == class_name,
                UserProfile.section == section
            )
            results = db.exec(stmt).all()
            if not results:
                return f"No students found in Class {class_name} Section {section}."
            
            res = [f"Roster for {class_name}-{section}:"]
            for u, p in results:
                res.append(f"- {u.name} ({u.email}) | Adm: {p.admission_number or 'N/A'} | Phone: {p.phone_number or 'N/A'}")
            return "\n".join(res)

        elif name == "submit_student_marks":
            student_email = args.get("student_email")
            exam_name = args.get("exam_name")
            subject = args.get("subject")
            score = args.get("score")
            max_score = args.get("max_score", 100.0)

            student = db.exec(select(User).where(User.email == student_email)).first()
            if not student:
                return f"Error: Student with email {student_email} not found."
            
            profile = db.exec(select(UserProfile).where(UserProfile.user_id == student.id)).first()
            if not profile or not profile.class_:
                return f"Error: Student {student.name} is not onboarded in any class."

            exam = db.exec(select(Exam).where(
                Exam.name == exam_name,
                Exam.class_ == profile.class_,
                Exam.section == (profile.section or "")
            )).first()
            if not exam:
                exam = Exam(
                    id=f"exam_{uuid.uuid4().hex[:10]}",
                    name=exam_name,
                    class_=profile.class_,
                    section=(profile.section or ""),
                    created_at=datetime.utcnow()
                )
                db.add(exam)
                db.commit()
                db.refresh(exam)

            marks = db.exec(select(StudentSubjectMarks).where(
                StudentSubjectMarks.student_id == student.id,
                StudentSubjectMarks.exam_id == exam.id,
                StudentSubjectMarks.subject == subject
            )).first()

            if marks:
                marks.score = score
                marks.max_score = max_score
                marks.updated_at = datetime.utcnow()
            else:
                marks = StudentSubjectMarks(
                    id=f"marks_{uuid.uuid4().hex[:10]}",
                    student_id=student.id,
                    exam_id=exam.id,
                    subject=subject,
                    score=score,
                    max_score=max_score,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(marks)
            db.commit()
            return f"Success: Submitted marks for {student.name} in {subject}: {score}/{max_score}."

        elif name == "publish_notice":
            title = args.get("title")
            content = args.get("content")
            category = args.get("category")
            target_class = args.get("target_class")
            target_section = args.get("target_section")

            notice = Notice(
                id=f"notice_{uuid.uuid4().hex[:10]}",
                title=title,
                content=content,
                category=category,
                sender_id=current_user.id,
                target_role="student" if target_class else "all",
                target_class=target_class,
                target_section=target_section,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(notice)
            db.commit()
            return f"Success: Published notice '{title}' for target: {target_class or 'All'}."

        elif name == "manage_notes":
            action = args.get("action", "").lower()
            note_id = args.get("note_id")
            title = args.get("title")
            content = args.get("content")
            class_name = args.get("class_name")
            section = args.get("section")
            subject = args.get("subject")

            if action == "list":
                notes = db.exec(select(TeacherNote).where(TeacherNote.teacher_id == current_user.id)).all()
                if not notes:
                    return "No planner notes found."
                return "\n".join([f"- [{n.id}] {n.title} (Subject: {n.subject or 'None'})" for n in notes])
            
            elif action == "create":
                note = TeacherNote(
                    id=f"note_{uuid.uuid4().hex[:10]}",
                    teacher_id=current_user.id,
                    title=title or "Untitled Note",
                    content=content or "",
                    class_=class_name,
                    section=section,
                    subject=subject,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(note)
                db.commit()
                return f"Success: Created note '{note.title}' with ID {note.id}."

            if not note_id:
                return "Error: note_id is required for read, update, or delete actions."

            note = db.exec(select(TeacherNote).where(
                TeacherNote.id == note_id, TeacherNote.teacher_id == current_user.id
            )).first()
            if not note:
                return "Error: Note not found."

            if action == "read":
                return f"Title: {note.title}\nSubject: {note.subject or 'N/A'}\nClass: {note.class_ or 'N/A'}\nContent:\n{note.content}"
            elif action == "delete":
                db.delete(note)
                db.commit()
                return f"Success: Deleted note '{note.title}'."
            elif action == "update":
                if title: note.title = title
                if content: note.content = content
                if class_name: note.class_ = class_name
                note.updated_at = datetime.utcnow()
                db.commit()
                return f"Success: Updated note '{note.title}'."

            return "Error: Invalid action."

        elif name == "schedule_timetable_slot":
            class_name = args.get("class_name")
            section = args.get("section")
            subject = args.get("subject")
            day_of_week = args.get("day_of_week")
            start_time = args.get("start_time")
            end_time = args.get("end_time")
            room = args.get("room")

            # Check collision
            existing = db.exec(select(Timetable).where(
                Timetable.class_ == class_name,
                Timetable.section == section,
                Timetable.day_of_week == day_of_week,
                Timetable.start_time == start_time
            )).first()
            if existing:
                return f"Collision: A class for {class_name}-{section} is already scheduled on {day_of_week} at {start_time}."

            slot = Timetable(
                id=f"slot_{uuid.uuid4().hex[:10]}",
                teacher_id=current_user.id,
                class_=class_name,
                section=section,
                subject=subject,
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time,
                room=room,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(slot)
            db.commit()
            return f"Success: Scheduled {subject} class for {class_name}-{section} on {day_of_week} ({start_time} - {end_time}) in Room {room or 'N/A'}."

        elif name == "get_teacher_timetable":
            slots = db.exec(select(Timetable).where(
                Timetable.teacher_id == current_user.id
            ).order_by(Timetable.day_of_week, Timetable.start_time)).all()
            if not slots:
                return "Your timetable is currently empty."
            
            res = [f"Weekly Schedule for {current_user.name}:"]
            for s in slots:
                res.append(f"- {s.day_of_week}: {s.subject} ({s.class_}-{s.section}) at {s.start_time}-{s.end_time} in Room {s.room or 'N/A'}")
            return "\n".join(res)

        return "Unknown tool."
    except Exception as err:
        return f"Error executing tool: {str(err)}"

# ── Streaming Assistant Response Generators ──
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

    # Settle final message
    try:
        assistant_msg = ChatMessage(
            id=f"msg_ai_{uuid.uuid4()}",
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
        print(f"Failed to commit assistant message: {ex}")


async def simulated_stream_generator(content: str, room_id: str, db: Session):
    # Yield word-by-word with latency for visual typing feel
    words = content.split(" ")
    for i, word in enumerate(words):
        space = " " if i < len(words) - 1 else ""
        yield f"data: {json.dumps({'content': word + space})}\n\n"
        await asyncio.sleep(0.01)
        
    try:
        assistant_msg = ChatMessage(
            id=f"msg_ai_{uuid.uuid4()}",
            room_id=room_id,
            role="assistant",
            content=content,
            created_at=datetime.utcnow()
        )
        db.add(assistant_msg)
        room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
        if room:
            room.updated_at = datetime.utcnow()
        db.commit()
    except Exception as ex:
        print(f"Failed to commit simulated assistant message: {ex}")


# ── Core Agent execution loop with Tool Use ──
async def run_agent_loop(messages_payload: list, room_id: str, current_user: User, db: Session):
    system_msg = {
        "role": "system",
        "content": (
            f"You are the VidyaSchool AI Assistant. The current logged-in user is a teacher named "
            f"{current_user.name} (email: {current_user.email}, id: {current_user.id}). "
            f"If they request actions regarding classroom marks/grades, listing student rosters, "
            f"scheduling class timetables, publishing notices, or writing notes/lesson plans, "
            f"use the appropriate database tool. Always default to their teacher email '{current_user.email}' "
            f"or teacher ID '{current_user.id}' when calling tools."
        )
    }
    
    full_history = [system_msg] + messages_payload
    
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 1. Non-streaming check for tool calls
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": full_history,
        "temperature": 0.5,
        "top_p": 1,
        "max_tokens": 2048,
        "tools": NVIDIA_TOOLS,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(NVIDIA_BASE_URL, headers=headers, json=payload, timeout=60.0)
            
        if res.status_code != 200:
            return StreamingResponse(
                simulated_stream_generator("AI model failed to load. Please try again.", room_id, db),
                media_type="text/event-stream"
            )
            
        res_data = res.json()
        choice_message = res_data["choices"][0]["message"]
        tool_calls = choice_message.get("tool_calls")
        
        if tool_calls:
            # Append the assistant's tool-call request to messages
            full_history.append(choice_message)
            
            # Execute all requested tools
            for tc in tool_calls:
                t_name = tc["function"]["name"]
                t_args = json.loads(tc["function"]["arguments"])
                t_result = execute_tool_call(t_name, t_args, current_user, db)
                
                # Append tool response
                full_history.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "name": t_name,
                    "content": t_result
                })
                
            # Now stream final response summarizing the tool execution
            # Slice system message out of full_history before passing to generator
            return StreamingResponse(
                response_stream_generator(full_history[1:], room_id, db),
                media_type="text/event-stream"
            )
        else:
            # No tools called. Stream the pre-fetched content
            chat_text = choice_message.get("content", "")
            return StreamingResponse(
                simulated_stream_generator(chat_text, room_id, db),
                media_type="text/event-stream"
            )
            
    except Exception as e:
        return StreamingResponse(
            simulated_stream_generator(f"Agent Loop error: {str(e)}", room_id, db),
            media_type="text/event-stream"
        )


@router.post("/api/chats")
async def start_chat(
    req: ChatInitRequest,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db)
):
    # 1. Check if chat room already exists and prevent hijacked direct object spoofing (IdOR)
    room = db.query(ChatRoom).filter(ChatRoom.id == req.uuid).first()
    if room:
        if room.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to write to this room")
    else:
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

    # 2. Add user message with secure UUID
    user_msg = ChatMessage(
        id=f"msg_user_{uuid.uuid4()}",
        room_id=room.id,
        role="user",
        content=req.message,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    # 3. Trigger Agent loop
    nvidia_payload = [{"role": "user", "content": req.message}]
    return await run_agent_loop(nvidia_payload, room.id, current_user, db)


@router.get("/api/chats")
def get_chats(
    current_user: User = Depends(require_role(authorized_roles)),
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


@router.get("/api/chats/{uuid_val}")
def get_chat_messages(
    uuid_val: str,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid_val).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    if room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == uuid_val)
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


@router.post("/api/chats/{uuid_val}")
async def send_chat_message(
    uuid_val: str,
    req: ChatMessageRequest,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid_val).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    if room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 1. Add user message with secure UUID
    user_msg = ChatMessage(
        id=f"msg_user_{uuid.uuid4()}",
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
        .filter(ChatMessage.room_id == uuid_val)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    messages_payload = [{"role": m.role, "content": m.content} for m in history]

    # 3. Trigger Agent loop
    return await run_agent_loop(messages_payload, room.id, current_user, db)
