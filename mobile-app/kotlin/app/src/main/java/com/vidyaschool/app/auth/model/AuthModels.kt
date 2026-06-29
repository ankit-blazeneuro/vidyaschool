package com.vidyaschool.app.auth.model

sealed class AuthResult {
    data class Success(
        val token: String,
        val provider: AuthProvider,
        val userInfo: UserInfo
    ) : AuthResult()
    
    data class Error(val message: String, val cause: Throwable? = null) : AuthResult()
    object Cancelled : AuthResult()
}

enum class AuthProvider {
    GOOGLE, GITHUB
}

data class UserInfo(
    val id: String,
    val email: String,
    val name: String?,
    val avatarUrl: String?
)
