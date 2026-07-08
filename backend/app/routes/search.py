from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
import re

router = APIRouter(prefix="/api/search", tags=["search"])

SEARCH_INDEX: List[Dict[str, Any]] = [
    # --- Public Docs ---
    {
        "id": "docs-auth-signup",
        "title": "Account Registration (Signup) - Docs",
        "content": "Learn how to register your profile credentials on the VidyaSchool portal and choose your preferred platform roles.",
        "url": "/docs/auth/signup",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["signup", "register", "create account", "credentials", "oauth", "google", "github"]
    },
    {
        "id": "docs-auth-login",
        "title": "Portal Login Streams - Docs",
        "content": "Walkthrough on signing into the dashboard and accessing your designated workspace controls.",
        "url": "/docs/auth/login",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["login", "signin", "redirect", "dashboard", "portal"]
    },
    {
        "id": "docs-auth-approval",
        "title": "Verification & Educator Approvals - Docs",
        "content": "Understand the email verification cycle and administrative approval flows for teachers.",
        "url": "/docs/auth/approval",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["verification", "approval", "waiting room", "pending", "status", "educator"]
    },
    {
        "id": "docs-student-onboarding",
        "title": "Student Profile Onboarding - Docs",
        "content": "Complete guide on setting up your account profile, emergency coordinates, class allocations, and commuter choices to activate your portal workspace.",
        "url": "/docs/student/onboarding",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["onboarding", "profile", "admission number", "commute", "parent", "guardian", "setup"]
    },
    {
        "id": "docs-student-fees",
        "title": "Fees Ledger & Online Payments - Docs",
        "content": "Verify outstanding balances, tuition fees, transport fees, and co-curricular concessions, and pay online securely.",
        "url": "/docs/student/fees",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["fees", "tuition", "payment", "razorpay", "receipt", "ledger", "scholarship", "invoice"]
    },
    {
        "id": "docs-student-marks",
        "title": "Academic Marks & Performance Sheets - Docs",
        "content": "Detailed view of your test results, subject aggregates, term percentages, and grade cards.",
        "url": "/docs/student/marks",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["marks", "grades", "exams", "report card", "gpa", "percentage", "tests"]
    },
    {
        "id": "docs-student-library",
        "title": "Library Catalog & Borrowing Tracker - Docs",
        "content": "Manage issued books, verify return deadlines, avoid late fines, and search library collections.",
        "url": "/docs/student/library",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["library", "books", "borrow", "catalog", "due date", "fine", "late fee"]
    },
    {
        "id": "docs-student-complaints",
        "title": "Filing a Complaint & Support Tickets - Docs",
        "content": "Report technical glitches, infrastructural issues, or classroom concerns directly to authorities.",
        "url": "/docs/student/complaints",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["complaint", "support", "ticket", "issue", "escalation", "helpdesk"]
    },
    {
        "id": "docs-teacher-roster",
        "title": "Class Roster & Student Profiles - Docs",
        "content": "Detailed instructions for teachers to manage student lists, emergency phone numbers, and transit modes.",
        "url": "/docs/teacher/roster",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["roster", "class manager", "student profiles", "emergency contact"]
    },
    {
        "id": "docs-teacher-grading",
        "title": "Marks Submission & Grading Management - Docs",
        "content": "Learn how to record student test scores, batch-submit term exams, and publish grades.",
        "url": "/docs/teacher/grading",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["grading", "marks entry", "exam submit", "scores", "grades editor"]
    },
    {
        "id": "docs-teacher-notices",
        "title": "Publishing Notices & Announcements - Docs",
        "content": "Broadcast class updates, homework tasks, or exam announcements directly to student portals.",
        "url": "/docs/teacher/notices",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["notices", "announcement", "broadcast", "bulletin board", "homework"]
    },
    {
        "id": "docs-teacher-escalations",
        "title": "Leave Requests & supplies Procurements - Docs",
        "content": "How to submit official leaves or supply orders directly to administration.",
        "url": "/docs/teacher/escalations",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["leave", "requests", "supplies", "procurement", "inventory"]
    },
    {
        "id": "docs-teacher-complaints",
        "title": "Educator Support & Complaint Tickets - Docs",
        "content": "Log infrastructural issues or coordinate reports directly with coordinators or IT support.",
        "url": "/docs/teacher/complaints",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["support ticket", "helpdesk", "educator complaint"]
    },
    {
        "id": "docs-privacy-policy",
        "title": "Privacy Policy - Docs",
        "content": "This Privacy Policy details how VidyaSchool collects, utilizes, protects, and governs personal information for students, educators, and guardians.",
        "url": "/docs/privacy-policy",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["privacy", "policy", "data protection", "security", "consent"]
    },
    {
        "id": "docs-terms-of-service",
        "title": "Terms of Service - Docs",
        "content": "These Terms of Service regulate access and use of the VidyaSchool digital portal, mobile applications, and student information systems.",
        "url": "/docs/terms-of-service",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["terms", "service", "agreement", "rules", "conduct", "liability"]
    },

    # --- Student Dashboard Pages ---
    {
        "id": "page-student-dashboard",
        "title": "Student Dashboard - Home",
        "content": "Access your personalized student profile overview, daily notice bulletins, and active shortcuts.",
        "url": "/student/{username}",
        "roles": ["student"],
        "keywords": ["home", "dashboard", "main", "student portal", "overview", "shortcuts"]
    },
    {
        "id": "page-student-fees",
        "title": "Fees Ledger & Payment Portal",
        "content": "Verify outstanding balances, tuition fees, transport fees, and pay online securely via Razorpay.",
        "url": "/student/{username}/fees",
        "roles": ["student"],
        "keywords": ["fees", "tuition", "payment", "razorpay", "bill", "invoice", "finance", "due"]
    },
    {
        "id": "page-student-library",
        "title": "Library Book Catalog",
        "content": "Search the digital catalog library, view active borrowings, and check book return due dates.",
        "url": "/student/{username}/library",
        "roles": ["student"],
        "keywords": ["library", "books", "borrow", "catalog", "search books", "due dates"]
    },
    {
        "id": "page-student-marks",
        "title": "My Marks & Exam Reports",
        "content": "View class test scores, terminal examination marks aggregates, and GPA cards.",
        "url": "/student/{username}/marks",
        "roles": ["student"],
        "keywords": ["marks", "grades", "exams", "report card", "results", "score card"]
    },
    {
        "id": "page-student-notices",
        "title": "Notice Board & Announcements",
        "content": "Read all official school notices, grade announcements, holiday alerts, and academic updates.",
        "url": "/student/{username}/notice",
        "roles": ["student"],
        "keywords": ["notice", "announcements", "bulletin", "school circulars", "alerts"]
    },

    # --- Teacher Dashboard Pages ---
    {
        "id": "page-teacher-dashboard",
        "title": "Teacher Dashboard - Home",
        "content": "Overview of your classes, upcoming subjects, quick tools, and recent notice logs.",
        "url": "/teacher/{username}",
        "roles": ["teacher"],
        "keywords": ["home", "dashboard", "main", "teacher portal", "overview"]
    },
    {
        "id": "page-teacher-class",
        "title": "My Class Roster",
        "content": "Manage student registers for your assigned class, update contact card records, and audit onboarding status.",
        "url": "/teacher/{username}/class",
        "roles": ["teacher"],
        "keywords": ["class", "roster", "students list", "attendance", "register", "grade"]
    },
    {
        "id": "page-teacher-subjects",
        "title": "Subject Marks Editor",
        "content": "Manage subjects, input student scores for assignments, midterms, and submit final terms.",
        "url": "/teacher/{username}/subjects",
        "roles": ["teacher"],
        "keywords": ["subjects", "marks entry", "grading", "class scores", "exams"]
    },
    {
        "id": "page-teacher-requests",
        "title": "Leave & Supply Requests",
        "content": "Submit requests for official leave of absence or classroom supplies procurement.",
        "url": "/teacher/{username}/requests",
        "roles": ["teacher"],
        "keywords": ["requests", "leave", "supplies", "procurement", "orders"]
    },
    {
        "id": "page-teacher-notices",
        "title": "Notice Publishing Desk",
        "content": "Draft and broadcast notice announcements directly to student portals and boards.",
        "url": "/teacher/{username}/notice",
        "roles": ["teacher"],
        "keywords": ["notice", "publish", "announcement", "bulletin", "homework notice"]
    },
    {
        "id": "page-teacher-complaints",
        "title": "Complaints Directory",
        "content": "Audit student complaints or infrastructural concerns routed to your dashboard.",
        "url": "/teacher/{username}/complaints",
        "roles": ["teacher"],
        "keywords": ["complaint", "support ticket", "grievance", "classroom issue"]
    },

    # --- Librarian Dashboard Pages ---
    {
        "id": "page-librarian-dashboard",
        "title": "Librarian Dashboard - Home",
        "content": "Library operations summary, outstanding book returns, and issue metrics.",
        "url": "/librarian/{username}",
        "roles": ["librarian"],
        "keywords": ["home", "dashboard", "main", "librarian portal"]
    },
    {
        "id": "page-librarian-books",
        "title": "Book Catalog Management",
        "content": "Add, edit, or remove books from the school library catalog.",
        "url": "/librarian/{username}/books",
        "roles": ["librarian"],
        "keywords": ["manage books", "catalog", "inventory", "library inventory"]
    },
    {
        "id": "page-librarian-borrowings",
        "title": "Book Issue & Returns Ledger",
        "content": "Issue library books to students or teachers, register returns, and log fine surcharges.",
        "url": "/librarian/{username}/borrowings",
        "roles": ["librarian"],
        "keywords": ["borrowings", "issue book", "return book", "library ledger", "fines"]
    },
    {
        "id": "page-librarian-notice",
        "title": "Librarian Notices Desk",
        "content": "Review notice announcements posted by library and administration boards.",
        "url": "/librarian/{username}/notice",
        "roles": ["librarian"],
        "keywords": ["notices", "bulletin board", "announcements"]
    },

    # --- Admin Dashboard Pages ---
    {
        "id": "page-admin-dashboard",
        "title": "Admin Dashboard - Home",
        "content": "School management control panel, user metrics, and pending educator requests.",
        "url": "/admin/{username}",
        "roles": ["admin"],
        "keywords": ["home", "dashboard", "main", "admin portal", "management"]
    },
    {
        "id": "page-admin-students",
        "title": "Student Accounts Management",
        "content": "Manage enrolled students profiles, check admission numbers, and change user roles.",
        "url": "/admin/{username}/students",
        "roles": ["admin"],
        "keywords": ["students", "student management", "admission", "users role"]
    },
    {
        "id": "page-admin-teachers",
        "title": "Teacher Accounts & Approvals",
        "content": "Review new teacher registrations, approve pending accounts, and manage class teacher allocations.",
        "url": "/admin/{username}/teacher",
        "roles": ["admin"],
        "keywords": ["teachers", "faculty", "approvals", "pending request", "class teacher"]
    },
    {
        "id": "page-admin-requests",
        "title": "Leave & Procurement approvals",
        "content": "Audit and approve teacher leave applications and supply procurements.",
        "url": "/admin/{username}/requests",
        "roles": ["admin"],
        "keywords": ["approvals", "leave approval", "supplies request", "review"]
    },
    {
        "id": "page-admin-fees",
        "title": "School Fees Management",
        "content": "Define school fees structures, track ledger collections, and verify financial summaries.",
        "url": "/admin/{username}/fee-management",
        "roles": ["admin"],
        "keywords": ["fees management", "finance", "fee structure", "collection"]
    },
    {
        "id": "page-admin-complaints",
        "title": "Admin Complaints Desk",
        "content": "Audit and review student and teacher escalation tickets.",
        "url": "/admin/{username}/complaints",
        "roles": ["admin"],
        "keywords": ["complaints", "tickets", "grievance", "support escalations"]
    },
    {
        "id": "page-admin-notice",
        "title": "Admin Notices Directory",
        "content": "Edit and publish official school notices and student circulars.",
        "url": "/admin/{username}/notice",
        "roles": ["admin"],
        "keywords": ["notices", "circulars", "bulletin board", "publish notice"]
    },
    {
        "id": "page-admin-slider",
        "title": "Slider Banner Publisher",
        "content": "Configure and publish image banners displayed on student/teacher dashboard sliders.",
        "url": "/admin/{username}/slider",
        "roles": ["admin"],
        "keywords": ["slider", "banners", "images", "carousel", "ads"]
    },

    # --- Account Dashboard Pages ---
    {
        "id": "page-account-dashboard",
        "title": "Accounts Dashboard - Home",
        "content": "Financial summaries, income ledgers, expense reports, and ledger status.",
        "url": "/accounts/{username}",
        "roles": ["account"],
        "keywords": ["home", "dashboard", "main", "accounts portal", "finance"]
    },
    {
        "id": "page-account-fees",
        "title": "Student Fees Tracker",
        "content": "Audit student tuition installments, overdue payments, and manual fee adjustments.",
        "url": "/accounts/{username}/fees",
        "roles": ["account"],
        "keywords": ["fees ledger", "student payment", "tuition collections"]
    },
    {
        "id": "page-account-structures",
        "title": "Tuition Fee Structures",
        "content": "Configure class-wise monthly tuition, activity fees, and transportation surcharges.",
        "url": "/accounts/{username}/structures",
        "roles": ["account"],
        "keywords": ["fee structure", "class fees", "rates", "surcharge"]
    },
    {
        "id": "page-account-payments",
        "title": "Online Payments Ledger",
        "content": "List of online transactions verified through Razorpay, showing UPI and bank reference codes.",
        "url": "/accounts/{username}/payments",
        "roles": ["account"],
        "keywords": ["razorpay ledger", "transactions", "upi", "card payments"]
    },
    {
        "id": "page-account-expenses",
        "title": "School Expenses Logger",
        "content": "Record school operating costs, utility payments, salary logs, and maintenance bills.",
        "url": "/accounts/{username}/expenses",
        "roles": ["account"],
        "keywords": ["expenses", "expenditure", "bills", "payouts"]
    },
    {
        "id": "page-account-income",
        "title": "Miscellaneous Income Logger",
        "content": "Record school non-tuition revenues, grant sponsorships, and donations.",
        "url": "/accounts/{username}/income",
        "roles": ["account"],
        "keywords": ["revenue", "income", "donations", "grants"]
    },
    {
        "id": "page-account-payroll",
        "title": "Faculty Payroll Manager",
        "content": "Manage salaries, allowances, provident fund deductibles, and release payouts.",
        "url": "/accounts/{username}/payroll",
        "roles": ["account"],
        "keywords": ["payroll", "salaries", "paycheck", "provident fund", "teachers pay"]
    },
    {
        "id": "page-account-ledgers",
        "title": "General Ledgers Accounts",
        "content": "Double-entry bookkeeping accounts, asset ledgers, liability ledgers, and equity balances.",
        "url": "/accounts/{username}/ledgers",
        "roles": ["account"],
        "keywords": ["bookkeeping", "assets", "liabilities", "ledger sheets"]
    },
    {
        "id": "page-account-banks",
        "title": "School Bank Accounts",
        "content": "List bank balances, deposit tracks, bank reconciliation reports, and cash vaults.",
        "url": "/accounts/{username}/banks",
        "roles": ["account"],
        "keywords": ["bank balance", "deposit", "savings account", "reconciliation"]
    },
    {
        "id": "page-account-invoices",
        "title": "Invoices Generation Desk",
        "content": "Issue official school invoices to students, vendors, or transport contractors.",
        "url": "/accounts/{username}/invoices",
        "roles": ["account"],
        "keywords": ["invoice", "bills", "billing desk"]
    },
    {
        "id": "page-account-receipts",
        "title": "Receipts Directory",
        "content": "Generate and print official payment receipt sheets showing transaction details.",
        "url": "/accounts/{username}/receipts",
        "roles": ["account"],
        "keywords": ["receipt", "proof of payment", "print receipt"]
    },
    {
        "id": "page-account-refunds",
        "title": "Refund Requests Desk",
        "content": "Process student refunds for caution deposits, admission cancellations, or double payments.",
        "url": "/accounts/{username}/refunds",
        "roles": ["account"],
        "keywords": ["refunds", "cancel billing", "return money"]
    },
    {
        "id": "page-account-scholarships",
        "title": "Scholarship Allocations",
        "content": "Allocate tuition fee concession waivers to EWS, Merit-based, or Sports scholarship profiles.",
        "url": "/accounts/{username}/scholarships",
        "roles": ["account"],
        "keywords": ["concession", "waivers", "scholarships", "ews discount"]
    },
    {
        "id": "page-account-reports",
        "title": "Financial Audit Reports",
        "content": "Audit balance sheets, profit & loss statements, cash flow charts, and collection aggregates.",
        "url": "/accounts/{username}/reports",
        "roles": ["account"],
        "keywords": ["reports", "balance sheet", "p&l statement", "audit", "profit"]
    },
    {
        "id": "page-account-settings",
        "title": "Financial Configurations Settings",
        "content": "Set tax brackets (GST), automatic fine rates, payment term due limits, and account locks.",
        "url": "/accounts/{username}/settings",
        "roles": ["account"],
        "keywords": ["settings", "tax configuration", "late fine rate", "finance rules"]
    },

    # --- Common Portal Pages ---
    {
        "id": "page-common-community",
        "title": "Community Chat Room",
        "content": "Join the live school community conversation, chat real-time, and read notices.",
        "url": "/community",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["chat", "community", "messages", "live talk", "group chat"]
    },
]

