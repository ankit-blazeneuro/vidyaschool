package com.vidyaschool.app.auth

import android.content.Context
import android.content.SharedPreferences
import com.vidyaschool.app.api.TopPerformerItem
import org.json.JSONArray
import org.json.JSONObject

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
        private const val KEY_USERNAME = "username"
        private const val KEY_TOP_PERFORMERS_CACHE = "top_performers_cache"
    }

    fun saveSession(provider: String, email: String, name: String?, role: String, avatarUrl: String? = null, sessionToken: String? = null, studentClass: String? = null, username: String? = null) {
        prefs.edit().apply {
            putBoolean(KEY_IS_LOGGED_IN, true)
            putString(KEY_PROVIDER, provider)
            putString(KEY_EMAIL, email)
            putString(KEY_NAME, name)
            putString(KEY_ROLE, role)
            putString(KEY_AVATAR_URL, avatarUrl)
            putString(KEY_SESSION_TOKEN, sessionToken)
            putString(KEY_STUDENT_CLASS, studentClass)
            putString(KEY_USERNAME, username)
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
    fun getUsername(): String? = prefs.getString(KEY_USERNAME, null)

    fun saveTopPerformers(performers: List<TopPerformerItem>) {
        try {
            val array = JSONArray()
            performers.forEach { p ->
                val obj = JSONObject()
                obj.put("id", p.id ?: "")
                obj.put("name", p.name ?: "")
                obj.put("avatarUrl", p.avatarUrl ?: "")
                obj.put("studentClass", p.studentClass ?: "")
                obj.put("section", p.section ?: "")
                obj.put("percentage", p.percentage ?: 0.0)
                obj.put("rank", p.rank ?: 0)
                array.put(obj)
            }
            prefs.edit().putString(KEY_TOP_PERFORMERS_CACHE, array.toString()).apply()
        } catch (e: Exception) {
            android.util.Log.e("SessionManager", "Failed to cache top performers", e)
        }
    }

    fun getCachedTopPerformers(): List<TopPerformerItem> {
        val jsonStr = prefs.getString(KEY_TOP_PERFORMERS_CACHE, null) ?: return emptyList()
        return try {
            val array = JSONArray(jsonStr)
            val list = mutableListOf<TopPerformerItem>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(
                    TopPerformerItem(
                        id = obj.optString("id").ifEmpty { null },
                        name = obj.optString("name").ifEmpty { null },
                        avatarUrl = obj.optString("avatarUrl").ifEmpty { null },
                        studentClass = obj.optString("studentClass").ifEmpty { null },
                        section = obj.optString("section").ifEmpty { null },
                        percentage = if (obj.has("percentage")) obj.optDouble("percentage") else null,
                        rank = if (obj.has("rank")) obj.optInt("rank") else null
                    )
                )
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun updateOnboardingData(username: String, studentClass: String?) {
        prefs.edit().apply {
            putString(KEY_USERNAME, username)
            if (!studentClass.isNullOrEmpty()) {
                putString(KEY_STUDENT_CLASS, studentClass)
            }
            apply()
        }
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
