import os
import json
import uuid
import asyncio
import base64
import io
import threading
import requests
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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
    ChatMessage,
)

router = APIRouter()

# ── Schema definitions ─────────────────────────────────────────────────────────

from typing import Optional

class ChatInitRequest(BaseModel):
    uuid: str
    title: str
    message: str
    use_thinking: bool = True
    attachment_data_url: Optional[str] = None
    attachment_mime: Optional[str] = None


class ChatMessageRequest(BaseModel):
    message: str
    title: str = None
    use_thinking: bool = True
    attachment_data_url: Optional[str] = None
    attachment_mime: Optional[str] = None


from dotenv import load_dotenv
load_dotenv(override=False)

# ── NVIDIA API config ──────────────────────────────────────────────────────────

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "").strip()
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

# Primary model: DiffusionGemma with thinking enabled
CHAT_MODEL = "google/diffusiongemma-26b-a4b-it"
CHAT_MAX_TOKENS = 4096

# Tool-check model (fast, no thinking required)
TOOL_MODEL = "meta/llama-3.1-8b-instruct"

# Vision model for image description
VISION_MODEL = "meta/llama-3.2-90b-vision-instruct"

# ── AWS S3 config ──────────────────────────────────────────────────────────────

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET_NAME", "")

# ── Supported MIME types ───────────────────────────────────────────────────────

IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}
PDF_TYPE = "application/pdf"
VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"}

# Restrict routes to portal personnel roles
authorized_roles = ["teacher", "librarian", "admin"]


def get_nvidia_headers(stream: bool = True) -> dict:
    return {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "text/event-stream" if stream else "application/json",
        "Content-Type": "application/json",
    }


# ── AWS S3 Upload ──────────────────────────────────────────────────────────────

def upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Upload a file to S3 and return the public URL. Returns empty string on failure."""
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET]):
        return ""
    try:
        import boto3
        s3 = boto3.client(
            "s3",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        key = f"ai-chat-uploads/{uuid.uuid4().hex}/{filename}"
        s3.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
        return url
    except Exception as e:
        print(f"[S3 Upload Error]: {e}")
        return ""


# ── File content extraction ────────────────────────────────────────────────────

def extract_image_content_via_nvidia(image_bytes: bytes, mime_type: str) -> str:
    """Describe an image via NVIDIA vision endpoint using requests."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64}"
    payload = {
        "model": VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Describe this image in full detail. Extract all visible text, diagrams, charts, and relevant information.",
                    },
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "max_tokens": 2048,
        "temperature": 0.3,
        "stream": False,
    }
    try:
        resp = requests.post(
            NVIDIA_BASE_URL,
            headers=get_nvidia_headers(stream=False),
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
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


def extract_video_description(filename: str, file_size_bytes: int) -> str:
    file_size_mb = file_size_bytes / (1024 * 1024)
    return (
        f"[Video file uploaded: '{filename}', size: {file_size_mb:.2f} MB. "
        f"Please analyze and describe the content of this educational video based on its title/filename. "
        f"Suggest topics it may cover and how it relates to classroom teaching.]"
    )


# ── UPLOAD ENDPOINT ────────────────────────────────────────────────────────────

@router.post("/api/chats/upload")
async def upload_file_for_chat(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(authorized_roles)),
):
    """
    Accept image/PDF/video/text uploads.
    - Uploads file to AWS S3 (returns public URL for display).
    - Extracts text content for AI context.
    - Returns: filename, type, content (extracted text), s3_url, size_bytes.
    """
    content_type = (file.content_type or "").lower()
    filename = file.filename or "uploaded_file"
    raw_bytes = await file.read()

    # Upload to S3 in background (non-blocking via thread)
    s3_url = ""
    try:
        s3_url = upload_to_s3(raw_bytes, filename, content_type)
    except Exception:
        pass

    # For images: return base64 data URL directly — DiffusionGemma accepts images natively.
    # No secondary vision model needed.
    if content_type in IMAGE_TYPES:
        b64 = base64.b64encode(raw_bytes).decode("utf-8")
        data_url = f"data:{content_type};base64,{b64}"
        extracted = data_url
        file_kind = "image"
    elif content_type == PDF_TYPE:
        extracted = extract_pdf_content(raw_bytes)
        file_kind = "pdf"
    elif content_type in VIDEO_TYPES:
        extracted = extract_video_description(filename, len(raw_bytes))
        file_kind = "video"
    else:
        try:
            extracted = raw_bytes.decode("utf-8", errors="replace")
            file_kind = "text"
        except Exception:
            raise HTTPException(status_code=415, detail=f"Unsupported file type: {content_type}")

    return JSONResponse(
        {
            "filename": filename,
            "type": file_kind,
            "content": extracted,      # base64 data URL for images; extracted text for others
            "s3_url": s3_url,          # S3 URL for chat bubble display
            "size_bytes": len(raw_bytes),
        }
    )


