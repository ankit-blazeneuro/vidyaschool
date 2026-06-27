from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List, Dict, Any
import zlib

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from models import User, UserProfile, FeeInstallment, SubjectClassRequest, SubjectClassAssignment, Exam, StudentSubjectMarks

router = APIRouter(prefix="/teacher", tags=["teacher"])

@router.get("/class/students", response_model=Dict[str, Any])
def get_class_students(
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get teacher profile
    teacher_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not teacher_profile or not teacher_profile.class_ or teacher_profile.class_ == "none":
        return {
            "class": "Not Assigned",
            "section": "None",
            "students": []
        }
    
    # 2. Get students in the same class and section
    student_records = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        User.role == "student",
        UserProfile.class_ == teacher_profile.class_,
        UserProfile.section == teacher_profile.section
    ).all()
    
    # 3. Format students
    result = []
    for user_obj, profile in student_records:
        # Generate stable metrics based on user_obj.id to make it realistic
        id_hash = zlib.adler32(user_obj.id.encode('utf-8'))
        
        # Attendance between 75% and 100%
        attendance_val = 75.0 + (id_hash % 250) / 10.0
        attendance = f"{attendance_val:.1f}%"
        
        # GPA between 5.0 and 10.0
        gpa = round(5.0 + (id_hash % 50) / 10.0, 1)
        
        # Performance and Status based on GPA
        if gpa >= 9.0:
            status = "Excellent"
            performance = "improving"
        elif gpa >= 7.0:
            status = "Good"
            performance = "stable"
        else:
            status = "Needs Attention"
            performance = "declining"
            
        result.append({
            "id": profile.admission_number or f"STU-{user_obj.id[:8]}",
            "userId": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
            "image": user_obj.image,
            "attendance": attendance,
            "gpa": gpa,
            "performance": performance,
            "status": status
        })
        
    return {
        "class": teacher_profile.class_,
        "section": teacher_profile.section or "None",
        "students": result
    }

