import os
import uuid
from datetime import datetime, date
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import SQLModel, Session, create_engine
from models import User, Session as SessionModel, UserProfile, FeeInstallment
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

# Load database URL and adjust for SQLAlchemy PostgreSQL driver
db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(db_url or "")

app = FastAPI(title="VidyaSchool Fees Backend API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # This automatically creates the new fee_installment table if it doesn't exist
    SQLModel.metadata.create_all(engine)

# Database Session Dependency
def get_db():
    with Session(engine) as session:
        yield session

# User Verification Dependency from Session Cookie or Authorization Header
def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("better-auth.session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized: No session token found")
        
    db_session = db.query(SessionModel).filter(SessionModel.token == token).first()
    if not db_session:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid session")
        
    # Check expiry (naive compare)
    if db_session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Unauthorized: Session expired")
        
    db_user = db.query(User).filter(User.id == db_session.user_id).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not found")
        
    return db_user

def require_role(allowed_roles: List[str]):
    def dependency(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden: Access denied")
        return user
    return dependency

# Pydantic Schemas
class PayFeesRequest(BaseModel):
    installment_ids: List[str]
    payment_method: str

class CreateFeeRequest(BaseModel):
    student_id: Optional[str] = None
    student_class: Optional[str] = None
    student_section: Optional[str] = None
    month: str
    year: str
    amount: int
    due_date: str  # YYYY-MM-DD

class UpdateFeeStatusRequest(BaseModel):
    status: str
    paid_date: Optional[str] = None  # YYYY-MM-DD
    receipt_no: Optional[str] = None
    payment_method: Optional[str] = None
    amount: Optional[int] = None

# --- Student Routes ---

@app.get("/api/fees")
def get_my_fees(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    installments = db.query(FeeInstallment).filter(FeeInstallment.user_id == user.id).order_by(FeeInstallment.due_date).all()
    return installments

@app.post("/api/fees/pay")
def pay_fees(req: PayFeesRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    installments = db.query(FeeInstallment).filter(
        FeeInstallment.id.in_(req.installment_ids),
        FeeInstallment.user_id == user.id
    ).all()
    
    if not installments:
        raise HTTPException(status_code=404, detail="Installments not found")
        
    receipt_no = f"REC-2026-{uuid.uuid4().hex[:6].upper()}"
    paid_date = datetime.utcnow().date()
    
    for inst in installments:
        if inst.status == "paid":
            continue
        inst.status = "paid"
        inst.paid_date = paid_date
        inst.receipt_no = receipt_no
        inst.payment_method = req.payment_method
        inst.updated_at = datetime.utcnow()
        db.add(inst)
        
    db.commit()
    return {"success": True, "receipt_no": receipt_no, "paid_date": paid_date}

# --- Admin Routes ---

@app.get("/api/admin/students")
def list_students(admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    # Join User and UserProfile to get all student details
    results = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(User.role == "student").all()
    
    students = []
    for u, p in results:
        dues_count = db.query(FeeInstallment).filter(
            FeeInstallment.user_id == u.id,
            FeeInstallment.status.in_(["pending", "overdue"])
        ).count()
        
        students.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "username": p.username,
            "class": p.class_,
            "section": p.section,
            "admission_number": p.admission_number,
            "outstanding_dues_count": dues_count
        })
        
    return students

@app.get("/api/admin/fees/{student_id}")
def get_student_fees(student_id: str, admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    installments = db.query(FeeInstallment).filter(FeeInstallment.user_id == student_id).order_by(FeeInstallment.due_date).all()
    return installments

@app.post("/api/admin/fees")
def create_fee_installment(req: CreateFeeRequest, admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    try:
        due_date_parsed = datetime.strptime(req.due_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, must be YYYY-MM-DD")
        
    target_user_ids = []
    if req.student_id:
        target_user_ids = [req.student_id]
    else:
        query = db.query(UserProfile.user_id)
        if req.student_class:
            query = query.filter(UserProfile.class_ == req.student_class)
        if req.student_section:
            query = query.filter(UserProfile.section == req.student_section)
        target_user_ids = [row[0] for row in query.all()]
        
    if not target_user_ids:
        raise HTTPException(status_code=400, detail="No matching students found")
        
    created_count = 0
    for user_id in target_user_ids:
        existing = db.query(FeeInstallment).filter(
            FeeInstallment.user_id == user_id,
            FeeInstallment.month == req.month,
            FeeInstallment.year == req.year
        ).first()
        
        if existing:
            continue
            
        new_inst = FeeInstallment(
            id=str(uuid.uuid4()),
            user_id=user_id,
            month=req.month,
            year=req.year,
            amount=req.amount,
            due_date=due_date_parsed,
            status="pending"
        )
        db.add(new_inst)
        created_count += 1
        
    db.commit()
    return {"success": True, "created_count": created_count}

@app.patch("/api/admin/fees/{installment_id}")
def update_fee_installment(installment_id: str, req: UpdateFeeStatusRequest, admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    inst = db.query(FeeInstallment).filter(FeeInstallment.id == installment_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Installment not found")
        
    if req.status:
        inst.status = req.status
    if req.amount is not None:
        inst.amount = req.amount
        
    if req.status == "paid":
        try:
            inst.paid_date = datetime.strptime(req.paid_date, "%Y-%m-%d").date() if req.paid_date else datetime.utcnow().date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid paid_date format, must be YYYY-MM-DD")
        inst.receipt_no = req.receipt_no or f"REC-MANUAL-{uuid.uuid4().hex[:6].upper()}"
        inst.payment_method = req.payment_method or "Cash/Admin Manual"
    elif req.status in ["pending", "overdue", "upcoming"]:
        inst.paid_date = None
        inst.receipt_no = None
        inst.payment_method = None
        
    inst.updated_at = datetime.utcnow()
    db.add(inst)
    db.commit()
    return {"success": True}