# ── Tool definitions ───────────────────────────────────────────────────────────

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
                    "min_score": {"type": "number", "description": "Minimum score threshold (defaults to 70.0)"},
                },
                "required": ["exam_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_student_roster",
            "description": "List students enrolled in a specific class and section (does NOT return marks, grades, or performance rankings).",
            "parameters": {
                "type": "object",
                "properties": {
                    "class_name": {"type": "string", "description": "Class name (e.g. 'Class 10' or '10')"},
                    "section": {"type": "string", "description": "Section letter (e.g. 'A')"},
                },
                "required": ["class_name", "section"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_student_leaderboard",
            "description": "Retrieve top student rankings, best performer of the class, toppers, highest scorers, and leaderboard sorted by average exam score.",
            "parameters": {
                "type": "object",
                "properties": {
                    "class_name": {"type": "string", "description": "Optional class filter (e.g. 'Class 10')"},
                    "section": {"type": "string", "description": "Optional section filter (e.g. 'A')"},
                },
            },
        },
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
                    "max_score": {"type": "number", "description": "Max possible score (defaults to 100.0)"},
                },
                "required": ["student_email", "exam_name", "subject", "score"],
            },
        },
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
                    "target_section": {"type": "string", "description": "Optional target section (e.g. 'A')"},
                },
                "required": ["title", "content", "category"],
            },
        },
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
                    "subject": {"type": "string", "description": "Subject filter"},
                },
                "required": ["action"],
            },
        },
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
                    "day_of_week": {"type": "string", "description": "Day of week"},
                    "start_time": {"type": "string", "description": "Start time 24h format (e.g. '09:00')"},
                    "end_time": {"type": "string", "description": "End time 24h format (e.g. '09:45')"},
                    "room": {"type": "string", "description": "Optional room location"},
                },
                "required": ["class_name", "section", "subject", "day_of_week", "start_time", "end_time"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_teacher_timetable",
            "description": "Retrieve the current teacher's weekly scheduled timetable slots.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


# ── Database Tool Execution ────────────────────────────────────────────────────

def execute_tool_call(name: str, args: dict, current_user: User, db: Session) -> str:
    try:
        if name == "get_student_leaderboard":
            class_name = args.get("class_name")
            section = args.get("section")
            
            clean_class = ""
            if class_name:
                clean_class = str(class_name).replace("Class", "").replace("class", "").strip()

            query = select(User, UserProfile).join(UserProfile, User.id == UserProfile.user_id).where(User.role == "student")
            all_students = db.exec(query).all()
            
            # Try filtering by specified class/section first
            class_students = all_students
            if clean_class:
                filtered = [
                    (u, p) for u, p in all_students 
                    if p.class_ and (p.class_ == clean_class or clean_class in str(p.class_))
                ]
                if filtered:
                    class_students = filtered
            
            if section:
                filtered_sec = [(u, p) for u, p in class_students if p.section and p.section.lower() == str(section).lower()]
                if filtered_sec:
                    class_students = filtered_sec

            student_ids = [u.id for u, _ in class_students]
            all_marks = db.exec(select(StudentSubjectMarks).where(StudentSubjectMarks.student_id.in_(student_ids))).all() if student_ids else []
            
            # If the filtered subset has no marks, fall back to all students in database with marks
            if not all_marks and class_students != all_students:
                class_students = all_students
                student_ids = [u.id for u, _ in all_students]
                all_marks = db.exec(select(StudentSubjectMarks).where(StudentSubjectMarks.student_id.in_(student_ids))).all() if student_ids else []

            if not class_students:
                return "No student records found in the database for leaderboard."

            leaderboard_data = []
            for u, p in class_students:
                student_marks = [m for m in all_marks if m.student_id == u.id]
                if student_marks:
                    total_score = sum(m.score for m in student_marks)
                    total_max = sum(m.max_score for m in student_marks)
                    avg_pct = (total_score / total_max * 100) if total_max > 0 else 0
                    leaderboard_data.append({
                        "name": u.name,
                        "class": p.class_ or "N/A",
                        "section": p.section or "N/A",
                        "average": round(avg_pct, 1),
                        "exams_count": len(set(m.exam_id for m in student_marks)),
                    })

            # Sort students with marks first by average percentage descending
            leaderboard_data.sort(key=lambda x: x["average"], reverse=True)
            if not leaderboard_data:
                return "No student examination marks recorded yet in the system."

            res = ["🏆 Current Student Leaderboard:"]
            for rank, entry in enumerate(leaderboard_data[:10], 1):
                res.append(
                    f"{rank}. {entry['name']} (Class {entry['class']}-{entry['section']}): "
                    f"{entry['average']}% avg score across {entry['exams_count']} exam(s)"
                )
            return "\n".join(res)

        elif name == "get_students_with_marks":
            exam_name = args.get("exam_name", "")
            subject = args.get("subject")
            min_score = args.get("min_score", 70.0)
            target_exam_ids = []
            is_recent_query = any(
                kw in exam_name.lower()
                for kw in ["recent", "last", "latest"]
            ) or exam_name == ""
            if is_recent_query:
                latest_exam = db.exec(select(Exam).order_by(Exam.created_at.desc())).first()
                if latest_exam:
                    target_exam_ids = [latest_exam.id]
                    resolved_name = latest_exam.name
                else:
                    return "Error: No exams exist in the database yet."
            else:
                exams = db.exec(select(Exam).where(Exam.name.ilike(f"%{exam_name}%"))).all()
                if exams:
                    target_exam_ids = [e.id for e in exams]
                    resolved_name = ", ".join(list(set([e.name for e in exams])))
                else:
                    latest_exam = db.exec(select(Exam).order_by(Exam.created_at.desc())).first()
                    if latest_exam:
                        target_exam_ids = [latest_exam.id]
                        resolved_name = f"{latest_exam.name} (Fallback)"
                    else:
                        return f"Error: Exam matching '{exam_name}' not found."
            stmt = (
                select(User, StudentSubjectMarks, Exam)
                .join(StudentSubjectMarks, User.id == StudentSubjectMarks.student_id)
                .join(Exam, StudentSubjectMarks.exam_id == Exam.id)
                .where(Exam.id.in_(target_exam_ids), StudentSubjectMarks.score >= min_score)
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
            stmt = select(User, UserProfile).join(UserProfile, User.id == UserProfile.user_id).where(
                UserProfile.class_ == class_name, UserProfile.section == section
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
            exam = db.exec(
                select(Exam).where(
                    Exam.name == exam_name,
                    Exam.class_ == profile.class_,
                    Exam.section == (profile.section or ""),
                )
            ).first()
            if not exam:
                exam = Exam(
                    id=f"exam_{uuid.uuid4().hex[:10]}",
                    name=exam_name,
                    class_=profile.class_,
                    section=(profile.section or ""),
                    created_at=datetime.utcnow(),
                )
                db.add(exam)
                db.commit()
                db.refresh(exam)
            marks = db.exec(
                select(StudentSubjectMarks).where(
                    StudentSubjectMarks.student_id == student.id,
                    StudentSubjectMarks.exam_id == exam.id,
                    StudentSubjectMarks.subject == subject,
                )
            ).first()
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
                    updated_at=datetime.utcnow(),
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
                updated_at=datetime.utcnow(),
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
                    updated_at=datetime.utcnow(),
                )
                db.add(note)
                db.commit()
                return f"Success: Created note '{note.title}' with ID {note.id}."
            if not note_id:
                return "Error: note_id is required for read, update, or delete actions."
            note = db.exec(
                select(TeacherNote).where(
                    TeacherNote.id == note_id, TeacherNote.teacher_id == current_user.id
                )
            ).first()
            if not note:
                return "Error: Note not found."
            if action == "read":
                return f"Title: {note.title}\nSubject: {note.subject or 'N/A'}\nClass: {note.class_ or 'N/A'}\nContent:\n{note.content}"
            elif action == "delete":
                db.delete(note)
                db.commit()
                return f"Success: Deleted note '{note.title}'."
            elif action == "update":
                if title:
                    note.title = title
                if content:
                    note.content = content
                if class_name:
                    note.class_ = class_name
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
            existing = db.exec(
                select(Timetable).where(
                    Timetable.class_ == class_name,
                    Timetable.section == section,
                    Timetable.day_of_week == day_of_week,
                    Timetable.start_time == start_time,
                )
            ).first()
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
                updated_at=datetime.utcnow(),
            )
            db.add(slot)
            db.commit()
            return f"Success: Scheduled {subject} for {class_name}-{section} on {day_of_week} ({start_time} - {end_time}) in Room {room or 'N/A'}."

        elif name == "get_teacher_timetable":
            slots = db.exec(
                select(Timetable)
                .where(Timetable.teacher_id == current_user.id)
                .order_by(Timetable.day_of_week, Timetable.start_time)
            ).all()
            if not slots:
                return "Your timetable is currently empty."
            res = [f"Weekly Schedule for {current_user.name}:"]
            for s in slots:
                res.append(
                    f"- {s.day_of_week}: {s.subject} ({s.class_}-{s.section}) at {s.start_time}-{s.end_time} in Room {s.room or 'N/A'}"
                )
            return "\n".join(res)

        return "Unknown tool."
    except Exception as err:
        return f"Error executing tool: {str(err)}"


# ── Streaming helpers ──────────────────────────────────────────────────────────

def _parse_sse_stream(resp) -> list[dict]:
    """Parse all SSE events from a requests streaming response into a list of dicts."""
    events = []
    for raw_line in resp.iter_lines():
        if not raw_line:
            continue
        line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
        if not line.startswith("data: "):
            continue
        data_str = line[6:].strip()
        if data_str == "[DONE]":
            break
        try:
            events.append(json.loads(data_str))
        except Exception:
            pass
    return events


def sanitize_messages_payload(messages: list) -> list:
    """Ensure messages strictly alternate roles and strip empty plain-text items.
    Multimodal content (list) is passed through unchanged."""
    sanitized = []
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content")
        # Pass multimodal content (list of parts) through as-is
        if isinstance(content, list):
            if sanitized and sanitized[-1]["role"] == role:
                # Can't easily merge multimodal; just append a new turn
                sanitized.append({"role": role, "content": content})
            else:
                sanitized.append({"role": role, "content": content})
            continue
        content_str = (content or "").strip()
        if not content_str and role != "assistant":
            continue
        if sanitized and sanitized[-1]["role"] == role:
            sanitized[-1]["content"] += f"\n\n{content_str}"
        else:
            sanitized.append({"role": role, "content": content_str})
    return sanitized


def _build_system_message(current_user: User) -> dict:
    return {
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
            f"IMPORTANT: When the teacher asks you to send a notice or message to students, "
            f"you MUST first draft an improved version with corrected grammar, show it in a formatted preview, "
            f"and ask for confirmation before calling any tool. "
            f"Format the preview as:\n"
            f"📢 **Draft Message:**\n[improved message here]\n\n"
            f"Shall I go ahead and send this? Reply 'yes' to confirm or suggest changes. "
            f"NEVER output raw JSON in your response. Always respond in natural language only. "
            f"CRITICAL: NEVER fabricate, invent, or guess any student data, marks, addresses, phone numbers, "
            f"emails, scores, ranks, or personal information. "
            f"If you do not have real data from a tool call, say you don't have that information."
        ),
    }

