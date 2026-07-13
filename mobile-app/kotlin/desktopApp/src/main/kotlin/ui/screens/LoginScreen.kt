package ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.shared.auth.SharedAuthViewModel
import com.vidyaschool.shared.auth.SharedAuthState
import com.vidyaschool.shared.models.LoginRequest
import com.vidyaschool.shared.models.CreateSessionRequest
import com.vidyaschool.shared.network.ApiClient
import ui.components.BottomDrawer
import ui.components.CustomTextField
import ui.components.PrimaryButton
import ui.components.SecondaryButton
import kotlinx.coroutines.launch

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LoginScreen(
    viewModel: SharedAuthViewModel,
    onBackClick: () -> Unit,
    onLoginSuccess: (String, String, String?, String, String?, String?, String?) -> Unit,
    onSignupClick: () -> Unit = {},
    showToast: (String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    val authState by viewModel.authState.collectAsState()
    val apiClient = remember { ApiClient() }

    // Handle auth state changes from SharedAuthViewModel
    LaunchedEffect(authState) {
        when (val state = authState) {
            is SharedAuthState.LoggedIn -> {
                val user = state.user
                showToast("Signed in as ${user.name ?: user.email}")
                onLoginSuccess(
                    user.provider,
                    user.email,
                    user.name,
                    user.role,
                    user.avatarUrl,
                    user.sessionToken,
                    user.studentClass
                )
                viewModel.resetError()
            }
            is SharedAuthState.Error -> {
                showToast(state.message)
                viewModel.resetError()
            }
            else -> {}
        }
    }

    val handleLogin: () -> Unit = {
        if (email.isBlank() || password.isBlank()) {
            showToast("Please enter email and password")
        } else {
            isLoading = true
            scope.launch {
                try {
                    val response = apiClient.login(LoginRequest(email, password))
                    var sessionToken = response.token ?: response.session?.token
                    val user = response.user

                    if (user != null) {
                        if (sessionToken.isNullOrEmpty()) {
                            try {
                                val sessResp = apiClient.createSession(CreateSessionRequest(user.email))
                                if (sessResp.success) {
                                    sessionToken = sessResp.session?.token
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }

                        var role = user.role ?: "student"
                        var avatarUrl = user.image
                        var studentClass: String? = null

                        try {
                            val roleResponse = apiClient.getUserRole(user.email)
                            role = roleResponse.role
                            avatarUrl = roleResponse.image ?: avatarUrl
                            studentClass = roleResponse.studentClass
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }

                        showToast("Login successful!")
                        onLoginSuccess("Email", user.email, user.name, role, avatarUrl, sessionToken, studentClass)
                    } else {
                        showToast(response.message ?: "Login failed")
                    }
                } catch (e: Exception) {
                    showToast("Network error: ${e.message}")
                } finally {
                    isLoading = false
                }
            }
        }
    }

    val handleSocialMock: (String) -> Unit = { provider ->
        isLoading = true
        scope.launch {
            try {
                // For desktop evaluation, continue with Google/GitHub logs into a mock admin or student account
                val mockEmail = if (provider == "Google") "work.ankit.mail@gmail.com" else "student@vidya.com"
                val mockName = if (provider == "Google") "Ankit (Google)" else "Student (GitHub)"
                val mockAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                
                // Call SharedAuthViewModel to generate a real session in the background
                viewModel.createSocialSession(
                    email = mockEmail,
                    name = mockName,
                    avatarUrl = mockAvatar,
                    provider = provider.lowercase()
                )
            } catch (e: Exception) {
                showToast("Social login failed: ${e.message}")
            } finally {
                isLoading = false
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 450.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Vidya School",
                fontSize = 28.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )
        }

        BottomDrawer(
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            val scrollState = rememberScrollState()
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(scrollState)
            ) {
                Text(
                    text = "Welcome back",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                CustomTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = "Email",
                    placeholder = "e.g. you@school.edu",
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                CustomTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Password",
                    placeholder = "Enter your password",
                    isPassword = true,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))

                PrimaryButton(
                    text = "Login",
                    onClick = handleLogin,
                    loading = isLoading || authState is SharedAuthState.Loading,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Divider(modifier = Modifier.weight(1f))
                    Text(
                        text = "OR",
                        fontSize = 12.sp,
                        color = Color(0xFF71717A),
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )
                    Divider(modifier = Modifier.weight(1f))
                }

                SecondaryButton(
                    text = "Continue with Google",
                    onClick = { handleSocialMock("Google") },
                    loading = isLoading || authState is SharedAuthState.Loading,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                SecondaryButton(
                    text = "Continue with GitHub",
                    onClick = { handleSocialMock("GitHub") },
                    loading = isLoading || authState is SharedAuthState.Loading,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                val annotatedString = buildAnnotatedString {
                    append("Don't have an account? ")
                    pushStringAnnotation(tag = "signup", annotation = "signup")
                    withStyle(
                        style = SpanStyle(
                            textDecoration = TextDecoration.Underline,
                            fontWeight = FontWeight.Medium
                        )
                    ) {
                        append("Create Account")
                    }
                    pop()
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSignupClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = annotatedString,
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontSize = 12.sp,
                            color = Color(0xFF71717A),
                            textAlign = TextAlign.Center
                        ),
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            }
        }
    }
}
