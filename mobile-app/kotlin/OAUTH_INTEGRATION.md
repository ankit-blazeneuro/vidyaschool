# OAuth Integration Guide - Android App

## Architecture Overview

This implementation follows industry-standard OAuth patterns used by major tech companies:

### Google Authentication
- Uses **Android Credential Manager API** (recommended by Google, replaces deprecated GoogleSignInClient)
- Returns Google ID Token directly from the device's Google account
- No WebView or browser redirect needed
- Handles "no account on device" gracefully

### GitHub Authentication
- Uses **AppAuth-Android** library (OAuth 2.0 Authorization Code flow)
- Opens GitHub authorization in Chrome Custom Tab (required by GitHub - WebView is blocked)
- Returns authorization code to app via deep link
- **Authorization code must be exchanged on backend** (client secret never leaves server)

---

## Security Architecture

### What Lives in the App (Safe to Expose)
```kotlin
// Android App - SAFE to include
const val GOOGLE_CLIENT_ID = "843067211913-v6cqrhr7ubliip40i9ga076k3tmaikcm.apps.googleusercontent.com"
const val GITHUB_CLIENT_ID = "Ov23liiWAPanaeBfTfnw"
const val GITHUB_REDIRECT_URI = "com.vidyaschool.app:/oauth/github/callback"
```

### What Lives on Backend (NEVER in App)
```python
# Backend (FastAPI) - NEVER expose to client
GOOGLE_CLIENT_SECRET = "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"  # For server-side verification
GITHUB_CLIENT_SECRET = "b7b41a2985169a37372e9771f8bdcfa47d1e8e41"  # For token exchange
```

---

## Flow Diagrams

### Google Sign-In Flow
```
1. User clicks "Continue with Google"
2. Android Credential Manager shows account picker
3. User selects account → App receives Google ID Token
4. App sends ID Token to backend: POST /api/auth/google/verify
5. Backend verifies token with Google's API
6. Backend creates session and returns session token
```

### GitHub Sign-In Flow
```
1. User clicks "Continue with GitHub"
2. AppAuth opens Chrome Custom Tab → GitHub login page
3. User authorizes → GitHub redirects to com.vidyaschool.app:/oauth/github/callback
4. App receives authorization code
5. App sends code to backend: POST /api/auth/github/exchange
6. Backend exchanges code for access token (using client secret)
7. Backend fetches user info from GitHub API
8. Backend creates session and returns session token
```

---

## Backend Integration (FastAPI)

### Required Backend Endpoints

#### 1. Google ID Token Verification
```python
# backend/app/routes/auth.py
from fastapi import APIRouter, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter()

@router.post("/api/auth/google/verify")
async def verify_google_token(request: GoogleTokenRequest):
    """
    Verify Google ID Token received from Android app
    """
    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            request.token,
            requests.Request(),
            "843067211913-v6cqrhr7ubliip40i9ga076k3tmaikcm.apps.googleusercontent.com"
        )
        
        # Extract user info
        user_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name')
        picture = idinfo.get('picture')
        
        # Create or update user in database
        user = await get_or_create_user(
            provider="google",
            provider_id=user_id,
            email=email,
            name=name,
            avatar_url=picture
        )
        
        # Create session
        session_token = create_session(user.id)
        
        return {
            "token": session_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role
            }
        }
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### 2. GitHub Authorization Code Exchange
```python
import httpx

@router.post("/api/auth/github/exchange")
async def exchange_github_code(request: GitHubCodeRequest):
    """
    Exchange GitHub authorization code for access token
    IMPORTANT: Client secret stays on backend, never sent to app
    """
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": "Ov23liiWAPanaeBfTfnw",
                "client_secret": "b7b41a2985169a37372e9771f8bdcfa47d1e8e41",  # SECRET - backend only!
                "code": request.code,
                "redirect_uri": "com.vidyaschool.app:/oauth/github/callback"
            },
            headers={"Accept": "application/json"}
        )
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        # Fetch user info from GitHub
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
        )
        github_user = user_response.json()
        
        # Get email (may require separate endpoint)
        email_response = await client.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
        )
        emails = email_response.json()
        primary_email = next((e["email"] for e in emails if e["primary"]), None)
        
        # Create or update user
        user = await get_or_create_user(
            provider="github",
            provider_id=str(github_user["id"]),
            email=primary_email,
            name=github_user.get("name"),
            avatar_url=github_user.get("avatar_url")
        )
        
        # Create session
        session_token = create_session(user.id)
        
        return {
            "token": session_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role
            }
        }