# ── Multimodal message builder ────────────────────────────────────────────────

def build_user_content(text: str, attachment_data_url: Optional[str] = None, attachment_mime: Optional[str] = None):
    """
    Build the 'content' field for a user message.
    - If an image data URL is supplied, return a multimodal list with text + image_url.
    - Otherwise return a plain string.
    """
    if attachment_data_url and attachment_mime and attachment_mime.startswith("image/"):
        return [
            {"type": "text", "text": text or "What is this?"},
            {"type": "image_url", "image_url": {"url": attachment_data_url}},
        ]
    return text



async def response_stream_generator(messages_payload: list, room_id: str, use_thinking: bool = True):
    """
    Stream response using requests + iter_lines() in a thread executor.
    - use_thinking=True  → google/diffusiongemma-26b-a4b-it with reasoning enabled
    - use_thinking=False → meta/llama-3.1-70b-instruct, fast normal mode
    """
    if use_thinking:
        payload = {
            "model": CHAT_MODEL,
            "messages": messages_payload,
            "chat_template_kwargs": {"enable_thinking": True},
            "max_tokens": CHAT_MAX_TOKENS,
            "stream": True,
            "temperature": 1,
            "top_p": 0.95,
        }
    else:
        payload = {
            "model": "meta/llama-3.1-70b-instruct",
            "messages": messages_payload,
            "max_tokens": CHAT_MAX_TOKENS,
            "stream": True,
            "temperature": 0.7,
            "top_p": 0.95,
        }

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue = asyncio.Queue()
    full_content = ""

    def stream_in_thread():
        """Run the blocking requests stream in a thread and push events into the async queue."""
        try:
            resp = requests.post(
                NVIDIA_BASE_URL,
                headers=get_nvidia_headers(stream=True),
                json=payload,
                stream=True,
                timeout=(30, 180),
            )
            if resp.status_code != 200:
                err_text = resp.text[:300]
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    {"error": f"NVIDIA API {resp.status_code}: {err_text}"},
                )
                loop.call_soon_threadsafe(queue.put_nowait, None)
                return

            in_thinking = False
            thinking_buf = ""
            content_buf = ""

            for raw_line in resp.iter_lines():
                if not raw_line:
                    continue
                line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
                if not line.startswith("data: "):
                    continue
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk["choices"][0].get("delta", {})
                    reasoning = (delta.get("reasoning_content") or delta.get("reasoning") or delta.get("thinking") or "").replace("<|channel>thought", "").strip()
                    content = delta.get("content") or ""

                    # Also handle <think> / <thought> tags inside content stream
                    if "<think>" in content or "<thought>" in content:
                        in_thinking = True
                        content = content.replace("<think>", "").replace("<thought>", "")
                    if "</think>" in content or "</thought>" in content:
                        split_tag = "</think>" if "</think>" in content else "</thought>"
                        parts = content.split(split_tag, 1)
                        reasoning += parts[0]
                        content = parts[1] if len(parts) > 1 else ""
                        in_thinking = False

                    if in_thinking:
                        reasoning += content
                        content = ""

                    if reasoning:
                        loop.call_soon_threadsafe(queue.put_nowait, {"thinking": reasoning})
                    if content:
                        nonlocal full_content
                        full_content += content
                        loop.call_soon_threadsafe(queue.put_nowait, {"content": content})

                except Exception:
                    pass

        except Exception as e:
            print(f"[DiffusionGemma Stream Error]: {e}")
            loop.call_soon_threadsafe(
                queue.put_nowait,
                {"error": "AI model connection failed. Please try again."},
            )
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

    # Run blocking requests call in thread pool
    thread = threading.Thread(target=stream_in_thread, daemon=True)
    thread.start()

    # Yield events as SSE to client
    while True:
        event = await queue.get()
        if event is None:
            break
        if "error" in event:
            yield f"data: {json.dumps({'content': event['error']})}\n\n"
        elif "thinking" in event:
            yield f"data: {json.dumps({'thinking': event['thinking']})}\n\n"
        elif "content" in event:
            yield f"data: {json.dumps({'content': event['content']})}\n\n"

    # Persist assistant message in a new DB session
    if full_content:
        try:
            with Session(engine) as new_db:
                assistant_msg = ChatMessage(
                    id=f"msg_ai_{uuid.uuid4()}",
                    room_id=room_id,
                    role="assistant",
                    content=full_content,
                    created_at=datetime.utcnow(),
                )
                new_db.add(assistant_msg)
                room = new_db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
                if room:
                    room.updated_at = datetime.utcnow()
                new_db.commit()
        except Exception as ex:
            print(f"[Persist Error]: {ex}")

    yield "data: [DONE]\n\n"


