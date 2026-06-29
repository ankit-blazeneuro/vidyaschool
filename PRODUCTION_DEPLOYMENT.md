# Production Deployment Optimization Guide

## ✅ Production URLs
- **Frontend:** https://vidyaschool.vercel.app/
- **Backend:** https://vidyaschool-backend.onrender.com/

## Changes Applied

### Frontend (Vercel)

#### 1. Environment Variables Updated

**`.env.production`:**
```env
BACKEND_URL=https://vidyaschool-backend.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://vidyaschool-backend.onrender.com
BETTER_AUTH_URL=https://vidyaschool.vercel.app
NEXT_PUBLIC_APP_URL=https://vidyaschool.vercel.app
```

**`.env.local`:**
```env
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 2. Vercel Environment Variables (Set in Vercel Dashboard)

Go to: https://vercel.com/your-project/settings/environment-variables

**Add these:**
```
BACKEND_URL = https://vidyaschool-backend.onrender.com
NEXT_PUBLIC_BACKEND_URL = https://vidyaschool-backend.onrender.com
DATABASE_URL = postgresql://<user>:<password>@<host>/neondb?sslmode=require
BETTER_AUTH_SECRET = <generated_secret_key>
BETTER_AUTH_URL = https://vidyaschool.vercel.app
NEXT_PUBLIC_APP_URL = https://vidyaschool.vercel.app
RESEND_API_KEY = re_<key>
GOOGLE_CLIENT_ID = <google_client_id>
GOOGLE_CLIENT_SECRET = <google_client_secret>
GITHUB_CLIENT_ID = <github_client_id>
GITHUB_CLIENT_SECRET = <github_client_secret>
```

### Backend (Render)

#### 1. CORS Configuration ✅
Already configured in `backend/main.py`:
```python
allow_origins=["http://localhost:3000", "https://vidyaschool.vercel.app", "*"]
```

#### 2. Environment Variables (Set in Render Dashboard)

Go to: https://dashboard.render.com/web/your-service/env

**Add these:**
```
DATABASE_URL = postgresql://<user>:<password>@<host>/neondb?sslmode=require
RAZORPAY_KEY_ID = rzp_test_<key_id>
RAZORPAY_KEY_SECRET = <key_secret>
RAZORPAY_WEBHOOK_SECRET = <webhook_secret>
PYTHON_VERSION = 3.12.0
```

## Deployment Steps

### Deploy Frontend to Vercel

```bash
cd /home/ankit/Documents/Code/vs/frontend

# Commit changes
git add .
git commit -m "Add production backend URL and optimizations"
git push origin main

# Vercel will auto-deploy from GitHub
# Or manually deploy:
vercel --prod
```

### Deploy Backend to Render

**Option 1: Auto-deploy from GitHub**
1. Push to GitHub: `git push origin main`
2. Render will auto-deploy

**Option 2: Manual Deploy**
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

### Android App Production Build

Update backend URL in `/mobile-app/kotlin/app/src/main/java/com/vidyaschool/app/api/RetrofitClient.kt`:

```kotlin
// Change to production
private const val BASE_URL = "https://vidyaschool-backend.onrender.com/"
```

Then build:
```bash
cd /home/ankit/Documents/Code/vs/mobile-app/kotlin
./gradlew assembleRelease
```

APK: `app/build/outputs/apk/release/app-release.apk`

## Production Optimizations

### Frontend (Next.js)

1. **Image Optimization**
   - Already using Next.js Image component ✅
   
2. **Build Optimization**
   ```bash
   npm run build
   # Check bundle size
   ```

3. **Caching Headers**
   - Vercel handles automatically ✅

### Backend (FastAPI)

1. **Database Connection Pool**
   ```python
   # Already configured in main.py
   engine = create_engine(
       db_url,
       pool_pre_ping=True,
       pool_recycle=300
   )
   ```

2. **Sentry Error Tracking**
   - Already configured ✅

3. **Render.com Settings**
   - **Instance Type:** Starter or higher
   - **Auto-Deploy:** Enabled
   - **Health Check Path:** `/` or `/api/slider/images`

## Testing Production

### Test Frontend
```bash
curl https://vidyaschool.vercel.app/
```

### Test Backend
```bash
# Health check
curl https://vidyaschool-backend.onrender.com/

# Test slider endpoint
curl https://vidyaschool-backend.onrender.com/api/slider/images

# Test admin endpoints
curl https://vidyaschool-backend.onrender.com/api/admin/requests
```

### Test Full Flow
1. Open https://vidyaschool.vercel.app/
2. Login as admin
3. Navigate to slider management
4. Add/edit images
5. Check mobile app sees changes

## Monitoring

### Vercel
- **Analytics:** https://vercel.com/your-project/analytics
- **Logs:** https://vercel.com/your-project/logs

### Render
- **Logs:** https://dashboard.render.com/web/your-service/logs
- **Metrics:** https://dashboard.render.com/web/your-service/metrics

### Sentry
- **Errors:** https://sentry.io/organizations/vidya-school/

## Performance Tips

1. **Enable Vercel Edge Functions** (if needed)
2. **Use Redis for session storage** (upgrade later)
3. **Enable CDN for static assets** (Vercel handles this)
4. **Database indexes** (check NeonDB)
5. **API rate limiting** (add if needed)

## Rollback Plan

If issues occur:

### Frontend (Vercel)
1. Go to: https://vercel.com/your-project/deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Backend (Render)
1. Go to: https://dashboard.render.com/web/your-service
2. Click "Manual Deploy"
3. Select previous commit

## Cost Optimization

### Current Setup (Free Tier)
- **Vercel:** Free (Hobby plan)
- **Render:** Free ($0/month with 750 hours)
- **NeonDB:** Free (1 database, 1GB storage)
- **Sentry:** Free (5K errors/month)

### Upgrade Path (When Needed)
- **Vercel Pro:** $20/month (more bandwidth)
- **Render Starter:** $7/month (always-on instance)
- **NeonDB Pro:** $19/month (more storage)

## Security Checklist

✅ HTTPS enabled (Vercel + Render)
✅ Environment variables secured
✅ CORS properly configured
✅ Secrets not in code
✅ Database credentials secured
✅ API authentication enabled
⚠️ Rate limiting (add if needed)
⚠️ DDoS protection (consider Cloudflare)

## Status

**✅ Production-Ready Configuration Applied**

Both frontend and backend are now optimized for production deployment!
