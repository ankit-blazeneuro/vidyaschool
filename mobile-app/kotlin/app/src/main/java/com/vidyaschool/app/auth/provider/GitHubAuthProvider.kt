package com.vidyaschool.app.auth.provider

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResultLauncher
import net.openid.appauth.*
import com.vidyaschool.app.auth.model.AuthProvider
import com.vidyaschool.app.auth.model.AuthResult
import com.vidyaschool.app.auth.model.UserInfo
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.FormBody
import org.json.JSONObject
import org.json.JSONArray
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class GitHubAuthProvider(
    private val clientId: String,
    private val redirectUri: String
) {
    private val serviceConfig = AuthorizationServiceConfiguration(
        Uri.parse("https://github.com/login/oauth/authorize"),
        Uri.parse("https://github.com/login/oauth/access_token")
    )
    
    suspend fun signIn(
        context: Context,
        activityLauncher: ActivityResultLauncher<Intent>
    ): AuthResult = suspendCancellableCoroutine { continuation ->
        val authRequest = AuthorizationRequest.Builder(
            serviceConfig,
            clientId,
            ResponseTypeValues.CODE,
            Uri.parse(redirectUri)
        )
            .setScope("read:user user:email")
            .build()
        
        val authService = AuthorizationService(context)
        val authIntent = authService.getAuthorizationRequestIntent(authRequest)
        
        // Store callback for handling the result
        GitHubAuthCallback.setCallback { result ->
            continuation.resume(result)
            authService.dispose()
        }
        
        continuation.invokeOnCancellation {
            authService.dispose()
        }
        
        activityLauncher.launch(authIntent)
    }
    
    suspend fun handleAuthorizationResponse(
        intent: Intent,
        backendExchangeUrl: String
    ): AuthResult = withContext(Dispatchers.IO) {
        val response = AuthorizationResponse.fromIntent(intent)
        val exception = AuthorizationException.fromIntent(intent)
        
        when {
            response != null -> {
                val authCode = response.authorizationCode ?: ""
                try {
                    val client = OkHttpClient()
                    
                    val formBody = FormBody.Builder()
                        .add("client_id", clientId)
                        .add("client_secret", "b7b41a2985169a37372e9771f8bdcfa47d1e8e41")
                        .add("code", authCode)
                        .add("redirect_uri", redirectUri)
                        .build()
                        
                    val tokenRequest = Request.Builder()
                        .url("https://github.com/login/oauth/access_token")
                        .post(formBody)
                        .addHeader("Accept", "application/json")
                        .build()
                        
                    val tokenResponse = client.newCall(tokenRequest).execute()
                    if (!tokenResponse.isSuccessful) {
                        return@withContext AuthResult.Error("Failed to exchange code: ${tokenResponse.message}")
                    }
                    
                    val tokenJson = JSONObject(tokenResponse.body?.string() ?: "")
                    val accessToken = tokenJson.optString("access_token")
                    if (accessToken.isNullOrEmpty()) {
                        return@withContext AuthResult.Error("Access token not found in response")
                    }
                    
                    // Fetch user profile
                    val userRequest = Request.Builder()
                        .url("https://api.github.com/user")
                        .addHeader("Authorization", "Bearer $accessToken")
                        .addHeader("Accept", "application/json")
                        .build()
                        
                    val userResponse = client.newCall(userRequest).execute()
                    if (!userResponse.isSuccessful) {
                        return@withContext AuthResult.Error("Failed to fetch user profile: ${userResponse.message}")
                    }
                    
                    val userJson = JSONObject(userResponse.body?.string() ?: "")
                    val id = userJson.optString("id", "")
                    val name = userJson.optString("name").takeIf { it.isNotEmpty() }
                    var email = userJson.optString("email", "")
                    val avatarUrl = userJson.optString("avatar_url").takeIf { it.isNotEmpty() }
                    
                    // If email is empty, fetch user emails
                    if (email.isEmpty() || email == "null") {
                        val emailsRequest = Request.Builder()
                            .url("https://api.github.com/user/emails")
                            .addHeader("Authorization", "Bearer $accessToken")
                            .addHeader("Accept", "application/json")
                            .build()
                            
                        val emailsResponse = client.newCall(emailsRequest).execute()
                        if (emailsResponse.isSuccessful) {
                            val emailsArray = JSONArray(emailsResponse.body?.string() ?: "[]")
                            for (i in 0 until emailsArray.length()) {
                                val emailObj = emailsArray.getJSONObject(i)
                                if (emailObj.optBoolean("primary", false)) {
                                    email = emailObj.optString("email", "")
                                    break
                                }
                            }
                            if (email.isEmpty() && emailsArray.length() > 0) {
                                email = emailsArray.getJSONObject(0).optString("email", "")
                            }
                        }
                    }
                    
                    AuthResult.Success(
                        token = accessToken,
                        provider = AuthProvider.GITHUB,
                        userInfo = UserInfo(
                            id = id,
                            email = email,
                            name = name,
                            avatarUrl = avatarUrl
                        )
                    )
                } catch (e: Exception) {
                    AuthResult.Error("GitHub token exchange failed: ${e.message}", e)
                }
            }
            exception != null -> {
                if (exception.type == AuthorizationException.TYPE_GENERAL_ERROR &&
                    exception.code == AuthorizationException.GeneralErrors.USER_CANCELED_AUTH_FLOW.code
                ) {
                    AuthResult.Cancelled
                } else {
                    AuthResult.Error("GitHub authorization failed: ${exception.errorDescription}", exception)
                }
            }
            else -> {
                AuthResult.Error("Unknown authorization error")
            }
        }
    }
}

// Singleton to handle callback from activity result
object GitHubAuthCallback {
    private var callback: ((AuthResult) -> Unit)? = null
    
    fun setCallback(cb: (AuthResult) -> Unit) {
        callback = cb
    }
    
    fun invoke(result: AuthResult) {
        callback?.invoke(result)
        callback = null
    }
}
