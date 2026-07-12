package com.vidyaschool.shared.auth

import com.vidyaschool.shared.models.AppUser
import com.vidyaschool.shared.models.AuthResult
import com.vidyaschool.shared.models.CreateSessionRequest
import com.vidyaschool.shared.models.LoginRequest
import com.vidyaschool.shared.network.ApiClient
import com.vidyaschool.shared.session.SessionStorage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Shared authentication ViewModel.
 *
 * Manages email/password login, session verification, logout, and
 * exposes state as [StateFlow] for both Android Compose and iOS SwiftUI.
 *
 * On Android, use inside an AndroidX ViewModel wrapper or directly inject
 * via a ViewModel factory that forwards the platform [SessionStorage].
 */
class SharedAuthViewModel(
    private val sessionStorage: SessionStorage,
    private val apiClient: ApiClient = ApiClient()
) {
    private val viewModelScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    private val _authState = MutableStateFlow<SharedAuthState>(SharedAuthState.Idle)
    val authState: StateFlow<SharedAuthState> = _authState.asStateFlow()

    private val _currentUser = MutableStateFlow<AppUser?>(null)
    val currentUser: StateFlow<AppUser?> = _currentUser.asStateFlow()

    // -----------------------------------------------------------------------
    // Initialisation — called on app launch
    // -----------------------------------------------------------------------

    fun checkSession() {
        if (!sessionStorage.isLoggedIn()) {
            _authState.value = SharedAuthState.LoggedOut
            return
        }

        val token = sessionStorage.getSessionToken()
        if (token.isNullOrBlank()) {
            // No token → restore from stored fields directly
            restoreUserFromStorage()
            return
        }

        viewModelScope.launch {
            _authState.value = SharedAuthState.Loading
            try {
                val response = apiClient.verifySession(token)
                if (response.valid) {
                    val user = AppUser(
                        email = sessionStorage.getEmail() ?: "",
                        name = response.name ?: sessionStorage.getName(),
                        role = response.role ?: sessionStorage.getRole() ?: "student",
                        avatarUrl = response.image ?: sessionStorage.getAvatarUrl(),
                        sessionToken = token,
                        studentClass = response.studentClass ?: sessionStorage.getStudentClass(),
                        username = response.username ?: sessionStorage.getUsername(),
                        provider = sessionStorage.getProvider() ?: "email"
                    )
                    // Refresh persisted data with latest server values
                    sessionStorage.saveSession(
                        provider = user.provider,
                        email = user.email,
                        name = user.name,
                        role = user.role,
                        avatarUrl = user.avatarUrl,
                        sessionToken = token,
                        studentClass = user.studentClass,
                        username = user.username
                    )
                    _currentUser.value = user
                    _authState.value = SharedAuthState.LoggedIn(user)
                } else {
                    sessionStorage.clearSession()
                    _authState.value = SharedAuthState.LoggedOut
                }
            } catch (e: Exception) {
                // Network failure → fall back to cached data
                restoreUserFromStorage()
            }
        }
    }

    // -----------------------------------------------------------------------
    // Email / password login
    // -----------------------------------------------------------------------

    fun loginWithEmail(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = SharedAuthState.Loading
            try {
                val response = apiClient.login(LoginRequest(email, password))
                val token = response.session?.token ?: response.token
                val user = response.user
                if (user != null) {
                    val appUser = AppUser(
                        email = user.email,
                        name = user.name,
                        role = user.role ?: "student",
                        avatarUrl = user.image,
                        sessionToken = token,
                        studentClass = null,
                        username = null,
                        provider = "email"
                    )
                    sessionStorage.saveSession(
                        provider = "email",
                        email = user.email,
                        name = user.name,
                        role = user.role ?: "student",
                        avatarUrl = user.image,
                        sessionToken = token,
                        studentClass = null,
                        username = null
                    )
                    _currentUser.value = appUser
                    _authState.value = SharedAuthState.LoggedIn(appUser)
                } else {
                    _authState.value = SharedAuthState.Error(
                        response.message ?: "Login failed"
                    )
                }
            } catch (e: Exception) {
                _authState.value = SharedAuthState.Error(e.message ?: "Network error")
            }
        }
    }

    // -----------------------------------------------------------------------
    // Social auth session creation (Google / GitHub token → backend session)
    // -----------------------------------------------------------------------

    /**
     * Called after a successful Google / GitHub sign-in on the platform side.
     * Creates a backend session using [email] and fetches the user role.
     */
    fun createSocialSession(
        email: String,
        name: String?,
        avatarUrl: String?,
        provider: String
    ) {
        viewModelScope.launch {
            _authState.value = SharedAuthState.Loading
            try {
                // Create backend session
                val sessionResp = apiClient.createSession(CreateSessionRequest(email))
                val sessionToken = sessionResp.session?.token

                // Fetch role
                val roleResp = apiClient.getUserRole(email)

                val appUser = AppUser(
                    email = email,
                    name = name ?: roleResp.name,
                    role = roleResp.role,
                    avatarUrl = avatarUrl ?: roleResp.image,
                    sessionToken = sessionToken,
                    studentClass = roleResp.studentClass,
                    username = null,
                    provider = provider
                )
                sessionStorage.saveSession(
                    provider = provider,
                    email = email,
                    name = appUser.name,
                    role = appUser.role,
                    avatarUrl = appUser.avatarUrl,
                    sessionToken = sessionToken,
                    studentClass = appUser.studentClass,
                    username = null
                )
                _currentUser.value = appUser
                _authState.value = SharedAuthState.LoggedIn(appUser)
            } catch (e: Exception) {
                _authState.value = SharedAuthState.Error(e.message ?: "Social login error")
            }
        }
    }

    // -----------------------------------------------------------------------
    // Logout
    // -----------------------------------------------------------------------

    fun logout() {
        sessionStorage.clearSession()
        _currentUser.value = null
        _authState.value = SharedAuthState.LoggedOut
    }

    fun resetError() {
        _authState.value = SharedAuthState.Idle
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private fun restoreUserFromStorage() {
        val email = sessionStorage.getEmail()
        if (email.isNullOrBlank()) {
            _authState.value = SharedAuthState.LoggedOut
            return
        }
        val appUser = AppUser(
            email = email,
            name = sessionStorage.getName(),
            role = sessionStorage.getRole() ?: "student",
            avatarUrl = sessionStorage.getAvatarUrl(),
            sessionToken = sessionStorage.getSessionToken(),
            studentClass = sessionStorage.getStudentClass(),
            username = sessionStorage.getUsername(),
            provider = sessionStorage.getProvider() ?: "email"
        )
        _currentUser.value = appUser
        _authState.value = SharedAuthState.LoggedIn(appUser)
    }
}

// ---------------------------------------------------------------------------
// State ADT
// ---------------------------------------------------------------------------

sealed class SharedAuthState {
    object Idle : SharedAuthState()
    object Loading : SharedAuthState()
    object LoggedOut : SharedAuthState()
    data class LoggedIn(val user: AppUser) : SharedAuthState()
    data class Error(val message: String) : SharedAuthState()
}

/** Convenience type alias for use in AuthResult context */
typealias AuthResultCallback = (AuthResult) -> Unit
