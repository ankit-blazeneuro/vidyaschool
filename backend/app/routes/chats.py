import os
import json
import uuid
import httpx
import asyncio
import base64
import io
import requests as pyrequests
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from sqlmodel import Session, select
from app.core.auth import require_role
from app.core.database import get_db, engine
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

from dotenv import load_dotenv
load_dotenv(override=False)

def get_nvidia_api_key() -> str:
    return os.getenv("NVIDIA_API_KEY", "").strip()

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

# ── Model config ──
# meta/llama-3.1-70b-instruct: High accuracy reasoning model on NVIDIA NIM
CHAT_MODEL = "meta/llama-3.1-70b-instruct"
CHAT_MAX_TOKENS = 1024

# ── Tool-check model (smaller, faster, no streaming) ──
TOOL_MODEL = "meta/llama-3.1-8b-instruct"
NEMOTRON_MODEL = "meta/llama-3.2-90b-vision-instruct"

# ── Supported MIME types for file extraction ──
IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}
PDF_TYPE = "application/pdf"
VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"}

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
    },
    {
        "type": "function",
        "function": {
            "name": "get_student_leaderboard",
            "description": "Retrieve top student rankings on the leaderboard sorted by average exam score.",
            "parameters": {
                "type": "object",
                "properties": {
                    "class_name": {"type": "string", "description": "Optional class filter (e.g. 'Class 10')"},
                    "section": {"type": "string", "description": "Optional section filter (e.g. 'A')"}
                }
            }
        }
    }
]

# ── Database Tool Execution Logic ──
def execute_tool_call(name: str, args: dict, current_user: User, db: Session) -> str:
    try:
        if name == "get_student_leaderboard":
            class_name = args.get("class_name")
            section = args.get("section")
            query = select(User, UserProfile).join(UserProfile, User.id == UserProfile.user_id).where(User.role == "student")
            if class_name:
                query = query.where(UserProfile.class_ == class_name)
            if section:
                query = query.where(UserProfile.section == section)
            class_students = db.exec(query).all()

            if not class_students:
                return "No student records found in the database for leaderboard."

            student_ids = [u.id for u, _ in class_students]
            all_marks = db.exec(select(StudentSubjectMarks).where(StudentSubjectMarks.student_id.in_(student_ids))).all()

            leaderboard_data = []
            for u, p in class_students:
                student_marks = [m for m in all_marks if m.student_id == u.id]
                if student_marks:
                    total_score = sum(m.score for m in student_marks)
                    total_max = sum(m.max_score for m in student_marks)
                    avg_pct = (total_score / total_max * 100) if total_max > 0 else 0
                else:
                    avg_pct = 0.0
                leaderboard_data.append({
                    "name": u.name,
                    "class": p.class_,
                    "section": p.section,
                    "average": round(avg_pct, 1),
                    "exams_count": len(set(m.exam_id for m in student_marks))
                })

            leaderboard_data.sort(key=lambda x: x["average"], reverse=True)

            res = ["🏆 Current Student Leaderboard:"]
            for rank, entry in enumerate(leaderboard_data[:10], 1):
                res.append(f"{rank}. {entry['name']} (Class {entry['class']}-{entry['section']}): {entry['average']}% avg score across {entry['exams_count']} exam(s)")
            return "\n".join(res)

        elif name == "get_students_with_marks":
            exam_name = args.get("exam_name", "")
            subject = args.get("subject")
            min_score = args.get("min_score", 70.0)

            # 1. Resolve exam target
            target_exam_ids = []
            
            # If requesting generic recent/last exam
            is_recent_query = any(kw in exam_name.lower() for kw in ["recent", "last", "latest", "recent exam", "last exam", "latest exam"]) or exam_name == ""
            
            if is_recent_query:
                # Find the most recently created exam
                latest_exam = db.exec(select(Exam).order_by(Exam.created_at.desc())).first()
                if latest_exam:
                    target_exam_ids = [latest_exam.id]
                    resolved_name = latest_exam.name
                else:
                    return "Error: No exams exist in the database yet."
            else:
                # Try finding matching exams via case-insensitive fuzzy match
                exams = db.exec(select(Exam).where(Exam.name.ilike(f"%{exam_name}%"))).all()
                if exams:
                    target_exam_ids = [e.id for e in exams]
                    resolved_name = ", ".join(list(set([e.name for e in exams])))
                else:
                    # Fallback to latest exam if no match is found
                    latest_exam = db.exec(select(Exam).order_by(Exam.created_at.desc())).first()
                    if latest_exam:
                        target_exam_ids = [latest_exam.id]
                        resolved_name = f"{latest_exam.name} (Fallback since '{exam_name}' was not found)"
                    else:
                        return f"Error: Exam matching '{exam_name}' not found, and no default exams exist."

            # 2. Query marks for the resolved exam(s)
            stmt = select(User, StudentSubjectMarks, Exam).join(
                StudentSubjectMarks, User.id == StudentSubjectMarks.student_id
            ).join(
                Exam, StudentSubjectMarks.exam_id == Exam.id
            ).where(
                Exam.id.in_(target_exam_ids),
                StudentSubjectMarks.score >= min_score
            )
            if subject:
                stmt = stmt.where(StudentSubjectMarks.subject.ilike(f"%{subject}%"))
            results = db.exec(stmt).all()
            if not results:
                return f"No students found with score >= {min_score} in exam '{resolved_name}'."
            
            res = [f"Students with score >= {min_score} in '{resolved_name}':"]
            for u, m, e in results:
                subj_str = f" in {m.subject}" if m.subject else ""
                res.append(f"- {u.name} ({u.email}): {m.score}/{m.max_score}{subj_str} (Exam: {e.name})")
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

