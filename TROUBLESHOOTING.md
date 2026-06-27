# Troubleshooting Guide - Teacher Approval Feature

## Common Issues & Solutions

### 1. Socket Connection Fails
**Symptom**: Waiting room shows pending but never updates

**Solutions**:
```bash
# Check backend is running
curl http://localhost:8000

# Check CORS settings in backend/main.py
# Should allow frontend origin: http://localhost:3000

# Check frontend .env.local has:
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 2. Database Migration Errors
**Symptom**: Column already exists or table not found

**Solutions**:
```bash
# Check current schema
psql $DATABASE_URL -c "\d user"
psql $DATABASE_URL -c "\d teacher_request"

# If columns exist, skip adding them
# If table exists, drop and recreate:
psql $DATABASE_URL -c "DROP TABLE IF EXISTS teacher_request CASCADE;"
# Then run migration again
```

### 3. Signup Doesn't Create Teacher Request
**Symptom**: No request appears in admin dashboard

**Check**:
```typescript
// In frontend/lib/auth.ts - verify onAfterSignUp hook is present
// Check browser network tab for signup request
// Should include preferredRole: "teacher" in body

// Check backend logs for errors
```

**Debug**:
```bash
# Query database directly
psql $DATABASE_URL -c "SELECT * FROM teacher_request;"
```

### 4. Middleware Redirects Incorrectly
**Symptom**: User stuck in redirect loop

**Solutions**:
```typescript
// Check middleware.ts
// Verify /auth/waiting-room is in protectedRoutes
// Make sure user.teacherApprovalStatus is being read correctly

// Clear browser cookies and try again
// Check session data:
```
```bash
psql $DATABASE_URL -c "SELECT * FROM session ORDER BY created_at DESC LIMIT 5;"
```

### 5. Admin Can't Approve Requests
**Symptom**: Buttons don't work or no socket response

**Check**:
```javascript
// Browser console should show:
// "Admin connected to server"
// "joined admin_room"

// If not, check:
// 1. Socket.IO connection established
// 2. User role is "admin"
// 3. adminId being sent correctly
```

**Debug Backend**:
```python
# In main.py, add print statements:
@sio.event
async def approve_teacher(sid, data):
    print(f"Approve request: {data}")  # Add this
    # ... rest of code
```

### 6. Role Selection Not Showing
**Symptom**: Combobox missing in signup form

**Check**:
```bash
# Verify Select component exists
ls frontend/components/ui/select.tsx

# Check imports in signup page
# Should have:
# import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
```

### 7. TypeScript Errors
**Common errors**:

```typescript
// Error: Property 'preferredRole' does not exist
// Solution: Add to user type in lib/auth.ts

// Error: Cannot find module 'uuid'
// Solution: npm install uuid @types/uuid

// Error: Property 'teacherRequest' does not exist on schema
// Solution: Restart TypeScript server (VS Code: Cmd+Shift+P → Restart TS Server)
```

### 8. WebSocket Events Not Firing

**Debug Client**:
```typescript
// Add to waiting-room/page.tsx
socket.on("connect", () => console.log("✅ Connected"))
socket.on("disconnect", () => console.log("❌ Disconnected"))
socket.on("approval_status", (data) => console.log("📨 Status:", data))
```

**Debug Server**:
```python
# In main.py
@sio.event
async def connect(sid, environ):
    print(f"🟢 Client connected: {sid}")
    
@sio.event  
async def disconnect(sid):
    print(f"🔴 Client disconnected: {sid}")
```

### 9. Approved User Still Sees Waiting Room
**Symptom**: User approved but can't access /teacher

**Solutions**:
```bash
# Check user role was updated
psql $DATABASE_URL -c "SELECT id, email, role, teacher_approval_status FROM \"user\" WHERE preferred_role = 'teacher';"

# Should show:
# role = 'teacher'
# teacher_approval_status = 'approved'

# If not, manually update:
psql $DATABASE_URL -c "UPDATE \"user\" SET role='teacher', teacher_approval_status='approved' WHERE id='USER_ID';"

# Have user logout and login again
```

### 10. Build Errors

**Common build errors**:
```bash
# Error: Module not found: Can't resolve 'socket.io-client'
npm install socket.io-client

# Error: Module not found: Can't resolve 'uuid'
npm install uuid @types/uuid

# Error: Cannot find module '@/components/ui/tabs'
# Install shadcn tabs component:
npx shadcn@latest add tabs
```

## Quick Reset

If everything breaks, reset the feature:

```bash
# 1. Drop tables
psql $DATABASE_URL -c "DROP TABLE IF EXISTS teacher_request CASCADE;"

# 2. Remove columns
psql $DATABASE_URL -c "ALTER TABLE \"user\" DROP COLUMN IF EXISTS preferred_role, DROP COLUMN IF EXISTS teacher_approval_status;"

# 3. Re-run migration
psql $DATABASE_URL < frontend/migrations/add_teacher_approval.sql

# 4. Clear browser data
# - Clear cookies
# - Clear localStorage
# - Hard refresh (Cmd+Shift+R)

# 5. Restart services
cd backend && uvicorn main:app --reload --port 8000
cd frontend && npm run dev
```

## Getting Help

1. Check browser console for errors
2. Check backend terminal for Python errors
3. Check database state with SQL queries
4. Verify environment variables are set
5. Test socket connection at http://localhost:8000 with browser dev tools

## Success Indicators

✅ Signup creates entry in `teacher_request` table
✅ User redirects to `/auth/waiting-room`
✅ WebSocket connects (check browser Network tab → WS)
✅ Admin sees request in `/admin/[username]/requests`
✅ Approve button updates database
✅ User auto-redirects to `/teacher`
✅ User role changed to "teacher" in database
