from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__ = "user"
    id: str = Field(primary_key=True)
    name: str
    email: str
    role: str = Field(default="student")
    preferred_role: Optional[str] = Field(default=None, alias="preferredRole")
    teacher_approval_status: Optional[str] = Field(default="pending", alias="teacherApprovalStatus")
    email_verified: bool = Field(default=False, alias="emailVerified")
    image: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

class Session(SQLModel, table=True):
    __tablename__ = "session"
    id: str = Field(primary_key=True)
    expires_at: datetime = Field(alias="expires_at")
    token: str
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    ip_address: Optional[str] = Field(default=None, alias="ip_address")
    user_agent: Optional[str] = Field(default=None, alias="user_agent")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profile"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    admission_number: Optional[str] = Field(default=None, alias="admission_number")
    username: Optional[str] = None
    phone_number: Optional[str] = Field(default=None, alias="phone_number")
    parent_name: Optional[str] = Field(default=None, alias="parent_name")
    parent_phone: Optional[str] = Field(default=None, alias="parent_phone")
    parent_email: Optional[str] = Field(default=None, alias="parent_email")
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    class_: Optional[str] = Field(default=None, alias="class", sa_column_kwargs={"name": "class"})
    section: Optional[str] = None
    class_section_last_updated: Optional[datetime] = Field(default=None, alias="class_section_last_updated")
    class_section_changes: Optional[str] = Field(default=None, alias="class_section_changes")
    secondary_role: Optional[str] = Field(default=None, alias="secondary_role")
    transport_mode: Optional[str] = Field(default=None, alias="transport_mode")
    onboarding_completed: bool = Field(default=False, alias="onboarding_completed")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FeeInstallment(SQLModel, table=True):
    __tablename__ = "fee_installment"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    month: str
    year: str
    amount: int
    due_date: date = Field(alias="due_date")
    status: str  # 'paid', 'pending', 'overdue', 'upcoming'
    paid_date: Optional[date] = Field(default=None, alias="paid_date")
    receipt_no: Optional[str] = Field(default=None, alias="receipt_no")
    payment_method: Optional[str] = Field(default=None, alias="payment_method")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubjectClassRequest(SQLModel, table=True):
    __tablename__ = "subject_class_request"
    id: str = Field(primary_key=True)
    teacher_id: str = Field(alias="teacher_id", foreign_key="user.id")
    class_: str = Field(alias="class", sa_column_kwargs={"name": "class"})
    section: str
    subject: str
    status: str = Field(default="pending")  # 'pending', 'approved', 'rejected'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubjectClassAssignment(SQLModel, table=True):
    __tablename__ = "subject_class_assignment"
    id: str = Field(primary_key=True)
    teacher_id: str = Field(alias="teacher_id", foreign_key="user.id")
    class_: str = Field(alias="class", sa_column_kwargs={"name": "class"})
    section: str
    subject: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Exam(SQLModel, table=True):
    __tablename__ = "exam"
    id: str = Field(primary_key=True)
    name: str
    class_: str = Field(alias="class", sa_column_kwargs={"name": "class"})
    section: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StudentSubjectMarks(SQLModel, table=True):
    __tablename__ = "student_subject_marks"
    id: str = Field(primary_key=True)
    student_id: str = Field(alias="student_id", foreign_key="user.id")
    exam_id: str = Field(alias="exam_id", foreign_key="exam.id")
    subject: str
    score: float
    max_score: float = Field(default=100.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CommunityMessage(SQLModel, table=True):
    __tablename__ = "community_message"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="userId", foreign_key="user.id")
    content: str
    reply_to: Optional[str] = Field(default=None, alias="replyTo")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

class TeacherRequest(SQLModel, table=True):
    __tablename__ = "teacher_request"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    status: str = Field(default="pending")
    admin_id: Optional[str] = Field(default=None, alias="admin_id", foreign_key="user.id")
    rejection_reason: Optional[str] = Field(default=None, alias="rejection_reason")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


