import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.core.fees import build_default_fee_installments
from app.core.schemas import PayFeesRequest
from models import FeeInstallment, User, UserProfile

router = APIRouter()


@router.get("/api/fees")
def get_my_fees(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    installments = db.query(FeeInstallment).filter(FeeInstallment.user_id == user.id).order_by(FeeInstallment.due_date).all()
    if not installments:
        default_installments = build_default_fee_installments(user.id, academic_year="25-26")
        db.add_all(default_installments)
        db.commit()
        return default_installments
    return installments


@router.post("/api/fees/pay")
def pay_fees(req: PayFeesRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    installment_ids = req.installment_ids
    installments = db.query(FeeInstallment).filter(
        FeeInstallment.id.in_(installment_ids),
        FeeInstallment.user_id == user.id,
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


@router.get("/api/admin/students")
def list_students(admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    results = db.query(User, UserProfile).join(UserProfile, User.id == UserProfile.user_id).filter(User.role == "student").all()
    students = []
    for u, p in results:
        dues_count = db.query(FeeInstallment).filter(
            FeeInstallment.user_id == u.id,
            FeeInstallment.status.in_(["pending", "overdue"]),
        ).count()

        students.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "username": p.username,
            "class": p.class_,
            "section": p.section,
            "admission_number": p.admission_number,
            "outstanding_dues_count": dues_count,
        })

    return students


@router.get("/api/admin/fees/{student_id}")
def get_student_fees(student_id: str, admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    installments = db.query(FeeInstallment).filter(FeeInstallment.user_id == student_id).order_by(FeeInstallment.due_date).all()
    return installments
