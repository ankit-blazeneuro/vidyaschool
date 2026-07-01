package com.vidyaschool.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.core.view.WindowCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.auth.provider.GoogleAuthProvider
import com.vidyaschool.app.auth.provider.GitHubAuthProvider
import com.vidyaschool.app.auth.repository.AuthRepositoryImpl
import com.vidyaschool.app.auth.viewmodel.AuthViewModel
import com.vidyaschool.app.ui.screens.LoginScreen
import com.vidyaschool.app.ui.screens.StudentScreen
import com.vidyaschool.app.ui.screens.WelcomeScreen
import com.vidyaschool.app.ui.screens.TeacherScreen
import com.vidyaschool.app.ui.screens.AccountsScreen
import com.vidyaschool.app.ui.screens.LibraryHubScreen
import com.vidyaschool.app.ui.screens.AdminScreen
import com.vidyaschool.app.ui.theme.VidyaSchoolTheme

class MainActivity : ComponentActivity() {
    private lateinit var viewModel: AuthViewModel
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        sessionManager = SessionManager(this)
        
        val googleProvider = GoogleAuthProvider(webClientId = "841705301007-pv1r9dtukce7jg9ag6aa8ogi4f7aveon.apps.googleusercontent.com")
        val githubProvider = GitHubAuthProvider(
            clientId = "Ov23liiWAPanaeBfTfnw",
            redirectUri = "com.vidyaschool.app:/oauth/github/callback"
        )
        val authRepository = AuthRepositoryImpl(googleProvider, githubProvider)
        viewModel = AuthViewModel(authRepository)
        
        intent?.let { handleIntent(it) }
        
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContent {
            VidyaSchoolApp(viewModel, sessionManager)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        val uri = intent.data
        if (uri != null && uri.scheme == "com.vidyaschool.app") {
            viewModel.handleGitHubCallback(intent)
        }
    }
}

@Composable
fun VidyaSchoolApp(viewModel: AuthViewModel, sessionManager: SessionManager) {
    var themeMode by remember { mutableStateOf(sessionManager.getThemeMode()) }
    val isDarkTheme = when (themeMode) {
        "light" -> false
        "dark" -> true
        else -> isSystemInDarkTheme()
    }
    
    VidyaSchoolTheme(darkTheme = isDarkTheme) {
        val navController = rememberNavController()
        
        val startDestination = if (sessionManager.isLoggedIn()) {
            val role = sessionManager.getRole() ?: "student"
            when (role.lowercase()) {
                "admin" -> "admin"
                "teacher" -> "teacher"
                "accounts", "account" -> "accounts"
                else -> "student"
            }
        } else {
            "welcome"
        }
        
        NavHost(navController = navController, startDestination = startDestination) {
            composable("welcome") {
                WelcomeScreen(
                    onLoginClick = { navController.navigate("login") },
                    onCreateAccountClick = { /* TODO */ }
                )
            }
            composable("login") {
                LoginScreen(
                    viewModel = viewModel,
                    onBackClick = { navController.popBackStack() },
                    onLoginSuccess = { provider, email, name, role, avatarUrl, sessionToken, studentClass ->
                        sessionManager.saveSession(provider, email, name, role, avatarUrl, sessionToken, studentClass)
                        val destination = when (role.lowercase()) {
                            "admin" -> "admin"
                            "teacher" -> "teacher"
                            "accounts", "account" -> "accounts"
                            else -> "student"
                        }
                        navController.navigate(destination) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("student") {
                StudentScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    studentClass = sessionManager.getStudentClass() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onShowLibrary = { navController.navigate("library") },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("library") {
                LibraryHubScreen(onBack = { navController.popBackStack() })
            }
            composable("teacher") {
                TeacherScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("accounts") {
                AccountsScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("admin") {
                AdminScreen(
                    provider = sessionManager.getProvider() ?: "",
                    email = sessionManager.getEmail() ?: "",
                    name = sessionManager.getName() ?: "",
                    avatarUrl = sessionManager.getAvatarUrl() ?: "",
                    themeMode = themeMode,
                    onThemeChange = { mode ->
                        sessionManager.setThemeMode(mode)
                        themeMode = mode
                    },
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
