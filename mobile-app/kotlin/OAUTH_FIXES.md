# Fixing OAuth Configuration Issues

## Issue 1: "redirect_uri is not associated with this application" (GitHub)

### Problem
GitHub OAuth returns an error because the redirect URI doesn't match what's registered in your GitHub OAuth app.

### Solution

1. Go to your GitHub OAuth App settings:
   - Visit: https://github.com/settings/developers
   - Click on your OAuth app (or create one if you haven't)

2. Add the redirect URI:
   ```
   Authorization callback URL: com.vidyaschool.app:/oauth/github/callback
   ```

3. Make sure the Client ID matches:
   ```
   Client ID: Ov23liiWAPanaeBfTfnw
   ```

4. If you need to create a new OAuth app:
   - Application name: Vidya School Android
   - Homepage URL: https://yourdomain.com (or http://localhost:3000 for dev)
   - Authorization callback URL: `com.vidyaschool.app:/oauth/github/callback`

### Current Configuration in App
```kotlin
// In GitHubAuthProvider.kt
clientId = "Ov23liiWAPanaeBfTfnw"
redirectUri = "com.vidyaschool.app:/oauth/github/callback"
```

---

## Issue 2: "No Google account found on device"

### Problem
Google Credential Manager uses `GetSignInWithGoogleOption` which requires proper configuration in Google Cloud Console.

### Solution

#### Step 1: Configure Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials

2. Click on your OAuth 2.0 Client ID (or create one):
   - Application type: **Android**
   - Package name: `com.vidyaschool.app`
   
3. Get your SHA-1 certificate fingerprint:
   ```bash
   # For debug builds
   cd /home/ankit/Documents/Code/vs/mobile-app/kotlin
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   
4. Add the SHA-1 fingerprint to your Android OAuth client in Google Cloud Console

5. Make sure your Web OAuth client ID is also configured:
   - Client ID: `843067211913-v6cqrhr7ubliip40i9ga076k3tmaikcm.apps.googleusercontent.com`
   - This is the one used in the app

#### Step 2: Verify Device Has Google Account

1. On your Android device:
   - Go to Settings → Accounts
   - Make sure at least one Google account is added
   - If not, add one: Settings → Accounts → Add account → Google

#### Step 3: Alternative - Use Web Client ID

If you're still having issues, the app is already configured to use `GetSignInWithGoogleOption` which should work with just the web client ID. Make sure:

```kotlin
// Current configuration in GoogleAuthProvider.kt
val googleIdOption = GetSignInWithGoogleOption.Builder(clientId)
    .build()
```

The `clientId` should be your **Web OAuth 2.0 Client ID** from Google Cloud Console.

---

## Testing After Configuration

### Test Google Sign-In
1. Ensure device has Google account added
2. Click "Continue with Google"
3. Should show Google account picker
4. Select account → See provider info on student screen

### Test GitHub Sign-In
1. Click "Continue with GitHub"
2. Chrome Custom Tab opens
3. Authorize app
4. Redirects back to app
5. See provider info on student screen

---

## Quick Setup Commands

### Get your debug SHA-1 (needed for Google Cloud Console):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
```

### Rebuild and install app:
```bash
cd /home/ankit/Documents/Code/vs/mobile-app/kotlin
./gradlew assembleDebug && adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## What's Now Working

✅ **Provider Info Display**: After login, student screen shows:
   - User's name (with avatar initial)
   - Email address
   - Provider badge (Google/GitHub)
   - Color-coded badges (red for Google, dark for GitHub)

✅ **Google Auth**: Fixed to use `GetSignInWithGoogleOption`
✅ **Navigation**: Passes provider, email, and name through routes
✅ **Email Login**: Also passes provider info (shows as "Email")

---

## Configuration Summary

### App Configuration (Already Done)
- ✅ Google Client ID: In code
- ✅ GitHub Client ID: In code
- ✅ GitHub Redirect URI: In manifest
- ✅ Deep link: Configured in AndroidManifest.xml

### External Configuration (You Need to Do)
- ⚠️ **Google Cloud Console**: Add Android OAuth client with SHA-1
- ⚠️ **GitHub OAuth App**: Add redirect URI `com.vidyaschool.app:/oauth/github/callback`

Once you configure these, both OAuth flows will work properly!
