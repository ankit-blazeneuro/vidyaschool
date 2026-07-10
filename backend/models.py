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

class SliderImage(SQLModel, table=True):
    __tablename__ = "slider_image"
    id: int = Field(primary_key=True)
    url: str
    title: str
    enabled: bool = Field(default=True)
    target_audience: str = Field(default="all")  # "all", "students", "teachers"
    target_classes: str = Field(default="all")  # "all" or comma-separated class IDs: "1,2,3,4,5,6,7,8,9,10,11,12"
    order: int = Field(default=0)
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

class Complaint(SQLModel, table=True):
    __tablename__ = "complaint"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    title: str
    recipient: str
    tagged_people: Optional[str] = Field(default=None, alias="tagged_people")
    message: str
    file_url: Optional[str] = Field(default=None, alias="file_url")
    file_name: Optional[str] = Field(default=None, alias="file_name")
    status: str = Field(default="pending")
    sort_order: int = Field(default=0, alias="sort_order")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Notice(SQLModel, table=True):
    __tablename__ = "notice"
    id: str = Field(primary_key=True)
    title: str
    content: str
    category: str = Field(default="General")
    is_urgent: bool = Field(default=False, alias="is_urgent")
    sender_id: str = Field(alias="sender_id", foreign_key="user.id")
    target_role: str = Field(default="all", alias="target_role")
    target_class: Optional[str] = Field(default=None, alias="target_class")
    target_section: Optional[str] = Field(default=None, alias="target_section")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LibraryBook(SQLModel, table=True):
    __tablename__ = "library_book"
    id: str = Field(primary_key=True)
    title: str
    author: str
    isbn: str = Field(unique=True)
    category: str = Field(default="General")
    quantity: int = Field(default=1)
    available_quantity: int = Field(default=1, alias="available_quantity")
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LibraryBookIssue(SQLModel, table=True):
    __tablename__ = "library_book_issue"
    id: str = Field(primary_key=True)
    book_id: str = Field(alias="book_id", foreign_key="library_book.id")
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    issue_date: datetime = Field(default_factory=datetime.utcnow, alias="issue_date")
    due_date: datetime = Field(alias="due_date")
    return_date: Optional[datetime] = Field(default=None, alias="return_date")
    renewals_count: int = Field(default=0, alias="renewals_count")
    status: str = Field(default="active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FCMToken(SQLModel, table=True):
    __tablename__ = "fcm_token"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    token: str
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_at")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updated_at")

class NotificationHistory(SQLModel, table=True):
    __tablename__ = "notification_history"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    title: str
    body: str
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_at")


class FeeStructure(SQLModel, table=True):
    """Stores the per-class fee configuration (components JSON) for each class 1-12."""
    __tablename__ = "fee_structure"
    id: str = Field(primary_key=True)
    class_num: int = Field(alias="class_num")          # 1..12
    components: str = Field(default="[]")               # JSON array of {name, amount, billingPeriod}
    transport_fee: int = Field(default=0, alias="transport_fee")   # extra fee for transport users
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
