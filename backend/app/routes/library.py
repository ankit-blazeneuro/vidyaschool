import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select, or_
from typing import Optional, List, Dict, Any

from app.core.auth import require_role, get_current_user
from app.core.database import get_db
from models import User, UserProfile, LibraryBook, LibraryBookIssue

router = APIRouter(prefix="/api", tags=["library"])

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    category: str = "General"
    quantity: int = 1
    location: Optional[str] = None

class BookUpdate(BaseModel):
    id: str
    title: str
    author: str
    isbn: str
    category: str
    quantity: int
    location: Optional[str] = None

class BookDelete(BaseModel):
    id: str

class IssueCreate(BaseModel):
    studentIdentifier: str
    bookId: str
    dueDate: str

class BorrowingAction(BaseModel):
    id: str
    action: str  # 'return' or 'renew'

class StudentRenewRequest(BaseModel):
    id: str

@router.get("/librarian/books")
async def get_books(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stmt = select(LibraryBook)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                LibraryBook.title.like(search_filter),
                LibraryBook.author.like(search_filter),
                LibraryBook.isbn.like(search_filter),
                LibraryBook.category.like(search_filter)
            )
        )
    books = db.exec(stmt).all()
    return books

@router.post("/librarian/books")
async def add_book(
    book_data: BookCreate,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    existing = db.exec(select(LibraryBook).where(LibraryBook.isbn == book_data.isbn)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Book with this ISBN already exists")

    book_id = f"bk-{uuid.uuid4()}"
    new_book = LibraryBook(
        id=book_id,
        title=book_data.title,
        author=book_data.author,
        isbn=book_data.isbn,
        category=book_data.category,
        quantity=book_data.quantity,
        available_quantity=book_data.quantity,
        location=book_data.location,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_book)
    db.commit()
    return {"success": True, "id": book_id}

@router.patch("/librarian/books")
async def update_book(
    book_data: BookUpdate,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    book = db.get(LibraryBook, book_data.id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if book_data.isbn != book.isbn:
        existing = db.exec(select(LibraryBook).where(LibraryBook.isbn == book_data.isbn)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Another book with this ISBN already exists")

    diff = book_data.quantity - book.quantity
    new_available = max(0, book.available_quantity + diff)

    book.title = book_data.title
    book.author = book_data.author
    book.isbn = book_data.isbn
    book.category = book_data.category
    book.quantity = book_data.quantity
    book.available_quantity = new_available
    book.location = book_data.location
    book.updated_at = datetime.utcnow()

    db.add(book)
    db.commit()
    return {"success": True}

@router.delete("/librarian/books")
async def delete_book(
    del_data: BookDelete,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    book = db.get(LibraryBook, del_data.id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    db.delete(book)
    db.commit()
    return {"success": True}

@router.get("/librarian/borrowings")
async def get_borrowings(
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    results = db.query(
        LibraryBookIssue, LibraryBook, User, UserProfile
    ).join(
        LibraryBook, LibraryBookIssue.book_id == LibraryBook.id
    ).join(
        User, LibraryBookIssue.user_id == User.id
    ).outerjoin(
        UserProfile, User.id == UserProfile.user_id
    ).order_by(LibraryBookIssue.created_at.desc()).all()

    borrowings = []
    for issue, book, user_obj, profile in results:
        status = issue.status
        if status == "active" and issue.due_date < datetime.utcnow():
            status = "overdue"
        borrowings.append({
            "id": issue.id,
            "bookId": issue.book_id,
            "userId": issue.user_id,
            "issueDate": issue.issue_date.isoformat(),
            "dueDate": issue.due_date.isoformat(),
            "returnDate": issue.return_date.isoformat() if issue.return_date else None,
            "renewalsCount": issue.renewals_count,
            "status": status,
            "bookTitle": book.title,
            "bookAuthor": book.author,
            "bookIsbn": book.isbn,
            "studentName": user_obj.name,
            "studentEmail": user_obj.email,
            "studentUsername": profile.username if profile else None,
            "studentClass": profile.class_ if profile else None,
            "studentSection": profile.section if profile else None,
        })
    return borrowings

@router.post("/librarian/borrowings")
async def issue_book(
    issue_data: IssueCreate,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    stmt = select(User).outerjoin(UserProfile, User.id == UserProfile.user_id).where(
        or_(
            User.email == issue_data.studentIdentifier,
            UserProfile.username == issue_data.studentIdentifier
        )
    )
    student = db.exec(stmt).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student not found in system. Please verify username/email.")

    book = db.get(LibraryBook, issue_data.bookId)
    if not book:
        raise HTTPException(status_code=400, detail="Book not found")
    
    if book.available_quantity <= 0:
        raise HTTPException(status_code=400, detail="Book is currently out of stock (no copies available)")

    issue_id = f"iss-{uuid.uuid4()}"
    try:
        due_dt = datetime.fromisoformat(issue_data.dueDate.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        due_dt = datetime.utcnow() + timedelta(days=14)

    new_issue = LibraryBookIssue(
        id=issue_id,
        book_id=issue_data.bookId,
        user_id=student.id,
        issue_date=datetime.utcnow(),
        due_date=due_dt,
        renewals_count=0,
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_issue)

    book.available_quantity -= 1
    db.add(book)

    db.commit()
    return {"success": True, "id": issue_id}

@router.patch("/librarian/borrowings")
async def handle_borrowing_action(
    data: BorrowingAction,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    issue = db.get(LibraryBookIssue, data.id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")

    book = db.get(LibraryBook, issue.book_id)

    if data.action == "return":
        if issue.status == "returned":
            raise HTTPException(status_code=400, detail="Book is already returned")
        
        issue.status = "returned"
        issue.return_date = datetime.utcnow()
        issue.updated_at = datetime.utcnow()
        db.add(issue)

        if book:
            book.available_quantity = min(book.quantity, book.available_quantity + 1)
            book.updated_at = datetime.utcnow()
            db.add(book)

        db.commit()
        return {"success": True}

    elif data.action == "renew":
        if issue.status == "returned":
            raise HTTPException(status_code=400, detail="Cannot renew a returned book")
        if issue.renewals_count >= 3:
            raise HTTPException(status_code=400, detail="Maximum renewals limit reached (3 times)")

        issue.due_date = issue.due_date + timedelta(days=14)
        issue.renewals_count += 1
        issue.status = "active"
        issue.updated_at = datetime.utcnow()
        db.add(issue)
        db.commit()
        return {"success": True}
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'return' or 'renew'")

@router.get("/librarian/resolve-user")
async def resolve_user(
    q: str = "",
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    if not q.strip():
        return {"found": False}

    stmt = db.query(User, UserProfile).outerjoin(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        or_(
            User.email == q.strip(),
            UserProfile.username == q.strip()
        )
    ).first()

    if stmt:
        user_obj, profile = stmt
        return {
            "found": True,
            "user": {
                "id": user_obj.id,
                "name": user_obj.name,
                "email": user_obj.email,
                "role": user_obj.role,
                "username": profile.username if profile else None
            }
        }
    return {"found": False}

@router.get("/student/borrowings")
async def get_student_borrowings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = db.query(LibraryBookIssue, LibraryBook).join(
        LibraryBook, LibraryBookIssue.book_id == LibraryBook.id
    ).filter(
        LibraryBookIssue.user_id == current_user.id
    ).order_by(LibraryBookIssue.created_at.desc()).all()

    issues = []
    for issue, book in results:
        status = issue.status
        if status == "active" and issue.due_date < datetime.utcnow():
            status = "overdue"
        issues.append({
            "id": issue.id,
            "bookId": issue.book_id,
            "issueDate": issue.issue_date.isoformat(),
            "dueDate": issue.due_date.isoformat(),
            "returnDate": issue.return_date.isoformat() if issue.return_date else None,
            "renewalsCount": issue.renewals_count,
            "status": status,
            "title": book.title,
            "author": book.author,
            "isbn": book.isbn,
        })
    return issues

@router.patch("/student/borrowings")
async def student_renew_book(
    req_data: StudentRenewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    issue = db.exec(
        select(LibraryBookIssue)
        .where(LibraryBookIssue.id == req_data.id)
        .where(LibraryBookIssue.user_id == current_user.id)
    ).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")

    if issue.status == "returned":
        raise HTTPException(status_code=400, detail="Cannot renew a returned book")
    if issue.renewals_count >= 3:
        raise HTTPException(status_code=400, detail="Maximum renewals limit reached (3 times)")

    issue.due_date = issue.due_date + timedelta(days=14)
    issue.renewals_count += 1
    issue.status = "active"
    issue.updated_at = datetime.utcnow()

    db.add(issue)
    db.commit()
    return {"success": True}

from pydantic import Field

class ProfileResponse(BaseModel):
    user: Dict[str, Any]
    profile: Optional[Dict[str, Any]] = None

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "image": current_user.image
    }
    
    profile_data = None
    if profile:
        profile_data = {
            "id": profile.id,
            "user_id": profile.user_id,
            "admissionNumber": profile.admission_number,
            "username": profile.username,
            "phoneNumber": profile.phone_number,
            "parentName": profile.parent_name,
            "parentPhone": profile.parent_phone,
            "parentEmail": profile.parent_email,
            "address": profile.address,
            "city": profile.city,
            "state": profile.state,
            "pincode": profile.pincode,
            "class": profile.class_,
            "section": profile.section,
            "secondaryRole": profile.secondary_role,
            "transportMode": profile.transport_mode,
            "onboardingCompleted": profile.onboarding_completed,
            "classSectionLastUpdated": profile.class_section_last_updated.isoformat() + "Z" if profile.class_section_last_updated else None,
            "classSectionChanges": profile.class_section_changes
        }
        
    return {"user": user_data, "profile": profile_data}

class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    parentName: Optional[str] = None
    parentPhone: Optional[str] = None
    parentEmail: Optional[str] = None
    class_: Optional[str] = Field(default=None, alias="class")
    section: Optional[str] = None

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True

@router.patch("/profile")
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.username:
        # Check uniqueness of username
        existing = db.exec(
            select(UserProfile)
            .where(UserProfile.username == data.username)
            .where(UserProfile.user_id != current_user.id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        profile.username = data.username

    # Enforce class and section update limits
    is_class_changed = data.class_ is not None and data.class_ != profile.class_
    is_section_changed = data.section is not None and data.section != profile.section
    if is_class_changed or is_section_changed:
        now = datetime.utcnow()
        if current_user.role in ('teacher', 'librarian'):
            import json
            changes = []
            try:
                if profile.class_section_changes:
                    changes = json.loads(profile.class_section_changes)
            except Exception:
                changes = []
            
            one_year_ago = now - timedelta(days=365)
            active_changes = []
            for d_str in changes:
                try:
                    d_val = datetime.fromisoformat(d_str.replace("Z", ""))
                    if d_val >= one_year_ago:
                        active_changes.append(d_val)
                except Exception:
                    pass
            
            if len(active_changes) >= 2:
                active_changes.sort()
                oldest_change = active_changes[0]
                next_allowed = oldest_change + timedelta(days=365)
                raise HTTPException(
                    status_code=400,
                    detail=f"Teachers cannot change class/section assignment more than 2 times a year. Next change allowed after {next_allowed.date().isoformat()}"
                )
            
            changes.append(now.isoformat() + "Z")
            profile.class_section_changes = json.dumps(changes)
        else:
            # Student limit: 1 time a year
            if profile.class_section_last_updated:
                last_updated = profile.class_section_last_updated
                if (now - last_updated).days < 365:
                    next_allowed = last_updated + timedelta(days=365)
                    raise HTTPException(
                        status_code=400,
                        detail=f"Students can only change class and section once a year. Next change allowed after {next_allowed.date().isoformat()}"
                    )
            profile.class_section_last_updated = now

    if data.phoneNumber is not None:
        profile.phone_number = data.phoneNumber
    if data.address is not None:
        profile.address = data.address
    if data.city is not None:
        profile.city = data.city
    if data.state is not None:
        profile.state = data.state
    if data.pincode is not None:
        profile.pincode = data.pincode
    if data.parentName is not None:
        profile.parent_name = data.parentName
    if data.parentPhone is not None:
        profile.parent_phone = data.parentPhone
    if data.parentEmail is not None:
        profile.parent_email = data.parentEmail
    if data.class_ is not None:
        profile.class_ = data.class_
    if data.section is not None:
        profile.section = data.section

    profile.updated_at = datetime.utcnow()
    db.add(profile)
    db.commit()
    return {"success": True}

