package com.vidyaschool.app.auth.repository

import android.content.Context
import com.vidyaschool.app.auth.model.AuthResult

interface AuthRepository {
    suspend fun signInWithGoogle(context: Context): AuthResult
    suspend fun signInWithGitHub(context: Context): AuthResult
}
