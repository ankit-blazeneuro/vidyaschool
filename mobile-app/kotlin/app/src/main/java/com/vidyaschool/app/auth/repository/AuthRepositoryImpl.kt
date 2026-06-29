package com.vidyaschool.app.auth.repository

import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import com.vidyaschool.app.auth.model.AuthResult
import com.vidyaschool.app.auth.provider.GitHubAuthProvider
import com.vidyaschool.app.auth.provider.GoogleAuthProvider

class AuthRepositoryImpl(
    private val googleProvider: GoogleAuthProvider,
    private val githubProvider: GitHubAuthProvider
) : AuthRepository {
    
    override suspend fun signInWithGoogle(context: Context): AuthResult {
        throw UnsupportedOperationException("Use signInWithGoogle(context, activityLauncher) instead")
    }
    
    suspend fun signInWithGoogle(
        context: Context,
        activityLauncher: ActivityResultLauncher<Intent>
    ): AuthResult {
        return googleProvider.signIn(context, activityLauncher)
    }
    
    fun handleGoogleCallback(intent: Intent?, onResult: (AuthResult) -> Unit) {
        val result = googleProvider.handleSignInResult(intent)
        onResult(result)
    }
    
    override suspend fun signInWithGitHub(context: Context): AuthResult {
        throw UnsupportedOperationException("Use signInWithGitHub(context, activityLauncher) instead")
    }
    
    suspend fun signInWithGitHub(
        context: Context,
        activityLauncher: ActivityResultLauncher<Intent>
    ): AuthResult {
        return githubProvider.signIn(context, activityLauncher)
    }
    
    suspend fun handleGitHubCallback(intent: Intent, backendExchangeUrl: String): AuthResult {
        return githubProvider.handleAuthorizationResponse(intent, backendExchangeUrl)
    }
}
