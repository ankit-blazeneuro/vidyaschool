# Teacher Approval Feature

## Overview
This feature adds a role selection during signup with an admin approval workflow for teacher accounts.

## Flow

### 1. Signup
- User selects preferred role: **Student** or **Teacher**
- If Student → redirects to `/student` after email verification
- If Teacher → redirects to `/auth/waiting-room` after email verification

### 2. Teacher Waiting Room
- Shows pending approval status
- Establishes WebSocket connection to backend
- Listens for approval/rejection status in real-time
- On approval → redirects to `/teacher`
- On rejection → redirects to `/student` (fallback)

### 3. Admin Approval
- Admin sees teacher requests at `/admin/[username]/requests`
- Two tabs: "Teacher Accounts" and "Subject Allocations"
- Admin can approve or reject via WebSocket
- Approval changes user role to "teacher"
- Rejection keeps user as "student"

### 4. Database Schema

#### user table (updated)
- `preferred_role` - enum: student/teacher (what user requested)
- `teacher_approval_status` - text: pending/approved/rejected

#### teacher_request table (new)
- `id` - primary key
- `user_id` - foreign key to user
- `status` - pending/approved/rejected
- `admin_id` - who approved/rejected
- `rejection_reason` - optional text
- `created_at`, `updated_at` - timestamps

## WebSocket Events

### Client → Server
- `teacher_request_status` - Check current status
- `join_admin_room` - Admin joins notification room
- `approve_teacher` - Admin approves request
- `reject_teacher` - Admin rejects request

### Server → Client
- `approval_status` - Status update for waiting user
- `teacher_request_created` - New request notification to admins
- `request_updated` - Request status changed

## Setup

### 1. Run Migration
```bash
# Connect to your database and run:
psql $DATABASE_URL < frontend/migrations/add_teacher_approval.sql
```

### 2. Environment Variables
Backend already configured. Frontend needs:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Start Services
```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

## Testing

1. Sign up with role "Teacher"
2. Verify email
3. Should see waiting room
4. Login as admin → go to requests
5. Approve/reject the request
6. User should be redirected automatically

## Files Modified

### Frontend
- `lib/schema.ts` - Added fields and teacherRequest table
- `lib/auth.ts` - Added preferredRole handling
- `app/signup/page.tsx` - Added role selector
- `app/auth/waiting-room/page.tsx` - New waiting room page
- `app/admin/[username]/requests/page.tsx` - Updated with teacher approval tab
- `app/api/admin/teacher-requests/route.ts` - New API endpoint
- `middleware.ts` - Added teacher approval status checks

### Backend
- `models.py` - Added preferredRole, teacherApprovalStatus, TeacherRequest
- `main.py` - Added socket events for teacher approval workflow

## Notes
- Teacher requests are created automatically on signup
- Middleware ensures pending teachers can only access waiting room
- Real-time updates via Socket.IO
- Fallback to student role on rejection