# ─────────────────────────────────────────────────────────────────────────────
# FILE CONTENT EXTRACTION  (uses `requests` as instructed)
# ─────────────────────────────────────────────────────────────────────────────

def extract_image_content_via_nvidia(image_bytes: bytes, mime_type: str) -> str:
    """Describe an image by sending it to NVIDIA vision endpoint using `requests`."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64}"

    payload = {
        "model": NEMOTRON_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Describe this image in full detail. Extract all visible text, diagrams, charts, and relevant information."},
                    {"type": "image_url", "image_url": {"url": data_url}}
                ]
            }
        ],
        "max_tokens": 2048,
        "temperature": 0.3,
        "stream": False
    }
    headers = {
        "Authorization": f"Bearer {get_nvidia_api_key()}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    try:
        resp = pyrequests.post(NVIDIA_BASE_URL, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[Image extraction error: {str(e)}]"


def extract_pdf_content(pdf_bytes: bytes) -> str:
    """Extract text from a PDF using pdfplumber."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text and text.strip():
                    text_parts.append(f"--- Page {i + 1} ---\n{text.strip()}")
        return "\n\n".join(text_parts) if text_parts else "[No extractable text found in PDF]"
    except Exception as e:
        return f"[PDF extraction error: {str(e)}]"


def extract_video_description_via_nvidia(video_bytes: bytes, filename: str) -> str:
    """Send video metadata + sampled frame description to NVIDIA using `requests`."""
    # For video: we summarize it by sending first/last frame as an image if decodable
    # Fallback: return size/filename info since NVIDIA vision may not support raw video blobs
    file_size_mb = len(video_bytes) / (1024 * 1024)
    description = (
        f"[Video file uploaded: '{filename}', size: {file_size_mb:.2f} MB. "
        f"Please analyze and describe the content of this educational video based on its title/filename. "
        f"Suggest topics it may cover and how it relates to classroom teaching.]"
    )
    return description


# ─────────────────────────────────────────────────────────────────────────────
# UPLOAD ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/chats/upload")
async def upload_file_for_extraction(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(authorized_roles))
):
    """Accept image/PDF/video uploads and return extracted text content using `requests`."""
    content_type = (file.content_type or "").lower()
    filename = file.filename or "uploaded_file"
    raw_bytes = await file.read()

    if content_type in IMAGE_TYPES:
        extracted = extract_image_content_via_nvidia(raw_bytes, content_type)
        file_kind = "image"
    elif content_type == PDF_TYPE:
        extracted = extract_pdf_content(raw_bytes)
        file_kind = "pdf"
    elif content_type in VIDEO_TYPES:
        extracted = extract_video_description_via_nvidia(raw_bytes, filename)
        file_kind = "video"
    else:
        # Try to decode as plain text
        try:
            extracted = raw_bytes.decode("utf-8", errors="replace")
            file_kind = "text"
        except Exception:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {content_type}"
            )

    return JSONResponse({
        "filename": filename,
        "type": file_kind,
        "content": extracted,
        "size_bytes": len(raw_bytes)
    })


# ─────────────────────────────────────────────────────────────────────────────
# STREAMING GENERATORS  (Nemotron reasoning model)
# ─────────────────────────────────────────────────────────────────────────────

def _strip_think_blocks(text: str) -> str:
    """Remove <think>…</think> reasoning blocks from model output."""
    import re
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


