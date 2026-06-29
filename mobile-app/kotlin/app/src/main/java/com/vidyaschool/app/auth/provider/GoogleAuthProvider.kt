package com.vidyaschool.app.auth.provider

import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.vidyaschool.app.auth.model.AuthProvider
import com.vidyaschool.app.auth.model.AuthResult
import com.vidyaschool.app.auth.model.UserInfo
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class GoogleAuthProvider(
    private val webClientId: String
) {
    suspend fun signIn(
        context: Context,
        activityLauncher: ActivityResultLauncher<Intent>
    ): AuthResult = suspendCancellableCoroutine { continuation ->
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
        
        val client = GoogleSignIn.getClient(context, gso)
        
        GoogleAuthCallback.setCallback { result ->
            continuation.resume(result)
        }
        
        continuation.invokeOnCancellation {
            client.signOut()
        }
        
        activityLauncher.launch(client.signInIntent)
    }
    
    fun handleSignInResult(data: Intent?): AuthResult {
        return try {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            val account = task.getResult(ApiException::class.java)
            
            AuthResult.Success(
                token = account.idToken ?: "",
                provider = AuthProvider.GOOGLE,
                userInfo = UserInfo(
                    id = account.id ?: "",
                    email = account.email ?: "",
                    name = account.displayName,
                    avatarUrl = account.photoUrl?.toString()
                )
            )
        } catch (e: ApiException) {
            if (e.statusCode == 12501) {
                AuthResult.Cancelled
            } else {
                AuthResult.Error("Google Sign-In failed: ${e.message}", e)
            }
        } catch (e: Exception) {
            AuthResult.Error("Error: ${e.message}", e)
        }
    }
}

object GoogleAuthCallback {
    private var callback: ((AuthResult) -> Unit)? = null
    
    fun setCallback(cb: (AuthResult) -> Unit) {
        callback = cb
    }
    
    fun invoke(result: AuthResult) {
        callback?.invoke(result)
        callback = null
    }
}