async def simulated_stream_generator(content: str, room_id: str):
    """Word-by-word simulated stream as fallback."""
    words = content.split(" ")
    for i, word in enumerate(words):
        space = " " if i < len(words) - 1 else ""
        yield f"data: {json.dumps({'content': word + space})}\n\n"
        await asyncio.sleep(0.012)

    try:
        with Session(engine) as new_db:
            assistant_msg = ChatMessage(
                id=f"msg_ai_{uuid.uuid4()}",
                room_id=room_id,
                role="assistant",
                content=content,
                created_at=datetime.utcnow(),
            )
            new_db.add(assistant_msg)
            room = new_db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
            if room:
                room.updated_at = datetime.utcnow()
            new_db.commit()
    except Exception as ex:
        print(f"[Simulated persist error]: {ex}")

    yield "data: [DONE]\n\n"


# ── Agent loop: tool detection + execution ─────────────────────────────────────

async def run_agent_loop(messages_payload: list, room_id: str, current_user: User, db: Session, use_thinking: bool = True):
    """
    1. Detect if the user message requires a tool call (using fast TOOL_MODEL).
    2. Execute tool and inject result into history.
    3. Stream final answer from DiffusionGemma.
    """
    clean_history = sanitize_messages_payload(messages_payload)
    system_msg = _build_system_message(current_user)
    full_history = [system_msg] + clean_history

    # Detect last user message
    last_user_msg_raw = ""
    for msg in reversed(messages_payload):
        if msg.get("role") == "user":
            last_user_msg_raw = (msg.get("content") or "")
            break

    # ── Key fix: if the message has an attached file prefix, only scan the
    # actual user intent (after "User message:") — NOT the extracted file content.
    # This prevents words like "push", "send", "notification" inside image/PDF
    # descriptions from accidentally triggering tool calls.
    USER_MSG_MARKER = "User message:"
    if USER_MSG_MARKER in last_user_msg_raw:
        last_user_msg = last_user_msg_raw.split(USER_MSG_MARKER, 1)[1].strip().lower()
    else:
        last_user_msg = last_user_msg_raw.strip().lower()

    greetings = {"hi", "hello", "hey", "good morning", "good evening", "greetings", "hi there", "thanks", "thank you"}
    is_greeting = last_user_msg.strip() in greetings
    is_confirmation = last_user_msg.strip() in {"yes", "yes.", "yeah", "confirm", "send it", "go ahead", "ok", "okay"}

    # For teacher role users: ALWAYS run tool check on non-greetings so AI can control portal actions!
    if current_user.role == "teacher":
        needs_tool_check = not is_greeting
    else:
        tool_keywords = [
            "mark", "marks", "score", "scores", "grade", "grades", "exam", "exams",
            "roster", "student", "students", "leaderboard", "top", "performer",
            "rank", "ranking", "topper", "best", "highest", "average", "class",
            "result", "results", "who", "which", "list", "show",
            "notice", "publish", "announce", "timetable", "schedule", "slot",
            "note", "planner", "push", "notification", "send", "yes", "confirm",
        ]
        needs_tool_check = not is_greeting and any(kw in last_user_msg for kw in tool_keywords)

    # Inject drafted notice content when teacher confirms
    if is_confirmation:
        import re
        last_draft = ""
        for msg in reversed(clean_history):
            if msg.get("role") == "assistant" and "draft message" in msg.get("content", "").lower():
                last_draft = msg["content"]
                break
        if last_draft:
            match = re.search(
                r"Draft Message[:\*\s]+(.+?)(?:Shall I|$)", last_draft, re.DOTALL | re.IGNORECASE
            )
            if match:
                drafted_content = match.group(1).strip().strip("*").strip()
                full_history = [system_msg] + clean_history[:-1] + [
                    {"role": "user", "content": f"Yes, confirmed. Please send this exact message:\n\n{drafted_content}"}
                ]

    if needs_tool_check:
        tool_payload = {
            "model": TOOL_MODEL,
            "messages": full_history,
            "temperature": 0.3,
            "top_p": 1,
            "max_tokens": 1024,
            "tools": NVIDIA_TOOLS,
            "stream": False,
        }
        try:
            loop = asyncio.get_event_loop()
            tool_resp = await loop.run_in_executor(
                None,
                lambda: requests.post(
                    NVIDIA_BASE_URL,
                    headers=get_nvidia_headers(stream=False),
                    json=tool_payload,
                    timeout=20,
                ),
            )
            if tool_resp.status_code == 200:
                tool_data = tool_resp.json()
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
                            "content": t_result,
                        })
                        full_history.append({
                            "role": "user",
                            "content": f"[Tool Result]: Real performance data retrieved from database:\n\n{t_result}\n\nAnswer the user's question directly using this real database data."
                        })
        except Exception as err:
            print(f"[Agent Tool Error]: {err}")

    return StreamingResponse(
        response_stream_generator(full_history, room_id, use_thinking),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── AI title generation ────────────────────────────────────────────────────────

def generate_ai_chat_title(user_message: str) -> str:
    """Generate a short 3-6 word title using the fast model."""
    if not user_message or not user_message.strip():
        return "New AI Chat"
    clean_msg = user_message.strip()
    payload = {
        "model": TOOL_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You generate short 3-6 word titles for chat sessions based on the user's initial prompt. Output ONLY the title, no quotes, no period.",
            },
            {"role": "user", "content": f"Title for: {clean_msg[:150]}"},
        ],
        "max_tokens": 15,
        "temperature": 0.3,
        "stream": False,
    }
    try:
        resp = requests.post(
            NVIDIA_BASE_URL,
            headers=get_nvidia_headers(stream=False),
            json=payload,
            timeout=4,
        )
        if resp.status_code == 200:
            title = resp.json()["choices"][0]["message"]["content"].strip().strip('"').strip("'")
            if title and len(title) > 2:
                return title[:60]
    except Exception:
        pass
    words = clean_msg.split()
    return " ".join(words[:5]).capitalize()[:50]