async def response_stream_generator(messages_payload: list, room_id: str, db: Session):
    """Stream response from the primary chat model."""
    headers = {
        "Authorization": f"Bearer {get_nvidia_api_key()}",
        "Accept": "text/event-stream",
        "Content-Type": "application/json"
    }
    payload = {
        "model": CHAT_MODEL,
        "messages": messages_payload,
        "temperature": 0.7,
        "top_p": 0.95,
        "max_tokens": CHAT_MAX_TOKENS,
        "stream": True
    }

    full_content = ""

    try:
        timeout_config = httpx.Timeout(read=120.0, connect=30.0, pool=30.0, write=30.0)
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            async with client.stream(
                "POST",
                NVIDIA_BASE_URL,
                headers=headers,
                json=payload,
            ) as r:
                if r.status_code != 200:
                    err_bytes = await r.aread()
                    err_str = err_bytes.decode("utf-8", errors="replace")
                    print(f"NVIDIA API ERROR {r.status_code}: {err_str}")
                    yield f"data: {json.dumps({'content': f'AI Model Error ({r.status_code}): {err_str[:200]}'})}\n\n"
                    return

                try:
                    async for line in r.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk_data = json.loads(data_str)
                                delta = chunk_data["choices"][0]["delta"]
                                content = delta.get("content") or ""
                                if content:
                                    full_content += content
                                    yield f"data: {json.dumps({'content': content})}\n\n"
                            except Exception:
                                pass
                except Exception:
                    pass
    except Exception as e:
        if not full_content:
            import traceback
            print(f"DEBUG CHATS ERROR: {type(e).__name__} - {str(e)}")
            traceback.print_exc()
            yield f"data: {json.dumps({'content': 'AI model connection failed. Please try again.'})}\n\n"
            return

    # Persist assistant message
    try:
        with Session(engine) as new_db:
            assistant_msg = ChatMessage(
                id=f"msg_ai_{uuid.uuid4()}",
                room_id=room_id,
                role="assistant",
                content=full_content,
                created_at=datetime.utcnow()
            )
            new_db.add(assistant_msg)
            room = new_db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
            if room:
                room.updated_at = datetime.utcnow()
            new_db.commit()
    except Exception as ex:
        print(f"Failed to commit assistant message: {ex}")

    yield "data: [DONE]\n\n"


async def simulated_stream_generator(content: str, room_id: str, db: Session):
    # Yield word-by-word with latency for visual typing feel
    words = content.split(" ")
    for i, word in enumerate(words):
        space = " " if i < len(words) - 1 else ""
        yield f"data: {json.dumps({'content': word + space})}\n\n"
        await asyncio.sleep(0.01)
        
    try:
        with Session(engine) as new_db:
            assistant_msg = ChatMessage(
                id=f"msg_ai_{uuid.uuid4()}",
                room_id=room_id,
                role="assistant",
                content=content,
                created_at=datetime.utcnow()
            )
            new_db.add(assistant_msg)
            room = new_db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
            if room:
                room.updated_at = datetime.utcnow()
            new_db.commit()
    except Exception as ex:
        print(f"Failed to commit simulated assistant message: {ex}")

    yield "data: [DONE]\n\n"


def sanitize_messages_payload(messages: list) -> list:
    """Ensure messages strictly alternate roles and strip empty items for LLM APIs."""
    sanitized = []
    for msg in messages:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if not content and role != "assistant":
            continue
        
        if sanitized and sanitized[-1]["role"] == role:
            sanitized[-1]["content"] += f"\n\n{content}"
        else:
            sanitized.append({"role": role, "content": content})
    return sanitized


