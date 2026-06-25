from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__ = "user"
    id: str = Field(primary_key=True)
    name: str
    email: str
    role: str = Field(default="student")
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