# ── REST Endpoints ─────────────────────────────────────────────────────────────

@router.post("/api/chats")
async def start_chat(
    req: ChatInitRequest,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db),
):
    """
    Create a new chat room and start the first AI response stream.
    Auth: session cookie OR Authorization: Bearer <token>
    """
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
            updated_at=datetime.utcnow(),
        )
        db.add(room)
        db.commit()
        db.refresh(room)

    user_msg = ChatMessage(
        id=f"msg_user_{uuid.uuid4()}",
        room_id=room.id,
        role="user",
        content=req.message,
        created_at=datetime.utcnow(),
    )
    db.add(user_msg)
    db.commit()

    # Build NVIDIA payload — multimodal if image attached
    nvidia_payload = [{
        "role": "user",
        "content": build_user_content(req.message, req.attachment_data_url, req.attachment_mime)
    }]
    return await run_agent_loop(nvidia_payload, room.id, current_user, db, req.use_thinking)


@router.get("/api/chats")
def get_chats(
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db),
):
    """
    List all chat rooms for the current user.
    Auth: session cookie OR Authorization: Bearer <token>
    """
    rooms = (
        db.query(ChatRoom)
        .filter(ChatRoom.user_id == current_user.id)
        .order_by(ChatRoom.updated_at.desc())
        .all()
    )
    return [
        {"id": r.id, "title": r.title, "createdAt": r.created_at.isoformat() + "Z"}
        for r in rooms
    ]


