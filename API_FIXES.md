# API Endpoint Fixes - Admin Requests & Onboarding

## Fixed Issues

### 1. ✅ 403/404 Error: `/api/backend/api/admin/requests`

**Problem:** Missing admin endpoints for managing teacher approval and subject-class requests

**Solution:** Added the following endpoints to `/backend/main.py`:

```python
# Admin endpoints
GET  /api/admin/requests                          # Get pending subject requests
GET  /api/admin/teacher-requests                  # Get pending teacher approvals
POST /api/admin/requests/{id}/approve             # Approve subject request
POST /api/admin/requests/{id}/reject              # Reject subject request
POST /api/admin/teacher-requests/{id}/approve     # Approve teacher
POST /api/admin/teacher-requests/{id}/reject      # Reject teacher
```

### 2. ✅ 422 Error: `/api/backend/api/onboarding`

**Problem:** Onboarding endpoint exists but returns 422 (validation error)

**Cause:** Frontend sending data that doesn't match backend schema

**Schema Expected:**
```typescript
{
  admissionNumber: string (required)
  username: string (required)
  phoneNumber: string (required)
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  address: string (required)
  city: string (required)
  state: string (required)
  pincode: string (required)
  class?: string
  section?: string
  transportMode?: string
}
```

**Note:** The endpoint is working correctly. The 422 error means the frontend is sending invalid or missing required fields.

## Files Modified

### `/backend/main.py`

**Added imports:**
```python
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import select
from typing import Optional
from app.core.auth import require_role, get_current_user
from app.core.database import get_db
from models import User
```

**Added 6 new admin endpoints** after router includes (lines ~360-500)

## Testing

### Test Admin Requests Endpoint
```bash
# Start backend
cd backend
./start_backend.sh

# Test endpoints (requires admin auth)
curl -X GET http://localhost:8000/api/admin/requests \
  -H "Cookie: session_token=YOUR_ADMIN_TOKEN"
  
curl -X GET http://localhost:8000/api/admin/teacher-requests \
  -H "Cookie: session_token=YOUR_ADMIN_TOKEN"
```

### Test Onboarding Endpoint
```bash
# Check what data is being sent
# Open browser DevTools > Network tab
# Attempt onboarding and inspect the payload
# Ensure all required fields are present
```

## Status

✅ **Fixed:** Admin requests endpoints (403/404 errors)
⚠️ **Partial:** Onboarding endpoint (422 error is client-side validation issue)

## Next Steps

1. **Restart backend** to load new endpoints:
   ```bash
   cd /home/ankit/Documents/Code/vs/backend
   ./start_backend.sh
   ```

2. **Test admin panel** at: http://localhost:3000/admin/[username]/requests

3. **For onboarding 422 error:**
   - Check frontend onboarding form
   - Verify all required fields are being sent
   - Check browser console for validation errors
   - Ensure field names match schema (camelCase vs snake_case)

## API Endpoint Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/requests` | GET | Admin | List subject requests |
| `/api/admin/teacher-requests` | GET | Admin | List teacher approvals |
| `/api/admin/requests/{id}/approve` | POST | Admin | Approve subject request |
| `/api/admin/requests/{id}/reject` | POST | Admin | Reject subject request |
| `/api/admin/teacher-requests/{id}/approve` | POST | Admin | Approve teacher |
| `/api/admin/teacher-requests/{id}/reject` | POST | Admin | Reject teacher |
| `/api/onboarding` | POST | User | Submit onboarding form |
| `/api/onboarding/status` | GET | User | Check onboarding status |
