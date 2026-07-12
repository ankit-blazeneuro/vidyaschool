import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import com.vidyaschool.shared.auth.SharedAuthViewModel
import com.vidyaschool.shared.auth.SharedAuthState
import com.vidyaschool.shared.session.SessionStorage

fun main() = application {
    val windowState = rememberWindowState(width = 800.dp, height = 600.dp)
    
    val sessionStorage = remember { SessionStorage() }
    val sharedViewModel = remember { SharedAuthViewModel(sessionStorage) }
    
    val authState by sharedViewModel.authState.collectAsState()
    val currentUser by sharedViewModel.currentUser.collectAsState()
    
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    
    // Check session on startup
    LaunchedEffect(Unit) {
        sharedViewModel.checkSession()
    }
    
    Window(
        onCloseRequest = ::exitApplication,
        state = windowState,
        title = "VidyaSchool Desktop Manager"
    ) {
        MaterialTheme(
            colorScheme = darkColorScheme(
                primary = Color.White,
                background = Color(0xFF09090B),
                surface = Color(0xFF18181B),
                onBackground = Color.White,
                onSurface = Color.White
            )
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF09090B))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                when (val state = authState) {
                    is SharedAuthState.Loading -> {
                        CircularProgressIndicator(color = Color.White)
                    }
                    is SharedAuthState.LoggedIn -> {
                        Card(
                            modifier = Modifier.width(450.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF18181B))
                        ) {
                            Column(
                                modifier = Modifier.padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "Welcome to VidyaSchool",
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Logged in as ${currentUser?.name ?: state.user.email}",
                                    fontSize = 16.sp,
                                    color = Color(0xFFA1A1AA)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                Box(
                                    modifier = Modifier
                                        .background(
                                            color = when (state.user.role.lowercase()) {
                                                "admin" -> Color(0xFFEF4444)
                                                "teacher" -> Color(0xFF6366F1)
                                                else -> Color(0xFF22C55E)
                                            },
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = state.user.role.uppercase(),
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.White,
                                        fontSize = 12.sp
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(32.dp))
                                Button(
                                    onClick = { sharedViewModel.logout() },
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black)
                                ) {
                                    Text("Logout", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                    else -> {
                        Card(
                            modifier = Modifier.width(400.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF18181B))
                        ) {
                            Column(
                                modifier = Modifier.padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "VidyaSchool",
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Desktop Administration",
                                    fontSize = 14.sp,
                                    color = Color(0xFF71717A)
                                )
                                
                                Spacer(modifier = Modifier.height(32.dp))
                                
                                OutlinedTextField(
                                    value = email,
                                    onValueChange = { email = it },
                                    label = { Text("Email") },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color.White,
                                        unfocusedBorderColor = Color(0xFF27272A),
                                        focusedLabelColor = Color.White
                                    )
                                )
                                
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                OutlinedTextField(
                                    value = password,
                                    onValueChange = { password = it },
                                    label = { Text("Password") },
                                    visualTransformation = PasswordVisualTransformation(),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color.White,
                                        unfocusedBorderColor = Color(0xFF27272A),
                                        focusedLabelColor = Color.White
                                    )
                                )
                                
                                if (state is SharedAuthState.Error) {
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = state.message,
                                        color = Color(0xFFEF4444),
                                        fontSize = 12.sp
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(32.dp))
                                
                                Button(
                                    onClick = {
                                        sharedViewModel.loginWithEmail(email, password)
                                    },
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black)
                                ) {
                                    Text("Sign In", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