@router.get("/student/{user_id}/details", response_model=Dict[str, Any])
def get_student_details(
    user_id: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get student user record
    student = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # 2. Get student profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    # 3. Get student fees
    fees_records = db.query(FeeInstallment).filter(FeeInstallment.user_id == user_id).all()
    
    # Generate stable mock marks based on student user_id
    id_hash = zlib.adler32(user_id.encode('utf-8'))
    math_score = 70 + (id_hash % 26)
    phy_score = 65 + ((id_hash + 5) % 31)
    chm_score = 72 + ((id_hash + 10) % 24)
    eng_score = 68 + ((id_hash + 15) % 28)
    cse_score = 80 + ((id_hash + 20) % 21)
    
    marks_data = {
        "term-1": {
            "termName": "Mid-Term Examination (Term 1)",
            "rank": f"{3 + (id_hash % 8)}th / 40",
            "gpa": f"{round((math_score + phy_score + chm_score + eng_score + cse_score) / 50, 1)} / 10",
            "subjects": [
                {"code": "MAT-101", "subject": "Mathematics", "score": math_score, "maxScore": 100, "grade": "A" if math_score >= 90 else ("B" if math_score >= 80 else "C")},
                {"code": "PHY-101", "subject": "Physics", "score": phy_score, "maxScore": 100, "grade": "A" if phy_score >= 90 else ("B" if phy_score >= 80 else "C")},
                {"code": "CHM-101", "subject": "Chemistry", "score": chm_score, "maxScore": 100, "grade": "A" if chm_score >= 90 else ("B" if chm_score >= 80 else "C")},
                {"code": "ENG-101", "subject": "English Literature", "score": eng_score, "maxScore": 100, "grade": "A" if eng_score >= 90 else ("B" if eng_score >= 80 else "C")},
                {"code": "CSE-101", "subject": "Computer Programming", "score": cse_score, "maxScore": 100, "grade": "A" if cse_score >= 90 else ("B" if cse_score >= 80 else "C")},
            ]
        },
        "term-2": {
            "termName": "Final Examination (Term 2)",
            "rank": f"{2 + (id_hash % 6)}rd / 40",
            "gpa": f"{round((math_score + phy_score + chm_score + eng_score + cse_score + 10) / 50, 1)} / 10",
            "subjects": [
                {"code": "MAT-101", "subject": "Mathematics", "score": min(100, math_score + 3), "maxScore": 100, "grade": "A" if (math_score + 3) >= 90 else ("B" if (math_score + 3) >= 80 else "C")},
                {"code": "PHY-101", "subject": "Physics", "score": min(100, phy_score + 4), "maxScore": 100, "grade": "A" if (phy_score + 4) >= 90 else ("B" if (phy_score + 4) >= 80 else "C")},
                {"code": "CHM-101", "subject": "Chemistry", "score": min(100, chm_score + 2), "maxScore": 100, "grade": "A" if (chm_score + 2) >= 90 else ("B" if (chm_score + 2) >= 80 else "C")},
                {"code": "ENG-101", "subject": "English Literature", "score": min(100, eng_score + 1), "maxScore": 100, "grade": "A" if (eng_score + 1) >= 90 else ("B" if (eng_score + 1) >= 80 else "C")},
                {"code": "CSE-101", "subject": "Computer Programming", "score": min(100, cse_score + 2), "maxScore": 100, "grade": "A" if (cse_score + 2) >= 90 else ("B" if (cse_score + 2) >= 80 else "C")},
            ]
        }
    }
    
    # Format profile details safely
    details = {
        "userId": student.id,
        "name": student.name,
        "email": student.email,
        "image": student.image,
        "admissionNumber": profile.admission_number if profile else None,
        "phoneNumber": profile.phone_number if profile else None,
        "parentName": profile.parent_name if profile else None,
        "parentPhone": profile.parent_phone if profile else None,
        "parentEmail": profile.parent_email if profile else None,
        "address": profile.address if profile else None,
        "city": profile.city if profile else None,
        "state": profile.state if profile else None,
        "pincode": profile.pincode if profile else None,
        "class": profile.class_ if profile else None,
        "section": profile.section if profile else None,
    }
    
    formatted_fees = []
    for fee in fees_records:
        formatted_fees.append({
            "id": fee.id,
            "month": fee.month,
            "year": fee.year,
            "amount": fee.amount,
            "dueDate": fee.due_date.isoformat() if fee.due_date else None,
            "status": fee.status,
            "paidDate": fee.paid_date.isoformat() if fee.paid_date else None,
            "receiptNo": fee.receipt_no,
            "paymentMethod": fee.payment_method
        })
        
    # Query real exams and marks for the student
    student_exams = []
    student_exam_scores = {}
    if profile and profile.class_ and profile.section:
        exams = db.query(Exam).filter(
            Exam.class_ == profile.class_,
            Exam.section == profile.section
        ).all()
        student_exams = [
            {
                "id": e.id,
                "name": e.name,
                "createdAt": e.created_at.isoformat()
            } for e in exams
        ]
        exam_ids = [e.id for e in exams]
        if exam_ids:
            real_marks = db.query(StudentSubjectMarks).filter(
                StudentSubjectMarks.student_id == user_id,
                StudentSubjectMarks.exam_id.in_(exam_ids)
            ).all()
            for m in real_marks:
                if m.exam_id not in student_exam_scores:
                    student_exam_scores[m.exam_id] = {}
                student_exam_scores[m.exam_id][m.subject] = m.score

    return {
        "details": details,
        "marks": marks_data,
        "fees": formatted_fees,
        "exams": student_exams,
        "examScores": student_exam_scores
    }

import uuid
from pydantic import BaseModel, Field
from datetime import datetime

class SubjectRequestCreate(BaseModel):
    class_: str = Field(alias="class")
    section: str
    subject: str

    class Config:
        populate_by_name = True

@router.get("/subjects", response_model=Dict[str, Any])
def get_teacher_subjects(
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get assignments
    assignments = db.query(SubjectClassAssignment).filter(
        SubjectClassAssignment.teacher_id == current_user.id
    ).all()
    
    # 2. Get requests
    requests = db.query(SubjectClassRequest).filter(
        SubjectClassRequest.teacher_id == current_user.id
    ).all()
    
    # Check if this teacher is also a class teacher
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    is_class_teacher = profile.class_ is not None and profile.class_ != "none" if profile else False
    class_name = profile.class_ if is_class_teacher else None
    section_name = profile.section if is_class_teacher else None

    return {
        "assignments": [
            {
                "id": a.id,
                "class": a.class_,
                "section": a.section,
                "subject": a.subject,
                "createdAt": a.created_at.isoformat()
            } for a in assignments
        ],
        "requests": [
            {
                "id": r.id,
                "class": r.class_,
                "section": r.section,
                "subject": r.subject,
                "status": r.status,
                "createdAt": r.created_at.isoformat()
            } for r in requests
        ],
        "isClassTeacher": is_class_teacher,
        "class": class_name,
        "section": section_name
    }

@router.post("/subjects/request", response_model=Dict[str, Any])
def create_subject_request(
    payload: SubjectRequestCreate,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # Check if there is already an active assignment or pending request for the same class, section, subject
    existing_request = db.query(SubjectClassRequest).filter(
        SubjectClassRequest.teacher_id == current_user.id,
        SubjectClassRequest.class_ == payload.class_,
        SubjectClassRequest.section == payload.section,
        SubjectClassRequest.subject == payload.subject,
        SubjectClassRequest.status == "pending"
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request for this subject-class.")
        
    existing_assignment = db.query(SubjectClassAssignment).filter(
        SubjectClassAssignment.teacher_id == current_user.id,
        SubjectClassAssignment.class_ == payload.class_,
        SubjectClassAssignment.section == payload.section,
        SubjectClassAssignment.subject == payload.subject
    ).first()
    
    if existing_assignment:
        raise HTTPException(status_code=400, detail="You are already assigned to teach this subject-class.")

    new_request = SubjectClassRequest(
        id=f"req_{uuid.uuid4().hex[:8]}",
        teacher_id=current_user.id,
        class_=payload.class_,
        section=payload.section,
        subject=payload.subject,
        status="pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return {"status": "success", "id": new_request.id}

@router.get("/requests/pending", response_model=List[Dict[str, Any]])
def get_pending_class_requests(
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get current teacher's profile to find their class and section
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or not profile.class_ or profile.class_ == "none":
        # Not a class teacher, return empty list
        return []
        
    # 2. Get pending requests for this class and section
    requests = db.query(SubjectClassRequest, User).join(
        User, SubjectClassRequest.teacher_id == User.id
    ).filter(
        SubjectClassRequest.class_ == profile.class_,
        SubjectClassRequest.section == profile.section,
        SubjectClassRequest.status == "pending"
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

@router.post("/requests/{request_id}/approve", response_model=Dict[str, Any])
def approve_subject_request(
    request_id: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get the request
    req = db.query(SubjectClassRequest).filter(SubjectClassRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is already resolved")
        
    # 2. Verify current user is class teacher of req.class_ / req.section
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or (profile.class_ != req.class_ or profile.section != req.section):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only the class teacher of this class can approve requests.")
            
    # Approve request
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

@router.post("/requests/{request_id}/reject", response_model=Dict[str, Any])
def reject_subject_request(
    request_id: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get the request
    req = db.query(SubjectClassRequest).filter(SubjectClassRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is already resolved")
        
    # 2. Verify current user is class teacher of req.class_ / req.section
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or (profile.class_ != req.class_ or profile.section != req.section):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only the class teacher of this class can reject requests.")
            
    # Reject request
    req.status = "rejected"
    req.updated_at = datetime.utcnow()
    db.add(req)
    db.commit()
    return {"status": "success"}

@router.get("/subjects/students", response_model=Dict[str, Any])
def get_subject_class_students(
    class_name: str,
    section_name: str,
    subject_name: str = None,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Access verification: check if teacher is assigned to this class/section OR is class teacher of it OR is admin
    is_assigned = db.query(SubjectClassAssignment).filter(
        SubjectClassAssignment.teacher_id == current_user.id,
        SubjectClassAssignment.class_ == class_name,
        SubjectClassAssignment.section == section_name
    ).first() is not None

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    is_class_teacher = profile and profile.class_ == class_name and profile.section == section_name

    if not is_assigned and not is_class_teacher and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view the student list for this class-section."
        )

    # 2. Get students in the specified class and section
    student_records = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        User.role == "student",
        UserProfile.class_ == class_name,
        UserProfile.section == section_name
    ).all()
    
    # 3. Get all exams for this class and section
    exams = db.query(Exam).filter(
        Exam.class_ == class_name,
        Exam.section == section_name
    ).order_by(Exam.created_at.desc()).all()
    exam_ids = [e.id for e in exams]

    # 4. Get all marks for these exams and this subject
    marks_records = []
    if exam_ids and subject_name:
        marks_records = db.query(StudentSubjectMarks).filter(
            StudentSubjectMarks.exam_id.in_(exam_ids),
            StudentSubjectMarks.subject == subject_name
        ).all()

    # Organize marks by student_id and exam_id
    marks_map = {}
    for m in marks_records:
        if m.student_id not in marks_map:
            marks_map[m.student_id] = {}
        marks_map[m.student_id][m.exam_id] = m.score

    # 5. Format student records
    result = []
    for user_obj, prof in student_records:
        student_id = user_obj.id
        student_exam_scores = {}
        for exam_id in exam_ids:
            student_exam_scores[exam_id] = marks_map.get(student_id, {}).get(exam_id, None)

        result.append({
            "id": prof.admission_number or f"STU-{user_obj.id[:8]}",
            "userId": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
            "image": user_obj.image,
            "examScores": student_exam_scores
        })
        
    return {
        "class": class_name,
        "section": section_name,
        "students": result
    }

class ExamCreate(BaseModel):
    name: str
    class_name: str = Field(alias="class_name")
    section_name: str = Field(alias="section_name")

    class Config:
        populate_by_name = True

class MarksSave(BaseModel):
    exam_id: str
    subject: str
    scores: Dict[str, float]  # mapping from student_user_id to score

@router.get("/exams", response_model=List[Dict[str, Any]])
def get_exams(
    class_name: str,
    section_name: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    exams = db.query(Exam).filter(
        Exam.class_ == class_name,
        Exam.section == section_name
    ).order_by(Exam.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "class": e.class_,
            "section": e.section,
            "createdAt": e.created_at.isoformat()
        } for e in exams
    ]

@router.post("/exams", response_model=Dict[str, Any])
def create_exam(
    payload: ExamCreate,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # Check if this exam name already exists for this class/section
    existing = db.query(Exam).filter(
        Exam.class_ == payload.class_name,
        Exam.section == payload.section_name,
        Exam.name == payload.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="An exam with this name already exists for this class and section.")

    new_exam = Exam(
        id=f"exm_{uuid.uuid4().hex[:8]}",
        name=payload.name,
        class_=payload.class_name,
        section=payload.section_name
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return {
        "status": "success",
        "id": new_exam.id,
        "name": new_exam.name
    }

@router.get("/marks", response_model=Dict[str, Any])
def get_marks(
    exam_id: str,
    subject: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get the exam
    exam_obj = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam_obj:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # 2. Get students in this class and section
    student_records = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        User.role == "student",
        UserProfile.class_ == exam_obj.class_,
        UserProfile.section == exam_obj.section
    ).all()
    
    # 3. Get existing marks
    existing_marks = db.query(StudentSubjectMarks).filter(
        StudentSubjectMarks.exam_id == exam_id,
        StudentSubjectMarks.subject == subject
    ).all()
    marks_map = {m.student_id: m.score for m in existing_marks}
    
    # 4. Format students with their scores
    students_list = []
    for user_obj, prof in student_records:
        score = marks_map.get(user_obj.id, None)
        students_list.append({
            "id": prof.admission_number or f"STU-{user_obj.id[:8]}",
            "userId": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
            "score": score
        })
        
    return {
        "examId": exam_obj.id,
        "examName": exam_obj.name,
        "class": exam_obj.class_,
        "section": exam_obj.section,
        "subject": subject,
        "students": students_list
    }

@router.post("/marks", response_model=Dict[str, Any])
def save_marks(
    payload: MarksSave,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    exam_obj = db.query(Exam).filter(Exam.id == payload.exam_id).first()
    if not exam_obj:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # For each student score, upsert
    for student_user_id, score in payload.scores.items():
        # Check if record exists
        record = db.query(StudentSubjectMarks).filter(
            StudentSubjectMarks.exam_id == payload.exam_id,
            StudentSubjectMarks.student_id == student_user_id,
            StudentSubjectMarks.subject == payload.subject
        ).first()
        
        if record:
            record.score = score
            record.updated_at = datetime.utcnow()
            db.add(record)
        else:
            new_record = StudentSubjectMarks(
                id=f"mrk_{uuid.uuid4().hex[:8]}",
                student_id=student_user_id,
                exam_id=payload.exam_id,
                subject=payload.subject,
                score=score
            )
            db.add(new_record)
            
    db.commit()
    return {"status": "success"}