```

---

## How to Update LoginScreen to Send Tokens to Backend

Update the `LaunchedEffect` in `LoginScreen.kt`:

```kotlin
LaunchedEffect(authState) {
    when (authState) {
        is AuthState.Success -> {
            val result = (authState as AuthState.Success).result
            
            // Send token to backend for verification/exchange
            try {
                val backendResponse = when (result.provider) {
                    AuthProvider.GOOGLE -> {
                        // POST /api/auth/google/verify
                        RetrofitClient.authApi.verifyGoogleToken(
                            GoogleTokenRequest(result.token)
                        )
                    }
                    AuthProvider.GITHUB -> {
                        // POST /api/auth/github/exchange
                        RetrofitClient.authApi.exchangeGitHubCode(
                            GitHubCodeRequest(result.token)
                        )
                    }
                }
                
                if (backendResponse.isSuccessful) {
                    val sessionToken = backendResponse.body()?.token
                    val userRole = backendResponse.body()?.user?.role
                    
                    // Save session token (SharedPreferences or DataStore)
                    saveSessionToken(sessionToken)
                    
                    Toast.makeText(
                        context,
                        "Signed in as ${result.userInfo.email}",
                        Toast.LENGTH_SHORT
                    ).show()
                    
                    onLoginSuccess(userRole ?: "student")
                }
            } catch (e: Exception) {
                Toast.makeText(
                    context,
                    "Backend verification failed: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            }
            
            viewModel.resetState()
        }
        is AuthState.Error -> {
            Toast.makeText(context, (authState as AuthState.Error).message, Toast.LENGTH_LONG).show()
            viewModel.resetState()
        }
        else -> {}
    }
}
```

---

## Error Handling

The implementation handles these error cases:

### Google Sign-In Errors
- **No Google account on device**: Shows "No Google account found on device. Please add a Google account in Settings."
- **User cancelled**: Returns `AuthResult.Cancelled` (no error toast)
- **Network failure**: Returns "Google Sign-In failed: [error message]"

### GitHub OAuth Errors
- **User cancelled authorization**: Returns `AuthResult.Cancelled`
- **Authorization failed**: Returns "GitHub authorization failed: [error description]"
- **Backend exchange failed**: Caught in LoginScreen when calling backend endpoint

---

## Testing

### Test Google Sign-In
1. Ensure device has Google account added
2. Click "Continue with Google"
3. Select account from picker
4. App receives ID token
5. Backend verifies token and creates session

### Test GitHub Sign-In
1. Click "Continue with GitHub"
2. Chrome Custom Tab opens with GitHub login
3. Authorize the app
4. Browser redirects to `com.vidyaschool.app:/oauth/github/callback`
5. App receives authorization code
6. Backend exchanges code for access token and creates session

### Test Error Cases
- **Google**: Remove all Google accounts from device → should show "No Google account" error
- **GitHub**: Click "Cancel" on authorization page → should return to app without error toast
- **Both**: Turn off internet → should show network error

---

## GitHub OAuth Redirect URI Configuration

In your GitHub OAuth App settings (https://github.com/settings/developers), add:

```
Authorization callback URL: com.vidyaschool.app:/oauth/github/callback
```

This matches the custom scheme deep link in `AndroidManifest.xml`.

---

## Dependencies Required

Already added to `build.gradle.kts`:
- `androidx.credentials:credentials:1.3.0` - Credential Manager
- `androidx.credentials:credentials-play-services-auth:1.3.0` - Google integration
- `com.google.android.libraries.identity.googleid:googleid:1.1.1` - Google ID token handling
- `net.openid:appauth:0.11.1` - OAuth 2.0 client (GitHub)

---

## Summary

✅ Google uses Credential Manager (modern, recommended by Google)
✅ GitHub uses AppAuth with Custom Tabs (OAuth 2.0 standard)
✅ Client secrets NEVER exposed in app
✅ All tokens verified/exchanged on backend
✅ Proper error handling for all failure cases
✅ Uses coroutines + StateFlow (no callbacks)
✅ Clean architecture with Repository pattern