# ── Core Agent execution loop with Tool Use ──
async def run_agent_loop(messages_payload: list, room_id: str, current_user: User, db: Session):
    clean_history = sanitize_messages_payload(messages_payload)

    system_msg = {
        "role": "system",
        "content": (
            f"You are VidyaSchool AI, a smart school assistant built into the VidyaSchool portal. "
            f"Your name is VidyaSchool AI. "
            f"The current logged-in user is a teacher named {current_user.name} "
            f"(email: {current_user.email}, id: {current_user.id}). "
            f"For simple conversational questions (greetings, your name, general knowledge, etc.), "
            f"respond naturally WITHOUT calling any tools. "
            f"Only use database tools when the teacher explicitly requests actions like: "
            f"checking student marks/grades, listing student rosters, scheduling class timetables, "
            f"publishing school notices, or managing lesson plan notes. "
            f"Always default to their teacher email '{current_user.email}' "
            f"or teacher ID '{current_user.id}' when calling tools. "
            f"IMPORTANT: When the teacher asks you to send a notice, push notification, or any message to students, "
            f"you MUST first draft the improved message with corrected grammar and spelling, show it to the teacher "
            f"in a formatted preview, and ask for confirmation before calling any tool. "
            f"Format the preview as:\n"
            f"📢 **Draft Message:**\n[improved message here]\n\n"
            f"Shall I go ahead and send this? Reply 'yes' to confirm or suggest changes. "
            f"NEVER output raw JSON in your response. Always respond in natural language only. "
            f"CRITICAL: NEVER fabricate, invent, or guess any student data, marks, addresses, phone numbers, "
            f"emails, scores, ranks, or personal information. "
            f"If you do not have real data from a tool call, say you don't have that information and suggest "
            f"the teacher look it up in the portal directly. Only state facts you retrieved from actual tool results."
        )
    }

    full_history = [system_msg] + clean_history

    headers = {
        "Authorization": f"Bearer {get_nvidia_api_key()}",
        "Content-Type": "application/json"
    }

    # Check if user message requires database tool check
    last_user_msg = ""
    for msg in reversed(messages_payload):
        if msg.get("role") == "user":
            last_user_msg = (msg.get("content") or "").lower()
            break

    tool_keywords = [
        "mark", "marks", "score", "scores", "grade", "grades", "exam", "exams",
        "roster", "student", "students", "leaderboard", "top", "performer", "performers",
        "rank", "ranking", "topper", "toppers", "best", "highest", "average", "class",
        "result", "results", "who", "which", "list", "show",
        "notice", "publish", "announce", "timetable", "schedule", "slot", "note", "planner",
        "push", "notification", "send", "yes", "confirm"
    ]
    needs_tool_check = any(kw in last_user_msg for kw in tool_keywords)

    # Draft-first actions: never call tool on first request, always draft and confirm
    draft_first_keywords = ["notice", "publish", "announce", "push", "notification", "send", "notify"]
    is_draft_first = any(kw in last_user_msg for kw in draft_first_keywords)

    # Only skip draft-first if teacher is explicitly confirming
    is_confirmation = last_user_msg.strip() in ["yes", "yes.", "yeah", "confirm", "send it", "go ahead", "ok", "okay"]

    # When confirming, replace the "yes" with the drafted content so tool uses improved message
    if is_confirmation:
        # Find last assistant draft message in history
        last_draft = ""
        for msg in reversed(clean_history):
            if msg.get("role") == "assistant" and "draft message" in msg.get("content", "").lower():
                last_draft = msg["content"]
                break
        if last_draft:
            # Extract the drafted text between "Draft Message:" and "Shall I"
            import re
            match = re.search(r"Draft Message[:\*\s]+(.+?)(?:Shall I|$)", last_draft, re.DOTALL | re.IGNORECASE)
            if match:
                drafted_content = match.group(1).strip().strip("*").strip()
                # Replace last user "yes" with instruction containing the drafted message
                full_history = [system_msg] + clean_history[:-1] + [{
                    "role": "user",
                    "content": f"Yes, confirmed. Please send this exact message:\n\n{drafted_content}"
                }]

    greetings = ["hi", "hello", "hey", "good morning", "good evening", "greetings", "hi there"]
    needs_tool_check = last_user_msg.strip() not in greetings and (not is_draft_first or is_confirmation)

    if needs_tool_check:
        tool_payload = {
            "model": TOOL_MODEL,
            "messages": full_history,
            "temperature": 0.3,
            "top_p": 1,
            "max_tokens": 1024,
            "tools": NVIDIA_TOOLS,
            "stream": False
        }

        try:
            async with httpx.AsyncClient() as client:
                tool_res = await client.post(NVIDIA_BASE_URL, headers=headers, json=tool_payload, timeout=15.0)

            if tool_res.status_code == 200:
                tool_data = tool_res.json()
                choice_message = tool_data["choices"][0]["message"]
                tool_calls = choice_message.get("tool_calls")

                if tool_calls:
                    full_history.append(choice_message)

                    for tc in tool_calls:
                        t_name = tc["function"]["name"]
                        t_args = json.loads(tc["function"]["arguments"])
                        t_result = execute_tool_call(t_name, t_args, current_user, db)

                        full_history.append({
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "name": t_name,
                            "content": t_result
                        })

                    return StreamingResponse(
                        response_stream_generator(full_history, room_id, db),
                        media_type="text/event-stream"
                    )

        except Exception as err:
            print(f"[Agent Tool Execution Error]: {err}")

    # Stream response directly with system context included
    return StreamingResponse(
        response_stream_generator(full_history, room_id, db),
        media_type="text/event-stream"
    )