@router.get("/api/chats/widget-status")
def check_widget_status(
    type: str,
    title: str = "",
    content: str = "",
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db),
):
    """
    Check if a tool action (notice or push notification) has been executed and saved.
    Must be registered BEFORE /api/chats/{uuid_val} to avoid route shadowing.
    """
    if type == "send_notice":
        query = db.query(Notice)
        if title.strip():
            query = query.filter(Notice.title.ilike(f"%{title.strip().replace('%', '')}%"))
        elif content.strip():
            query = query.filter(Notice.content.ilike(f"%{content.strip()[:40].replace('%', '')}%"))
        notice_obj = query.first()
        if notice_obj:
            return {"status": "success", "executed": True, "noticeId": notice_obj.id}
        return {"status": "pending", "executed": False}

    elif type == "send_push":
        from models import NotificationHistory
        query = db.query(NotificationHistory)
        if title.strip():
            query = query.filter(NotificationHistory.title.ilike(f"%{title.strip().replace('%', '')}%"))
        elif content.strip():
            query = query.filter(NotificationHistory.body.ilike(f"%{content.strip()[:40].replace('%', '')}%"))
        notif_obj = query.first()
        if notif_obj:
            return {"status": "success", "executed": True}
        return {"status": "pending", "executed": False}

    return {"status": "pending", "executed": False}


