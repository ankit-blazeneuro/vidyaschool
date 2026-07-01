package com.vidyaschool.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
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
import com.vidyaschool.app.ui.screens.FeeReceiptScreen
import com.vidyaschool.app.ui.theme.VidyaSchoolTheme

import com.razorpay.PaymentResultWithDataListener
import com.razorpay.PaymentData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.VerifyPaymentRequest
import com.vidyaschool.app.api.PayFeesRequest

class MainActivity : AppCompatActivity(), PaymentResultWithDataListener {
    private lateinit var viewModel: AuthViewModel
    private lateinit var sessionManager: SessionManager

    // Pending Razorpay payment state
    var pendingInstallmentId: String = ""
    var pendingOrderId: String = ""
    var pendingIsMock: Boolean = false
    var onPaymentDone: (() -> Unit)? = null
    var onPaymentFailed: ((String) -> Unit)? = null

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
        com.razorpay.Checkout.preload(applicationContext)
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

    var pendingReceiptNo: String? = null

    private fun handleIntent(intent: Intent) {
        val uri = intent.data
        if (uri != null) {
            when {
                uri.scheme == "com.vidyaschool.app" -> viewModel.handleGitHubCallback(intent)
                uri.scheme == "https" && uri.host == "vidyaschool.vercel.app" && uri.path?.startsWith("/fee/payment/") == true -> {
                    pendingReceiptNo = uri.lastPathSegment
                }
            }
        }
    }

    override fun onPaymentSuccess(razorpayPaymentId: String?, paymentData: PaymentData?) {
        val paymentId = razorpayPaymentId ?: paymentData?.paymentId ?: return
        val signature = paymentData?.signature ?: ""
        if (pendingInstallmentId.isEmpty()) return
        val installmentId = pendingInstallmentId
        val orderId = pendingOrderId
        val isMock = pendingIsMock
        pendingInstallmentId = ""; pendingOrderId = ""; pendingIsMock = false
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val token = sessionManager.getSessionToken() ?: return@launch
                if (isMock) {
                    // No real order_id — just mark paid directly
                    RetrofitClient.authApi.payFees(
                        authHeader = "Bearer $token",
                        request = PayFeesRequest(installmentIds = listOf(installmentId), paymentMethod = "Razorpay")
                    )
                } else {
                    RetrofitClient.authApi.verifyPayment(
                        authHeader = "Bearer $token",
                        request = VerifyPaymentRequest(
                            orderId = orderId,
                            paymentId = paymentId,
                            signature = signature,
                            installmentIds = listOf(installmentId)
                        )
                    )
                }
            } catch (e: Exception) {
                android.util.Log.e("Razorpay", "Post-payment failed: ${e.message}")
            } finally {
                onPaymentDone?.invoke()
                onPaymentDone = null
            }
        }
    }

    override fun onPaymentError(code: Int, response: String?, paymentData: PaymentData?) {
        pendingInstallmentId = ""
        pendingOrderId = ""
        pendingIsMock = false
        val message = when (code) {
            0 -> "Payment cancelled"
            1 -> "Payment failed. Please try again."
            2 -> "Network error. Check your connection."
            else -> "Payment failed. Please try again."
        }
        onPaymentFailed?.invoke(message)
        onPaymentFailed = null
        onPaymentDone = null
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
    val context = androidx.compose.ui.platform.LocalContext.current

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

        // Handle deep link receipt after nav is ready
        androidx.compose.runtime.LaunchedEffect(Unit) {
            val activity = context as? MainActivity
            val receiptNo = activity?.pendingReceiptNo
            if (!receiptNo.isNullOrEmpty()) {
                activity.pendingReceiptNo = null
                navController.navigate("feeReceipt/$receiptNo")
            }
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
            composable("feeReceipt/{receiptNo}") { backStackEntry ->
                val receiptNo = backStackEntry.arguments?.getString("receiptNo") ?: ""
                FeeReceiptScreen(receiptNo = receiptNo, onBack = { navController.popBackStack() })
            }
        }
    }
}