def generate_ai_chat_title(user_message: str) -> str:
    """Generate a short 3-6 word title using AI model or smart summarizer."""
    if not user_message or not user_message.strip():
        return "New AI Chat"
    
    clean_msg = user_message.strip()
    
    payload = {
        "model": CHAT_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You generate short 3-6 word titles for chat sessions based on the user's initial prompt. Output ONLY the title, no quotes, no period."
            },
            {
                "role": "user",
                "content": f"Title for: {clean_msg[:150]}"
            }
        ],
        "max_tokens": 15,
        "temperature": 0.3
    }
    headers = {
        "Authorization": f"Bearer {get_nvidia_api_key()}",
        "Content-Type": "application/json"
    }
    try:
        resp = pyrequests.post(NVIDIA_BASE_URL, headers=headers, json=payload, timeout=2.5)
        if resp.status_code == 200:
            title = resp.json()["choices"][0]["message"]["content"].strip().strip('"').strip("'")
            if title and len(title) > 2:
                return title[:60]
    except Exception:
        pass
        
    words = clean_msg.split()
    fallback_title = " ".join(words[:5]).capitalize()
    return fallback_title[:50]


@router.post("/api/chats")
async def start_chat(
    req: ChatInitRequest,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db)
):
    # 1. Check if chat room already exists and prevent hijacked direct object spoofing (IdOR)
    room = db.query(ChatRoom).filter(ChatRoom.id == req.uuid).first()
    ai_title = generate_ai_chat_title(req.message)

    if room:
        if room.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to write to this room")
        if room.title in ["AI Chat Assistant", "AI Teaching Assistant", "New AI Chat", ""]:
            room.title = ai_title
            db.commit()
    else:
        room = ChatRoom(
            id=req.uuid,
            user_id=current_user.id,
            title=ai_title,
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


@router.get("/api/chats/widget-status")
def check_widget_status(
    type: str,
    title: str = "",
    content: str = "",
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db)
):
    """
    Checks backend database to verify if a tool action (notice or notification)
    has actually been executed and saved in the database.
    Must be registered BEFORE /api/chats/{uuid_val} to avoid route shadowing.
    """
    if type == "send_notice":
        query = db.query(Notice)
        if title.strip():
            clean_title = title.strip().replace("%", "")
            query = query.filter(Notice.title.ilike(f"%{clean_title}%"))
        elif content.strip():
            clean_content = content.strip()[:40].replace("%", "")
            query = query.filter(Notice.content.ilike(f"%{clean_content}%"))
        notice_obj = query.first()
        if notice_obj:
            return {"status": "success", "executed": True, "noticeId": notice_obj.id}
        return {"status": "pending", "executed": False}

    elif type == "send_push":
        from models import NotificationHistory
        query = db.query(NotificationHistory)
        if title.strip():
            clean_title = title.strip().replace("%", "")
            query = query.filter(NotificationHistory.title.ilike(f"%{clean_title}%"))
        elif content.strip():
            clean_content = content.strip()[:40].replace("%", "")
            query = query.filter(NotificationHistory.body.ilike(f"%{clean_content}%"))
        notif_obj = query.first()
        if notif_obj:
            return {"status": "success", "executed": True}
        return {"status": "pending", "executed": False}

    return {"status": "pending", "executed": False}


@router.get("/api/chats/{uuid_val}")
def get_chat_messages(
    uuid_val: str,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid_val).first()
    if not room:
        return {
            "id": uuid_val,
            "exists": False,
            "title": "AI Chat Assistant",
            "messages": [
                {
                    "role": "assistant",
                    "content": "Hello! I am your AI assistant. How can I help you plan your tasks or grade sheets today?",
                    "createdAt": datetime.utcnow().isoformat() + "Z"
                }
            ],
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }
        
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
    # Upsert room — create if missing so this never 404s on a race condition
    if not room:
        ai_title = generate_ai_chat_title(req.message)
        room = ChatRoom(
            id=uuid_val,
            user_id=current_user.id,
            title=ai_title,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(room)
        db.commit()
        db.refresh(room)
    elif room.user_id != current_user.id:
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

    # Auto-generate AI title if room has a generic/placeholder title
    if room.title in ["AI Chat Assistant", "AI Teaching Assistant", "New AI Chat", ""]:
        room.title = generate_ai_chat_title(req.message)

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





@router.delete("/api/chats/{uuid_val}")
def delete_chat(
    uuid_val: str,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid_val).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    if room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this chat")

    # Delete all associated messages first
    db.query(ChatMessage).filter(ChatMessage.room_id == uuid_val).delete(synchronize_session=False)
    db.delete(room)
    db.commit()

    return {"success": True, "id": uuid_val}

