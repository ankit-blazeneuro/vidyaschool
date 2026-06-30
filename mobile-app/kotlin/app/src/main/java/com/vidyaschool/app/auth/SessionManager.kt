package com.vidyaschool.app.auth

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("user_session", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_PROVIDER = "provider"
        private const val KEY_EMAIL = "email"
        private const val KEY_NAME = "name"
        private const val KEY_ROLE = "role"
        private const val KEY_AVATAR_URL = "avatar_url"
        private const val KEY_SESSION_TOKEN = "session_token"
        private const val KEY_THEME_MODE = "theme_mode"
        private const val KEY_STUDENT_CLASS = "student_class"
    }

    fun saveSession(provider: String, email: String, name: String?, role: String, avatarUrl: String? = null, sessionToken: String? = null, studentClass: String? = null) {
        prefs.edit().apply {
            putBoolean(KEY_IS_LOGGED_IN, true)
            putString(KEY_PROVIDER, provider)
            putString(KEY_EMAIL, email)
            putString(KEY_NAME, name)
            putString(KEY_ROLE, role)
            putString(KEY_AVATAR_URL, avatarUrl)
            putString(KEY_SESSION_TOKEN, sessionToken)
            putString(KEY_STUDENT_CLASS, studentClass)
            apply()
        }
    }

    fun setThemeMode(mode: String) {
        prefs.edit().putString(KEY_THEME_MODE, mode).apply()
    }

    fun getThemeMode(): String {
        return prefs.getString(KEY_THEME_MODE, "system") ?: "system"
    }

    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    }

    fun getProvider(): String? = prefs.getString(KEY_PROVIDER, null)
    fun getEmail(): String? = prefs.getString(KEY_EMAIL, null)
    fun getName(): String? = prefs.getString(KEY_NAME, null)
    fun getRole(): String? = prefs.getString(KEY_ROLE, null)
    fun getAvatarUrl(): String? = prefs.getString(KEY_AVATAR_URL, null)
    fun getSessionToken(): String? = prefs.getString(KEY_SESSION_TOKEN, null)
    fun getStudentClass(): String? = prefs.getString(KEY_STUDENT_CLASS, null)

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