@router.get("/api/chats/{uuid_val}")
def get_chat_messages(
    uuid_val: str,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db),
):
    """
    Retrieve all messages for a given chat room.
    Auth: session cookie OR Authorization: Bearer <token>
    """
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid_val).first()
    if not room:
        return {
            "id": uuid_val,
            "exists": False,
            "title": "AI Chat Assistant",
            "messages": [
                {
                    "role": "assistant",
                    "content": "Hello! I am your VidyaSchool AI assistant. How can I help you today?",
                    "createdAt": datetime.utcnow().isoformat() + "Z",
                }
            ],
            "createdAt": datetime.utcnow().isoformat() + "Z",
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
            {"role": m.role, "content": m.content, "createdAt": m.created_at.isoformat() + "Z"}
            for m in messages
        ],
        "createdAt": room.created_at.isoformat() + "Z",
    }


@router.post("/api/chats/{uuid_val}")
async def send_chat_message(
    uuid_val: str,
    req: ChatMessageRequest,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db),
):
    """
    Send a message in an existing chat room and stream AI response.
    Auth: session cookie OR Authorization: Bearer <token>
    """
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid_val).first()

    if not room:
        ai_title = generate_ai_chat_title(req.message)
        room = ChatRoom(
            id=uuid_val,
            user_id=current_user.id,
            title=ai_title,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(room)
        db.commit()
        db.refresh(room)
    elif room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user_msg = ChatMessage(
        id=f"msg_user_{uuid.uuid4()}",
        room_id=room.id,
        role="user",
        content=req.message,
        created_at=datetime.utcnow(),
    )
    db.add(user_msg)

    if room.title in ["AI Chat Assistant", "AI Teaching Assistant", "New AI Chat", ""]:
        room.title = generate_ai_chat_title(req.message)

    db.commit()

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == uuid_val)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    # Build history as plain text; replace last user message with multimodal if image attached
    messages_payload = [{"role": m.role, "content": m.content} for m in history]
    if req.attachment_data_url and req.attachment_mime and messages_payload:
        # Find and replace the last user message with multimodal content
        for i in range(len(messages_payload) - 1, -1, -1):
            if messages_payload[i]["role"] == "user":
                messages_payload[i]["content"] = build_user_content(
                    req.message, req.attachment_data_url, req.attachment_mime
                )
                break

    return await run_agent_loop(messages_payload, room.id, current_user, db, req.use_thinking)


@router.delete("/api/chats/{uuid_val}")
def delete_chat(
    uuid_val: str,
    current_user: User = Depends(require_role(authorized_roles)),
    db: Session = Depends(get_db),
):
    """
    Delete a chat room and all its messages.
    Auth: session cookie OR Authorization: Bearer <token>
    """
    room = db.query(ChatRoom).filter(ChatRoom.id == uuid_val).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat not found")
    if room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this chat")

    db.query(ChatMessage).filter(ChatMessage.room_id == uuid_val).delete(synchronize_session=False)
    db.delete(room)
    db.commit()

    return {"success": True, "id": uuid_val}
