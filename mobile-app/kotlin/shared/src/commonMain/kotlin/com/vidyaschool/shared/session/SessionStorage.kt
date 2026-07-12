package com.vidyaschool.shared.session

/**
 * Platform-agnostic session storage contract.
 *
 * Android actual → multiplatform-settings backed by SharedPreferences
 * iOS actual     → multiplatform-settings backed by NSUserDefaults
 */
expect class SessionStorage() {

    /** Persist all session data after a successful login. */
    fun saveSession(
        provider: String,
        email: String,
        name: String?,
        role: String,
        avatarUrl: String?,
        sessionToken: String?,
        studentClass: String?,
        username: String?
    )

    fun isLoggedIn(): Boolean
    fun getProvider(): String?
    fun getEmail(): String?
    fun getName(): String?
    fun getRole(): String?
    fun getAvatarUrl(): String?
    fun getSessionToken(): String?
    fun getStudentClass(): String?
    fun getUsername(): String?

    /** Returns "system" | "dark" | "light" */
    fun getThemeMode(): String
    fun setThemeMode(mode: String)

    /** Update username / class after onboarding completes. */
    fun updateOnboardingData(username: String, studentClass: String?)

    /** Wipe all session data on logout. */
    fun clearSession()
}
