package com.vidyaschool.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.MaterialTheme
import androidx.compose.foundation.isSystemInDarkTheme
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.ui.components.CustomTextField
import coil.compose.AsyncImage
import com.vidyaschool.app.api.FeeInstallment
import com.vidyaschool.app.api.PayFeesRequest
import com.vidyaschool.app.api.PayFeesResponse
import kotlinx.coroutines.launch
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardLayout(
    role: String,
    provider: String,
    email: String,
    name: String,
    avatarUrl: String? = null,
    themeMode: String = "system",
    onThemeChange: (String) -> Unit,
    onLogout: () -> Unit,
    homeContent: @Composable () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    
    val currentRole = remember { mutableStateOf(role) }
    val currentName = remember { mutableStateOf(name) }
    val currentAvatarUrl = remember { mutableStateOf(avatarUrl) }
    
    var selectedTab by remember { mutableStateOf("home") }
    var isRefreshing by remember { mutableStateOf(false) }
    
    val triggerRefresh: () -> Unit = {
        isRefreshing = true
        scope.launch {
            try {
                val sessionToken = sessionManager.getSessionToken()
                var sessionVerified = false
                
                if (!sessionToken.isNullOrEmpty()) {
                    try {
                        val verifyResponse = RetrofitClient.authApi.verifySession(sessionToken)
                        if (verifyResponse.isSuccessful) {
                            val verifyBody = verifyResponse.body()
                            if (verifyBody != null) {
                                sessionVerified = true
                                if (verifyBody.valid) {
                                    currentRole.value = verifyBody.role ?: currentRole.value
                                    currentName.value = verifyBody.name ?: currentName.value
                                    currentAvatarUrl.value = verifyBody.image ?: currentAvatarUrl.value
                                    sessionManager.saveSession(
                                        provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken
                                    )
                                } else {
                                    // Session is invalid/revoked! Logout immediately
                                    onLogout()
                                    return@launch
                                }
                            }
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("DashboardLayout", "Verify session failed: ${e.message}")
                    }
                }
                
                if (!sessionVerified) {
                    val response = RetrofitClient.authApi.getUserRole(email)
                    if (response.isSuccessful) {
                        val body = response.body()
                        if (body != null) {
                            currentRole.value = body.role
                            currentName.value = body.name ?: currentName.value
                            currentAvatarUrl.value = body.image ?: currentAvatarUrl.value
                            sessionManager.saveSession(
                                provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken
                            )
                        }
                    } else {
                        // Local fallback for quick testing before deploying backend changes
                        val localRole = when (email) {
                            "work.ankit.mail@gmail.com" -> "admin"
                            "admin@vidya.com" -> "admin"
                            "teacher@vidya.com" -> "teacher"
                            "accounts@vidya.com" -> "accounts"
                            else -> currentRole.value
                        }
                        currentRole.value = localRole
                        sessionManager.saveSession(
                            provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken
                        )
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("DashboardLayout", "Refresh failed: ${e.message}")
            } finally {
                isRefreshing = false
            }
        }
    }
    
    Scaffold(
        bottomBar = {
            Column(
                modifier = Modifier.background(MaterialTheme.colorScheme.surface)
            ) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outline, thickness = 1.dp)
                Spacer(modifier = Modifier.height(4.dp))
                NavigationBar(
                    modifier = Modifier.height(70.dp),
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 0.dp
                ) {
                    val navItemColors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MaterialTheme.colorScheme.primary,
                        selectedTextColor = MaterialTheme.colorScheme.primary,
                        unselectedIconColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        unselectedTextColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        indicatorColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                    )
                    NavigationBarItem(
                        selected = selectedTab == "home",
                        onClick = { selectedTab = "home" },
                        label = { Text("Home", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                        icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_home), contentDescription = "Home", modifier = Modifier.size(22.dp)) },
                        colors = navItemColors
                    )
                    NavigationBarItem(
                        selected = selectedTab == "notice",
                        onClick = { selectedTab = "notice" },
                        label = { Text("Notice", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                        icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_notice), contentDescription = "Notice", modifier = Modifier.size(22.dp)) },
                        colors = navItemColors
                    )
                    if (currentRole.value.equals("student", ignoreCase = true)) {
                        NavigationBarItem(
                            selected = selectedTab == "fees",
                            onClick = { selectedTab = "fees" },
                            label = { Text("Pay Fees", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                            icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_pay_fees), contentDescription = "Pay Fees", modifier = Modifier.size(22.dp)) },
                            colors = navItemColors
                        )
                    } else {
                        NavigationBarItem(
                            selected = selectedTab == "community",
                            onClick = { selectedTab = "community" },
                            label = { Text("Community", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                            icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_community), contentDescription = "Community", modifier = Modifier.size(22.dp)) },
                            colors = navItemColors
                        )
                    }
                    NavigationBarItem(
                        selected = selectedTab == "search",
                        onClick = { selectedTab = "search" },
                        label = { Text("Search", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                        icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_search), contentDescription = "Search", modifier = Modifier.size(22.dp)) },
                        colors = navItemColors
                    )
                    NavigationBarItem(
                        selected = selectedTab == "profile",
                        onClick = { selectedTab = "profile" },
                        label = { Text("Profile", fontSize = 10.sp, maxLines = 1, softWrap = false) },
                        icon = { Icon(painter = painterResource(id = R.drawable.ic_custom_profile), contentDescription = "Profile", modifier = Modifier.size(22.dp)) },
                        colors = navItemColors
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding())
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (selectedTab) {
                "home" -> {
                    PullToRefreshBox(
                        isRefreshing = isRefreshing,
                        onRefresh = triggerRefresh,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        homeContent()
                    }
                }
                "notice" -> {
                    NoticeTabContent(
                        isRefreshing = isRefreshing,
                        onRefresh = triggerRefresh
                    )
                }
                "community" -> {
                    CommunityTabContent(
                        role = currentRole.value,
                        isRefreshing = isRefreshing,
                        onRefresh = triggerRefresh
                    )
                }
                "fees" -> {
                    FeesTabContent(
                        sessionManager = sessionManager,
                        isRefreshing = isRefreshing,
                        onRefresh = triggerRefresh
                    )
                }
                "search" -> {
                    SearchTabContent(
                        isRefreshing = isRefreshing,
                        onRefresh = triggerRefresh
                    )
                }
                "profile" -> {
                    ProfileTabContent(
                        role = currentRole.value,
                        provider = provider,
                        email = email,
                        name = currentName.value,
                        avatarUrl = currentAvatarUrl.value,
                        themeMode = themeMode,
                        onThemeChange = onThemeChange,
                        isRefreshing = isRefreshing,
                        onRefresh = triggerRefresh,
                        onLogout = onLogout
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchTabContent(
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    
    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 24.dp)
        ) {
            Text(
                text = "Search Users",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(16.dp))
            
            CustomTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = "Search by name or username..."
            )
            Spacer(modifier = Modifier.height(24.dp))
            
            val mockUsers = listOf(
                Pair("John Doe", "Student"),
                Pair("Sarah Connor", "Teacher"),
                Pair("Geeta Rao", "Accounts"),
                Pair("Vikram Singh", "Admin")
            )
            
            val filteredUsers = mockUsers.filter { 
                it.first.lowercase().contains(searchQuery.lowercase()) || 
                it.second.lowercase().contains(searchQuery.lowercase())
            }
            
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (filteredUsers.isEmpty()) {
                    item {
                        Text(
                            text = "No results found",
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                            modifier = Modifier.padding(top = 16.dp)
                        )
                    }
                } else {
                    items(filteredUsers.size) { index ->
                        val user = filteredUsers[index]
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = user.first.first().toString().uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Text(
                                        text = user.first,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = user.second,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileTabContent(
    role: String,
    provider: String,
    email: String,
    name: String,
    avatarUrl: String?,
    themeMode: String,
    onThemeChange: (String) -> Unit,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onLogout: () -> Unit
) {
    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "My Profile",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(24.dp))
            
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    if (!avatarUrl.isNullOrEmpty()) {
                        AsyncImage(
                            model = avatarUrl,
                            contentDescription = "Profile Picture",
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = name.firstOrNull()?.uppercase() ?: "?",
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text(
                        text = name,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = email,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    ProfileDetailRow(label = "Role", value = role.uppercase())
                    ProfileDetailRow(label = "Provider", value = provider.uppercase())
                    ProfileDetailRow(label = "Status", value = "Active Session")
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(
                    modifier = Modifier.padding(18.dp)
                ) {
                    Text(
                        text = "App Theme",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("System" to "system", "Light" to "light", "Dark" to "dark").forEach { (label, value) ->
                            val isSelected = themeMode == value
                            Button(
                                onClick = { onThemeChange(value) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
                                    contentColor = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                                ),
                                contentPadding = PaddingValues(vertical = 8.dp)
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = onLogout,
                modifier = Modifier
                    .fillMaxWidth(0.8f)
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text(
                    text = "Logout",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
fun ProfileDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoticeTabContent(
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    val notices = listOf(
        Triple("Summer Vacation Announcement", "Summer vacation will commence from July 1st to August 15th. School will reopen on August 16th.", "2026-06-25"),
        Triple("Annual Sports Day 2026", "Join us for the Annual Sports Day on July 10th at the main ground. Events start at 8:00 AM.", "2026-06-20"),
        Triple("Fee Payment Deadline Extended", "The last date for second-term fee payment has been extended to July 5th without late fee.", "2026-06-18"),
        Triple("Science Exhibition Registrations", "Registrations are open for the upcoming Science Exhibition. Contact your class teacher before June 30th.", "2026-06-15")
    )
    
    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 24.dp)
        ) {
            Text(
                text = "Notice Board",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(16.dp))
            
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(notices.size) { index ->
                    val notice = notices[index]
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .background(
                                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "Official",
                                        color = MaterialTheme.colorScheme.primary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Text(
                                    text = notice.third,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = notice.first,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = notice.second,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                                lineHeight = 20.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityTabContent(
    role: String,
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    val posts = listOf(
        Triple("Amit Sharma", "Has anyone finished the Math assignment? I'm stuck on question 5.", "2 hours ago"),
        Triple("Priya Patel", "Congratulations to the basketball team for winning the inter-school championship! 🏆", "5 hours ago"),
        Triple("Rahul Verma", "Looking for classmates interested in joining the Coding Club. Meet up tomorrow at library.", "1 day ago")
    )
    
    var newPostText by remember { mutableStateOf("") }
    
    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        if (role.equals("student", ignoreCase = true)) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Locked",
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Only for teachers and admin for now",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 24.dp)
            ) {
                Text(
                    text = "Community",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                // Post creation bar
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "M",
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Box(modifier = Modifier.weight(1f)) {
                            CustomTextField(
                                value = newPostText,
                                onValueChange = { newPostText = it },
                                placeholder = "Share something with the school..."
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(posts.size) { index ->
                        val post = posts[index]
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = post.first.first().toString(),
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.secondary
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = post.first,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = post.third,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = post.second,
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    lineHeight = 20.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeesTabContent(
    sessionManager: SessionManager,
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var installments by remember { mutableStateOf<List<FeeInstallment>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var isProcessingPayment by remember { mutableStateOf<String?>(null) }
    var paymentError by remember { mutableStateOf<String?>(null) }

    val fetchFees: () -> Unit = {
        isLoading = true
        scope.launch {
            try {
                val token = sessionManager.getSessionToken()
                if (!token.isNullOrEmpty()) {
                    val response = RetrofitClient.authApi.getMyFees("Bearer $token")
                    if (response.isSuccessful) installments = response.body() ?: emptyList()
                }
            } catch (e: Exception) {
                android.util.Log.e("FeesTabContent", "Error: ${e.message}")
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { fetchFees() }
    LaunchedEffect(isRefreshing) { if (isRefreshing) fetchFees() }

    val handlePayFee: (FeeInstallment) -> Unit = { inst ->
        isProcessingPayment = inst.id
        scope.launch {
            try {
                val token = sessionManager.getSessionToken() ?: return@launch
                val amountPaise = (inst.amount * 100).toInt()
                val orderResp = RetrofitClient.authApi.createOrder(
                    authHeader = "Bearer $token",
                    request = com.vidyaschool.app.api.CreateOrderRequest(
                        installmentIds = listOf(inst.id),
                        amount = amountPaise
                    )
                )
                if (!orderResp.isSuccessful || orderResp.body() == null) {
                    android.widget.Toast.makeText(context, "Order creation failed", android.widget.Toast.LENGTH_SHORT).show()
                    isProcessingPayment = null
                    return@launch
                }
                val order = orderResp.body()!!

                val activity = context as? com.vidyaschool.app.MainActivity ?: run { isProcessingPayment = null; return@launch }
                activity.pendingInstallmentId = inst.id
                activity.pendingOrderId = order.orderId ?: ""
                activity.pendingIsMock = order.mockPayment == true
                activity.onPaymentDone = {
                    isProcessingPayment = null
                    fetchFees()
                }
                activity.onPaymentFailed = { msg ->
                    isProcessingPayment = null
                    paymentError = msg
                }
                val checkout = com.razorpay.Checkout()
                checkout.setKeyID(order.keyId ?: "")
                val options = org.json.JSONObject().apply {
                    put("name", "Vidya School")
                    put("description", "Fee: ${inst.month} ${inst.year}")
                    put("amount", order.amount)
                    put("currency", order.currency ?: "INR")
                    if (order.mockPayment != true && !order.orderId.isNullOrEmpty()) {
                        put("order_id", order.orderId)
                    }
                    put("prefill", org.json.JSONObject().apply {
                        put("email", sessionManager.getEmail() ?: "")
                        put("contact", "9999999999")
                    })
                    put("theme", org.json.JSONObject().apply { put("color", "#6750A4") })
                    put("modal", org.json.JSONObject().apply {
                        put("confirm_close", false)
                        put("animation", false)
                    })
                }
                checkout.open(activity, options)
            } catch (e: Exception) {
                android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                isProcessingPayment = null
            }
        }
    }

    val scrollState = rememberScrollState()
    val unpaidInstallments = installments.filter { it.status != "paid" }
    val totalOutstanding = unpaidInstallments.sumOf { it.amount }
    val isDark = isSystemInDarkTheme()
    val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
    val headerAlpha by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 1f else 0f,
        animationSpec = androidx.compose.animation.core.tween(220), label = "feeHeaderAlpha"
    )
    val headerSlide by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 0f else -24f,
        animationSpec = androidx.compose.animation.core.tween(220), label = "feeHeaderSlide"
    )

    PullToRefreshBox(
        isRefreshing = isRefreshing || isLoading,
        onRefresh = { onRefresh(); fetchFees() },
        modifier = Modifier.fillMaxSize()
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .statusBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                // Home-style header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        IconButton(
                            onClick = { },
                            modifier = Modifier
                                .size(36.dp)
                                .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                                .clip(CircleShape)
                        ) {
                            Icon(painter = androidx.compose.ui.res.painterResource(id = com.vidyaschool.app.R.drawable.ic_custom_menu), contentDescription = "Menu", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                        }
                        Column {
                            Text("Pay Fees", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                            Text("Student Portal", fontSize = 12.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
                        }
                    }
                    IconButton(
                        onClick = { },
                        modifier = Modifier
                            .size(36.dp)
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                            .clip(CircleShape)
                    ) {
                        Icon(painter = androidx.compose.ui.res.painterResource(id = com.vidyaschool.app.R.drawable.ic_custom_notification), contentDescription = "Notifications", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Error banner
                if (paymentError != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(MaterialTheme.colorScheme.errorContainer)
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(paymentError!!, fontSize = 13.sp, color = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.weight(1f))
                        IconButton(onClick = { paymentError = null }, modifier = Modifier.size(18.dp)) {
                            Icon(Icons.Default.Close, contentDescription = null, tint = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.size(14.dp))
                        }
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }

                // Summary card — primary in light, gray+border in dark
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .then(
                            if (isDark) Modifier.border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.25f), RoundedCornerShape(14.dp))
                            else Modifier
                        )
                        .background(
                            if (isDark) MaterialTheme.colorScheme.surfaceVariant
                            else MaterialTheme.colorScheme.primary
                        )
                        .padding(20.dp)
                ) {
                    val contentColor = if (isDark) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onPrimary
                    Column {
                        Text("Outstanding Balance", fontSize = 12.sp, color = contentColor.copy(alpha = 0.6f), fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("₹${"%,d".format(totalOutstanding.toInt())}", fontSize = 34.sp, fontWeight = FontWeight.Bold, color = contentColor)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            if (unpaidInstallments.isEmpty() && installments.isNotEmpty()) "All fees paid ✓"
                            else "${unpaidInstallments.size} month${if (unpaidInstallments.size != 1) "s" else ""} pending",
                            fontSize = 12.sp, color = contentColor.copy(alpha = 0.55f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Section label
                Text("Installments", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f), letterSpacing = 0.8.sp)
                Spacer(modifier = Modifier.height(10.dp))

            // Skeleton
            if (isLoading && installments.isEmpty()) {
                repeat(4) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.width(100.dp).height(14.dp).clip(RoundedCornerShape(4.dp)).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)))
                            Box(modifier = Modifier.width(70.dp).height(11.dp).clip(RoundedCornerShape(4.dp)).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)))
                        }
                        Box(modifier = Modifier.width(56.dp).height(30.dp).clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)))
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
                }
            } else if (!isLoading && installments.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp), contentAlignment = Alignment.Center) {
                    Text("No records found", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                }
            }

            // Installment rows
            installments.forEachIndexed { index, inst ->
                val isPaid = inst.status == "paid"
                val isOverdue = inst.status == "overdue"
                val isProcessing = isProcessingPayment == inst.id

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Left: month + meta
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(inst.month, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                            if (isOverdue) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(MaterialTheme.colorScheme.error.copy(alpha = 0.12f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("Overdue", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            if (isPaid && !inst.receiptNo.isNullOrEmpty()) inst.receiptNo!!
                            else "₹${"%,d".format(inst.amount.toInt())}",
                            fontSize = 12.sp,
                            color = if (isPaid) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                            fontFamily = if (isPaid) androidx.compose.ui.text.font.FontFamily.Monospace else androidx.compose.ui.text.font.FontFamily.Default
                        )
                    }

                    // Right: action
                    if (isPaid) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            if (!inst.receiptNo.isNullOrEmpty()) {
                                IconButton(
                                    onClick = {
                                        val url = "https://vidyaschool.vercel.app/fee/payment/${inst.receiptNo}"
                                        val intent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                                            type = "text/plain"
                                            putExtra(android.content.Intent.EXTRA_TEXT, url)
                                        }
                                        context.startActivity(android.content.Intent.createChooser(intent, "Share Receipt"))
                                    },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = "Share", tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), modifier = Modifier.size(15.dp))
                                }
                            }
                            Text("Paid", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF10B981))
                        }
                    } else {
                        Button(
                            onClick = { handlePayFee(inst) },
                            enabled = !isProcessing && isProcessingPayment == null,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)
                            ),
                            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 0.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            if (isProcessing)
                                CircularProgressIndicator(modifier = Modifier.size(14.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                            else
                                Text("Pay", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                if (index < installments.lastIndex) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
                }
            }
        } // end Column

        // Sticky collapsed header
        if (headerAlpha > 0f) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .graphicsLayer { alpha = headerAlpha; translationY = headerSlide }
                    .background(MaterialTheme.colorScheme.background)
            ) {
                Spacer(modifier = Modifier.windowInsetsTopHeight(androidx.compose.foundation.layout.WindowInsets.statusBars))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = { },
                        modifier = Modifier
                            .size(36.dp)
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                            .clip(CircleShape)
                    ) {
                        Icon(painter = androidx.compose.ui.res.painterResource(id = com.vidyaschool.app.R.drawable.ic_custom_menu), contentDescription = "Menu", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                    }
                    Text("Pay Fees", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                    IconButton(
                        onClick = { },
                        modifier = Modifier
                            .size(36.dp)
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                            .clip(CircleShape)
                    ) {
                        Icon(painter = androidx.compose.ui.res.painterResource(id = com.vidyaschool.app.R.drawable.ic_custom_notification), contentDescription = "Notifications", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
                    }
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
            }
        }
    } // end Box
  } // end PullToRefreshBox
}

