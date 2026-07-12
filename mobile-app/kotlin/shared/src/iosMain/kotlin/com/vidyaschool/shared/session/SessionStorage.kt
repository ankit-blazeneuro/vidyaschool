package com.vidyaschool.shared.session

import com.russhwolf.settings.NSUserDefaultsSettings
import com.russhwolf.settings.Settings
import platform.Foundation.NSUserDefaults

/**
 * iOS actual implementation of [SessionStorage].
 *
 * Backed by NSUserDefaults via the multiplatform-settings library.
 */
actual class SessionStorage actual constructor() {

    private val settings: Settings =
        NSUserDefaultsSettings(NSUserDefaults.standardUserDefaults)

    companion object {
        private const val KEY_IS_LOGGED_IN  = "is_logged_in"
        private const val KEY_PROVIDER      = "provider"
        private const val KEY_EMAIL         = "email"
        private const val KEY_NAME          = "name"
        private const val KEY_ROLE          = "role"
        private const val KEY_AVATAR_URL    = "avatar_url"
        private const val KEY_SESSION_TOKEN = "session_token"
        private const val KEY_STUDENT_CLASS = "student_class"
        private const val KEY_USERNAME      = "username"
        private const val KEY_THEME_MODE    = "theme_mode"
    }

    actual fun saveSession(
        provider: String,
        email: String,
        name: String?,
        role: String,
        avatarUrl: String?,
        sessionToken: String?,
        studentClass: String?,
        username: String?
    ) {
        settings.putBoolean(KEY_IS_LOGGED_IN, true)
        settings.putString(KEY_PROVIDER, provider)
        settings.putString(KEY_EMAIL, email)
        settings.putString(KEY_NAME, name ?: "")
        settings.putString(KEY_ROLE, role)
        settings.putString(KEY_AVATAR_URL, avatarUrl ?: "")
        settings.putString(KEY_SESSION_TOKEN, sessionToken ?: "")
        settings.putString(KEY_STUDENT_CLASS, studentClass ?: "")
        settings.putString(KEY_USERNAME, username ?: "")
    }

    actual fun isLoggedIn(): Boolean = settings.getBoolean(KEY_IS_LOGGED_IN, false)

    actual fun getProvider(): String? = settings.getStringOrNull(KEY_PROVIDER)
    actual fun getEmail(): String?    = settings.getStringOrNull(KEY_EMAIL)
    actual fun getName(): String?     = settings.getStringOrNull(KEY_NAME)?.ifBlank { null }
    actual fun getRole(): String?     = settings.getStringOrNull(KEY_ROLE)
    actual fun getAvatarUrl(): String? =
        settings.getStringOrNull(KEY_AVATAR_URL)?.ifBlank { null }
    actual fun getSessionToken(): String? =
        settings.getStringOrNull(KEY_SESSION_TOKEN)?.ifBlank { null }
    actual fun getStudentClass(): String? =
        settings.getStringOrNull(KEY_STUDENT_CLASS)?.ifBlank { null }
    actual fun getUsername(): String? =
        settings.getStringOrNull(KEY_USERNAME)?.ifBlank { null }

    actual fun getThemeMode(): String =
        settings.getString(KEY_THEME_MODE, "system")

    actual fun setThemeMode(mode: String) {
        settings.putString(KEY_THEME_MODE, mode)
    }

    actual fun updateOnboardingData(username: String, studentClass: String?) {
        settings.putString(KEY_USERNAME, username)
        if (!studentClass.isNullOrEmpty()) {
            settings.putString(KEY_STUDENT_CLASS, studentClass)
        }
    }

    actual fun clearSession() = settings.clear()
}