@router.get("")
def search(
    query: str = Query(..., alias="q"),
    role: Optional[str] = None,
    username: Optional[str] = None
):
    cleaned_query = query.strip().lower()
    if not cleaned_query:
        return []

    # Tokenize the query to match individual keywords
    query_tokens = [t for t in re.split(r"\s+", cleaned_query) if t]
    
    results = []
    
    for item in SEARCH_INDEX:
        # Check if item is role-restricted
        if role and "roles" in item and role not in item["roles"]:
            continue
            
        score = 0
        title_lower = item["title"].lower()
        content_lower = item["content"].lower()
        
        # 1. Exact title match gets absolute highest points
        if cleaned_query == title_lower:
            score += 150
        elif cleaned_query in title_lower:
            score += 80
            
        # 2. Token match points for Title
        for token in query_tokens:
            if token in title_lower:
                score += 20
                
        # 3. Match against keywords list
        for kw in item.get("keywords", []):
            kw_lower = kw.lower()
            if cleaned_query == kw_lower:
                score += 60
            elif cleaned_query in kw_lower:
                score += 30
            else:
                for token in query_tokens:
                    if token == kw_lower:
                        score += 25
                    elif token in kw_lower:
                        score += 12
                        
        # 4. Match in content body
        if cleaned_query in content_lower:
            score += 25
        for token in query_tokens:
            if token in content_lower:
                score += 8
                
        if score > 0:
            # Format the URL if username is present
            item_url = item["url"]
            if username and "{username}" in item_url:
                formatted_url = item_url.format(username=username)
            else:
                formatted_url = item_url.replace("/{username}", "")
                
            results.append({
                "id": item["id"],
                "title": item["title"],
                "content": item["content"],
                "url": formatted_url,
                "score": score
            })
            
    # Sort results by score in descending order
    results.sort(key=lambda x: x["score"], reverse=True)
    
    # Return top 15 results (limited and clean)
    return [{
        "id": r["id"],
        "title": r["title"],
        "content": r["content"],
        "url": r["url"]
    } for r in results[:15]]
