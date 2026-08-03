package com.vidyaschool.app.auth.repository

import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import com.vidyaschool.app.auth.model.AuthResult

interface AuthRepository {
    suspend fun signInWithGoogle(context: Context, activityLauncher: ActivityResultLauncher<Intent>): AuthResult
    suspend fun signInWithGitHub(context: Context, activityLauncher: ActivityResultLauncher<Intent>): AuthResult
}
