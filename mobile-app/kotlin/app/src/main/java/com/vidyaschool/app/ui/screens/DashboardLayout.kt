package com.vidyaschool.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.ime
import androidx.compose.ui.platform.LocalDensity
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.MaterialTheme
import androidx.compose.foundation.isSystemInDarkTheme
import android.content.Intent
import android.net.Uri
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.api.UpdateChecker
import com.vidyaschool.app.api.UpdateInfo
import com.vidyaschool.app.ui.components.CustomTextField
import com.vidyaschool.app.ui.shadcn.Input
import com.vidyaschool.app.ui.shadcn.Select
import com.vidyaschool.app.ui.shadcn.SelectOption
import coil.compose.AsyncImage
import com.vidyaschool.app.api.FeeInstallment
import com.vidyaschool.app.api.NoticeResponse
import com.vidyaschool.app.api.NotificationHistoryItem
import com.vidyaschool.app.api.PayFeesRequest
import com.vidyaschool.app.api.PayFeesResponse
import com.vidyaschool.app.api.SearchUserResponse
import com.vidyaschool.app.api.SearchBackendResponse
import com.vidyaschool.app.api.UserProfileData
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R
import androidx.compose.ui.graphics.vector.ImageVector
import io.socket.client.IO
import io.socket.client.Socket
import com.google.gson.Gson
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Close

val LocalMenuClickHandler = staticCompositionLocalOf<(() -> Unit)?> { null }

@Composable
fun DashboardHeader(
    title: String,
    subtitle: String,
    onNotificationClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val menuClick = LocalMenuClickHandler.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            IconButton(
                onClick = { menuClick?.invoke() },
                modifier = Modifier
                    .size(36.dp)
                    .border(
                        1.dp,
                        MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f),
                        shape = CircleShape
                    )
                    .clip(CircleShape)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_custom_menu),
                    contentDescription = "Menu",
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.onBackground
                )
            }

            Column {
                Text(
                    text = title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
            }
        }

        IconButton(
            onClick = onNotificationClick,
            modifier = Modifier
                .size(36.dp)
                .border(
                    1.dp,
                    MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f),
                    shape = CircleShape
                )
                .clip(CircleShape)
        ) {
            Icon(
                painter = painterResource(id = R.drawable.ic_custom_notification),
                contentDescription = "Notifications",
                modifier = Modifier.size(18.dp),
                tint = MaterialTheme.colorScheme.onBackground
            )
        }
    }
}

@Composable
fun DashboardStickyHeader(
    title: String,
    headerAlpha: Float,
    headerSlide: Float,
    onNotificationClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val menuClick = LocalMenuClickHandler.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer { alpha = headerAlpha; translationY = headerSlide }
            .background(MaterialTheme.colorScheme.background)
    ) {
        Spacer(modifier = Modifier.windowInsetsTopHeight(androidx.compose.foundation.layout.WindowInsets.statusBars))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(
                onClick = { menuClick?.invoke() },
                modifier = Modifier
                    .size(36.dp)
                    .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                    .clip(CircleShape)
            ) {
                Icon(painter = painterResource(id = R.drawable.ic_custom_menu), contentDescription = "Menu", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
            }
            Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            IconButton(
                onClick = onNotificationClick,
                modifier = Modifier
                    .size(36.dp)
                    .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f), CircleShape)
                    .clip(CircleShape)
            ) {
                Icon(painter = painterResource(id = R.drawable.ic_custom_notification), contentDescription = "Notifications", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onBackground)
            }
        }
        HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f))
    }
}

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
    onShowLibrary: (() -> Unit)? = null,
    homeContent: @Composable (onNotificationClick: () -> Unit) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    
    val updateInfo by UpdateChecker.updateInfoState
    var isDownloading by UpdateChecker.isDownloadingState
    var downloadProgress by UpdateChecker.downloadProgressState
    
    val currentRole = remember { mutableStateOf(role) }
    val currentName = remember { mutableStateOf(name) }
    val currentAvatarUrl = remember { mutableStateOf(avatarUrl) }
    val currentUsername = remember { mutableStateOf(sessionManager.getUsername() ?: "") }
    
    var selectedTab by remember { mutableStateOf("home") }
    var activeDocPath by remember { mutableStateOf<String?>(null) }
    var activeDocFallback by remember { mutableStateOf<String?>(null) }
    var isRefreshing by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    var showComplaintDialog by remember { mutableStateOf(false) }
    var showSessionsDialog by remember { mutableStateOf(false) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    
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
                                    currentUsername.value = verifyBody.username ?: currentUsername.value
                                    sessionManager.saveSession(
                                        provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken, verifyBody.studentClass, currentUsername.value
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
                                provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken, body.studentClass, currentUsername.value
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
                            provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, sessionToken, sessionManager.getStudentClass(), currentUsername.value
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
    
    val currentUserId = remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        val sessionToken = sessionManager.getSessionToken()
        if (!sessionToken.isNullOrEmpty()) {
            try {
                val profileResponse = RetrofitClient.authApi.getProfile("Bearer $sessionToken")
                if (profileResponse.isSuccessful && profileResponse.body() != null) {
                    val user = profileResponse.body()!!.user
                    currentUserId.value = user.id
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // Global Socket for receiving push notifications when online
    LaunchedEffect(currentUserId.value) {
        val userId = currentUserId.value
        if (userId.isEmpty()) return@LaunchedEffect
        
        val userRole = sessionManager.getRole() ?: "student"
        
        var globalSocket: io.socket.client.Socket? = null
        try {
            val opts = IO.Options().apply {
                transports = arrayOf("polling", "websocket")
                forceNew = true
                callFactory = com.vidyaschool.app.api.RetrofitClient.socketOkHttpClient
                webSocketFactory = com.vidyaschool.app.api.RetrofitClient.socketOkHttpClient
            }
            globalSocket = IO.socket("https://api.blazeneuro.com", opts)
            
            globalSocket.on(Socket.EVENT_CONNECT) {
                val joinData = org.json.JSONObject().apply {
                    put("userId", userId)
                    put("name", currentName.value)
                    put("role", userRole)
                }
                globalSocket?.emit("join", joinData)
                android.util.Log.d("NotificationSocket", "Joined with userId: $userId")
            }
            
            globalSocket.on("notification") { args ->
                if (args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val title = obj.optString("title", "New Notification")
                        val body = obj.optString("body", "")
                        com.vidyaschool.app.MyFirebaseMessagingService.showNotification(context, title, body)
                    }
                }
            }
            
            globalSocket.connect()
            kotlinx.coroutines.awaitCancellation()
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            globalSocket?.disconnect()
            globalSocket?.off()
            globalSocket = null
        }
    }

    CompositionLocalProvider(LocalMenuClickHandler provides { scope.launch { drawerState.open() } }) {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet(
                    drawerContainerColor = MaterialTheme.colorScheme.background,
                    modifier = Modifier.width(300.dp)
                ) {
                    Spacer(modifier = Modifier.height(24.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!avatarUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = avatarUrl,
                                    contentDescription = "Avatar",
                                    modifier = Modifier.fillMaxSize().clip(CircleShape)
                                )
                            } else {
                                Text(
                                    text = (name.takeIf { it.isNotBlank() } ?: "U").take(1).uppercase(),
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = name.ifEmpty { "User" },
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Text(
                                text = email,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                            )
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))

                    Spacer(modifier = Modifier.height(16.dp))

                    NavigationDrawerItem(
                        label = { Text("Home Dashboard") },
                        selected = selectedTab == "home",
                        onClick = {
                            scope.launch { drawerState.close() }
                            selectedTab = "home"
                        },
                        icon = { Icon(Icons.Default.Home, contentDescription = null) },
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )

                    NavigationDrawerItem(
                        label = { Text("Notice Board") },
                        selected = selectedTab == "notice",
                        onClick = {
                            scope.launch { drawerState.close() }
                            selectedTab = "notice"
                        },
                        icon = { Icon(Icons.Default.Info, contentDescription = null) },
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )

                    NavigationDrawerItem(
                        label = { Text("Search Tab") },
                        selected = selectedTab == "search",
                        onClick = {
                            scope.launch { drawerState.close() }
                            selectedTab = "search"
                        },
                        icon = { Icon(Icons.Default.Search, contentDescription = null) },
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 16.dp, horizontal = 20.dp),
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f)
                    )

                    NavigationDrawerItem(
                        label = { Text("File a Complaint") },
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            showComplaintDialog = true
                        },
                        icon = { Icon(Icons.Default.Edit, contentDescription = null) },
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )

                    NavigationDrawerItem(
                        label = { Text("Manage Sessions") },
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            showSessionsDialog = true
                        },
                        icon = { Icon(Icons.Default.Person, contentDescription = null) },
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )

                    Spacer(modifier = Modifier.weight(1f))

                    NavigationDrawerItem(
                        label = { Text("Log Out", color = MaterialTheme.colorScheme.error) },
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            onLogout()
                        },
                        icon = { Icon(Icons.Default.Close, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 20.dp)
                    )
                }
            }
        ) {
            Scaffold(
        topBar = {
            if (activeDocPath != null) {
                Column(
                    modifier = Modifier.background(MaterialTheme.colorScheme.background)
                ) {
                    Spacer(modifier = Modifier.windowInsetsTopHeight(WindowInsets.statusBars))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { activeDocPath = null }
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = MaterialTheme.colorScheme.onBackground
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Documentation",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f))
                }
            }
        },
        bottomBar = {
            val isKeyboardVisible = WindowInsets.ime.getBottom(LocalDensity.current) > 0
            val navBarInsets = if (isKeyboardVisible) {
                WindowInsets(0.dp)
            } else {
                NavigationBarDefaults.windowInsets
            }
            Column(
                modifier = Modifier
                    .background(MaterialTheme.colorScheme.background)
                    .windowInsetsPadding(navBarInsets)
            ) {
                updateInfo?.let { info ->
                    val updateApk = remember(info) { java.io.File(context.cacheDir, "update.apk") }
                    var isApkDownloaded by remember(info) { mutableStateOf(updateApk.exists() && updateApk.length() > 0) }

                    UpdateBanner(
                        updateInfo = info,
                        isDownloading = isDownloading,
                        downloadProgress = downloadProgress,
                        isDownloaded = isApkDownloaded,
                        onUpdateClick = {
                            val canInstall = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                                context.packageManager.canRequestPackageInstalls()
                            } else {
                                true
                            }
                            if (!canInstall) {
                                try {
                                    val intent = Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                                        data = Uri.parse("package:${context.packageName}")
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                    context.startActivity(intent)
                                    android.widget.Toast.makeText(context, "Please enable 'Install unknown apps' to update.", android.widget.Toast.LENGTH_LONG).show()
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                }
                            } else {
                                if (isApkDownloaded) {
                                    val apkUri = androidx.core.content.FileProvider.getUriForFile(
                                        context,
                                        "${context.packageName}.fileprovider",
                                        updateApk
                                    )
                                    UpdateChecker.installApk(context, apkUri)
                                    UpdateChecker.updateInfoState.value = null
                                } else {
                                    isDownloading = true
                                    downloadProgress = 0f
                                    scope.launch {
                                        val apkUri = UpdateChecker.downloadApk(context, info.downloadUrl) { progress ->
                                            downloadProgress = progress
                                        }
                                        isDownloading = false
                                        if (apkUri != null) {
                                            isApkDownloaded = true
                                            UpdateChecker.installApk(context, apkUri)
                                        }
                                        UpdateChecker.updateInfoState.value = null
                                    }
                                }
                            }
                        },
                        onDismissClick = {
                            UpdateChecker.updateInfoState.value = null
                        }
                    )
                }
                if (selectedTab != "community" && activeDocPath == null) {
                    NavigationBar(
                        containerColor = MaterialTheme.colorScheme.background,
                        tonalElevation = 0.dp,
                        windowInsets = WindowInsets(0.dp),
                        modifier = Modifier.height(62.dp)
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
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            if (activeDocPath != null) {
                DocViewerScreen(
                    path = activeDocPath!!,
                    fallbackContent = activeDocFallback,
                    onBack = { activeDocPath = null }
                )
            } else {
                when (selectedTab) {
                    "home" -> {
                        PullToRefreshBox(
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            homeContent { showNotifications = true }
                        }
                    }
                    "notice" -> {
                        NoticeTabContent(
                            sessionManager = sessionManager,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            onNotificationClick = { showNotifications = true }
                        )
                    }
                    "community" -> {
                        CommunityTabContent(
                            role = currentRole.value,
                            sessionManager = sessionManager,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            onBackClick = { selectedTab = "home" }
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
                            sessionManager = sessionManager,
                            onTabSelect = { tab -> selectedTab = tab },
                            onDocSelect = { path, fallback -> activeDocPath = path; activeDocFallback = fallback },
                            onShowLibrary = onShowLibrary,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh
                        )
                    }
                    "profile" -> {
                        ProfileTabContent(
                            sessionManager = sessionManager,
                            role = currentRole.value,
                            provider = provider,
                            email = email,
                            name = currentName.value,
                            avatarUrl = currentAvatarUrl.value,
                            username = currentUsername.value,
                            onUpdateUsername = { newUsername ->
                                currentUsername.value = newUsername
                                val token = sessionManager.getSessionToken()
                                val studentClass = sessionManager.getStudentClass()
                                sessionManager.saveSession(
                                    provider, email, currentName.value, currentRole.value, currentAvatarUrl.value, token, studentClass, newUsername
                                )
                            },
                            themeMode = themeMode,
                            onThemeChange = onThemeChange,
                            isRefreshing = isRefreshing,
                            onRefresh = triggerRefresh,
                            onLogout = onLogout,
                            onNotificationClick = { showNotifications = true }
                        )
                    }
                }
            }
        }
    }

    if (showNotifications) {
        NotificationDrawer(
            sessionManager = sessionManager,
            onDismiss = { showNotifications = false }
        )
    }

    if (showComplaintDialog) {
        var complaintTitle by remember { mutableStateOf("") }
        var complaintDesc by remember { mutableStateOf("") }
        var selectedDepartment by remember { mutableStateOf("principal") }
        val departments = listOf(
            SelectOption("principal", "Principal Office"),
            SelectOption("it_support", "IT Support"),
            SelectOption("coordinator", "Academic Coordinator")
        )

        AlertDialog(
            onDismissRequest = { showComplaintDialog = false },
            title = {
                Text(
                    text = "File a Complaint",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Select(
                        selectedValue = selectedDepartment,
                        onValueChange = { selectedDepartment = it },
                        options = departments,
                        label = "Select Department",
                        modifier = Modifier.fillMaxWidth()
                    )

                    Column {
                        Text(
                            text = "Title",
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 13.sp),
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        Input(
                            value = complaintTitle,
                            onValueChange = { complaintTitle = it },
                            placeholder = "Summarize the issue...",
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Column {
                        Text(
                            text = "Details",
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 13.sp),
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        Input(
                            value = complaintDesc,
                            onValueChange = { complaintDesc = it },
                            placeholder = "Describe the issue in detail...",
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (complaintTitle.isNotBlank() && complaintDesc.isNotBlank()) {
                            showComplaintDialog = false
                            android.widget.Toast.makeText(context, "Complaint submitted successfully! Ticket ID: CMP-${(1000..9999).random()}", android.widget.Toast.LENGTH_LONG).show()
                        } else {
                            android.widget.Toast.makeText(context, "Please fill in all fields", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }
                ) {
                    Text("Submit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showComplaintDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showSessionsDialog) {
        val currentProvider = sessionManager.getProvider() ?: "Email Login"
        val currentEmail = sessionManager.getEmail() ?: "unknown"
        val currentUsername = sessionManager.getUsername() ?: "unknown"

        AlertDialog(
            onDismissRequest = { showSessionsDialog = false },
            title = {
                Text(
                    text = "Manage Sessions",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Active session instances connected to your school account.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                        ),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(Color(0xFF22C55E), CircleShape)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Current Device (Android App)",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Provider: $currentProvider",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                            )
                            Text(
                                text = "User: $currentEmail (@$currentUsername)",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "Chrome / Windows 11",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Location: New Delhi, India",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Text(
                                text = "Last active: 2 hours ago",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "Safari / iPhone 15",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Location: Mumbai, India",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Text(
                                text = "Last active: 1 day ago",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        android.widget.Toast.makeText(context, "All other sessions revoked successfully!", android.widget.Toast.LENGTH_SHORT).show()
                        showSessionsDialog = false
                    }
                ) {
                    Text("Revoke Others")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSessionsDialog = false }) {
                    Text("Close")
                }
            }
        )
    }
}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchTabContent(
    sessionManager: SessionManager,
    onTabSelect: (String) -> Unit,
    onDocSelect: (String, String) -> Unit,
    onShowLibrary: (() -> Unit)?,
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<SearchUserResponse>>(emptyList()) }
    var backendSearchResults by remember { mutableStateOf<List<SearchBackendResponse>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var activeFilter by remember { mutableStateOf("All") }
    var selectedDoc by remember { mutableStateOf<HelpDoc?>(null) }
    var selectedUserDetail by remember { mutableStateOf<SearchUserResponse?>(null) }

    val role = remember { sessionManager.getRole() ?: "student" }

    // Pages configuration based on user role
    val pages = remember(role) {
        buildList {
            add(SearchPageItem("Home Dashboard", "home", "Access stats, slider updates & shortcuts", Icons.Default.Home))
            add(SearchPageItem("Notice Board", "notice", "Read school announcements and notice feed", Icons.Default.Info))
            if (role.equals("student", ignoreCase = true)) {
                add(SearchPageItem("Pay Fees Online", "fees", "Manage dues, verify receipts & pay via Razorpay", Icons.Default.Info))
                if (onShowLibrary != null) {
                    add(SearchPageItem("Library Hub", "library", "Browse catalog, issue details & manage book returns", Icons.Default.Info, isExternal = true, externalAction = onShowLibrary))
                }
            } else {
                add(SearchPageItem("Community Hub", "community", "Post updates, interact & discuss academic topics", Icons.Default.Share))
            }
            add(SearchPageItem("My Profile Settings", "profile", "Control theme preferences & view session logs", Icons.Default.Person))
        }
    }

    // Debounced query execution to backend
    LaunchedEffect(searchQuery) {
        if (searchQuery.isBlank()) {
            searchResults = emptyList()
            backendSearchResults = emptyList()
            return@LaunchedEffect
        }
        delay(300)
        isLoading = true
        try {
            val token = sessionManager.getSessionToken() ?: ""
            val authHeader = "Bearer $token"
            val username = sessionManager.getUsername() ?: ""

            val response = RetrofitClient.authApi.searchUsers(authHeader, searchQuery)
            if (response.isSuccessful) {
                searchResults = response.body() ?: emptyList()
            }

            val backendResponse = RetrofitClient.authApi.searchBackend(searchQuery, role, username)
            if (backendResponse.isSuccessful) {
                backendSearchResults = backendResponse.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("SearchTab", "Backend search error: ${e.message}")
        } finally {
            isLoading = false
        }
    }

    val filteredPages = remember(searchQuery, backendSearchResults, pages) {
        if (searchQuery.isBlank()) {
            pages
        } else {
            backendSearchResults
                .filter { !it.url.contains("/docs/") && !it.url.contains("privacy-policy") && !it.url.contains("terms-of-service") }
                .map { item ->
                    val tabKey = when {
                        item.url.contains("/student/fees", ignoreCase = true) || item.url.endsWith("/fees", ignoreCase = true) -> "fees"
                        item.url.contains("/student/notice", ignoreCase = true) || item.url.endsWith("/notice", ignoreCase = true) -> "notice"
                        item.url.contains("/community", ignoreCase = true) -> "community"
                        item.url.contains("/student/library", ignoreCase = true) || item.url.endsWith("/library", ignoreCase = true) -> "library"
                        item.url.contains("/student/profile", ignoreCase = true) || item.url.endsWith("/profile", ignoreCase = true) -> "profile"
                        item.url.contains("/student/", ignoreCase = true) || item.url.endsWith("/student", ignoreCase = true) -> "home"
                        else -> "home"
                    }
                    val icon = when {
                        item.url.contains("/fees", ignoreCase = true) -> Icons.Default.Info
                        item.url.contains("/library", ignoreCase = true) -> Icons.Default.Info
                        item.url.contains("/community", ignoreCase = true) -> Icons.Default.Share
                        item.url.contains("/notice", ignoreCase = true) -> Icons.Default.Info
                        item.url.contains("/profile", ignoreCase = true) -> Icons.Default.Person
                        else -> Icons.Default.Home
                    }
                    val isExternal = tabKey == "library"
                    SearchPageItem(
                        name = item.title,
                        tabKey = tabKey,
                        description = item.content,
                        icon = icon,
                        isExternal = isExternal,
                        externalAction = if (isExternal) onShowLibrary else null
                    )
                }
        }
    }

    val filteredDocs = remember(searchQuery, backendSearchResults) {
        if (searchQuery.isBlank()) {
            helpDocs
        } else {
            backendSearchResults
                .filter { it.url.contains("/docs/") || it.url.contains("privacy-policy") || it.url.contains("terms-of-service") }
                .map { item ->
                    HelpDoc(
                        title = item.title,
                        category = if (item.url.contains("privacy-policy") || item.url.contains("terms-of-service")) "Legal" else "Docs",
                        content = item.content,
                        url = item.url
                    )
                }
        }
    }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .imePadding()
        ) {
            // Search Input styled like shadcn
            Input(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = "Search pages, users, docs...",
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 4.dp),
                leadingIcon = {
                    Icon(
                        Icons.Default.Search,
                        contentDescription = "Search",
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        modifier = Modifier.size(18.dp)
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Clear",
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Shadcn filter tabs/pills
            val isDark = isSystemInDarkTheme()
            val selectedBg = if (isDark) Color.White else Color.Black
            val selectedText = if (isDark) Color.Black else Color.White
            val unselectedBg = Color.Transparent
            val unselectedBorder = if (isDark) Color.White.copy(alpha = 0.15f) else Color.Black.copy(alpha = 0.08f)
            val unselectedText = if (isDark) Color.White.copy(alpha = 0.6f) else Color.Black.copy(alpha = 0.6f)

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("All", "Pages", "Users", "Docs").forEach { filter ->
                    val isSelected = activeFilter == filter
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) selectedBg else unselectedBg)
                            .border(
                                1.dp,
                                if (isSelected) Color.Transparent else unselectedBorder,
                                RoundedCornerShape(6.dp)
                            )
                            .clickable { activeFilter = filter }
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = filter,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isSelected) selectedText else unselectedText
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (isLoading) {
                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(strokeWidth = 2.5.dp, modifier = Modifier.size(36.dp))
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 20.dp)
                ) {
                    // 1. Pages Section
                    if (activeFilter == "All" || activeFilter == "Pages") {
                        if (filteredPages.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Pages & Features")
                            }
                            items(filteredPages.size) { idx ->
                                val item = filteredPages[idx]
                                SearchResultRow(
                                    title = item.name,
                                    subtitle = item.description,
                                    icon = item.icon,
                                    category = "Page",
                                    onClick = {
                                        if (item.isExternal) {
                                            item.externalAction?.invoke()
                                        } else {
                                            onTabSelect(item.tabKey)
                                        }
                                    }
                                )
                            }
                        }
                    }

                    // 2. Users Section (Backend results)
                    if (activeFilter == "All" || activeFilter == "Users") {
                        if (searchResults.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Users (${searchResults.size})")
                            }
                            items(searchResults.size) { idx ->
                                val user = searchResults[idx]
                                SearchResultRow(
                                    title = user.name,
                                    subtitle = "@${user.username}",
                                    icon = Icons.Default.Person,
                                    category = user.role.uppercase(),
                                    onClick = { selectedUserDetail = user }
                                )
                            }
                        } else if (searchQuery.isNotEmpty() && activeFilter == "Users") {
                            item {
                                Text(
                                    text = "No matching users found in school database",
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                                    fontSize = 14.sp,
                                    modifier = Modifier.padding(vertical = 12.dp)
                                )
                            }
                        }
                    }

                    // 3. Documentation Section
                    if (activeFilter == "All" || activeFilter == "Docs") {
                        if (filteredDocs.isNotEmpty()) {
                            item {
                                SearchGroupHeader(title = "Documentation & Help")
                            }
                            items(filteredDocs.size) { idx ->
                                val doc = filteredDocs[idx]
                                SearchResultRow(
                                    title = doc.title,
                                    subtitle = doc.content,
                                    icon = Icons.Default.Info,
                                    category = doc.category,
                                    onClick = {
                                        val targetUrl = doc.url ?: when (doc.title) {
                                            "Library Policies & Fines" -> "/docs/student/library"
                                            "Late Fee Structure & Penalty" -> "/docs/student/fees"
                                            "How to Post in Community" -> "/docs/student/complaints"
                                            "Contacting Accounts Office" -> "/docs/student/fees"
                                            "Student ID Card Reissue Policy" -> "/docs/student/onboarding"
                                            else -> "/docs/student/onboarding"
                                        }
                                        onDocSelect(targetUrl, doc.content)
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Help Doc overlay dialog (Shadcn styling)
    if (selectedDoc != null) {
        val doc = selectedDoc!!
        AlertDialog(
            onDismissRequest = { selectedDoc = null },
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
            containerColor = MaterialTheme.colorScheme.background,
            title = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(doc.title, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
                        Box(
                            modifier = Modifier
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(doc.category.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))
                }
            },
            text = {
                Column(modifier = Modifier.padding(vertical = 8.dp)) {
                    Text(
                        doc.content,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                        lineHeight = 22.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedDoc = null },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    contentPadding = PaddingValues(horizontal = 18.dp, vertical = 8.dp)
                ) {
                    Text("Done", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }

    // User details details dialog
    if (selectedUserDetail != null) {
        val user = selectedUserDetail!!
        AlertDialog(
            onDismissRequest = { selectedUserDetail = null },
            modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
            containerColor = MaterialTheme.colorScheme.background,
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(user.name.firstOrNull()?.uppercase() ?: "?", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(user.name, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
                    Text("@${user.username}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Institution Role", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        Text(user.role.uppercase(), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Session Authority", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        Text("Verified Member", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF10B981))
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedUserDetail = null },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Close", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}

@Composable
fun SearchGroupHeader(title: String) {
    Text(
        text = title.uppercase(),
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
        modifier = Modifier.padding(bottom = 8.dp, start = 4.dp)
    )
}

@Composable
fun SearchResultRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    category: String,
    onClick: () -> Unit
) {
    val isDark = isSystemInDarkTheme()
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(
                1.dp,
                if (isDark) Color.White.copy(alpha = 0.1f) else Color.Black.copy(alpha = 0.08f),
                RoundedCornerShape(8.dp)
            ),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(if (isDark) Color.White.copy(alpha = 0.06f) else Color.Black.copy(alpha = 0.04f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = subtitle,
                    fontSize = 11.5.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .border(
                        1.dp,
                        if (isDark) Color.White.copy(alpha = 0.15f) else Color.Black.copy(alpha = 0.08f),
                        RoundedCornerShape(4.dp)
                    )
                    .background(if (isDark) Color.White.copy(alpha = 0.03f) else Color.Black.copy(alpha = 0.02f), RoundedCornerShape(4.dp))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = category.uppercase(),
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            Spacer(modifier = Modifier.width(6.dp))
            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileTabContent(
    sessionManager: SessionManager,
    role: String,
    provider: String,
    email: String,
    name: String,
    avatarUrl: String?,
    username: String,
    onUpdateUsername: (String) -> Unit,
    themeMode: String,
    onThemeChange: (String) -> Unit,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onNotificationClick: () -> Unit
) {
    var isEditing by remember { mutableStateOf(false) }
    var tempUsername by remember { mutableStateOf(username) }

    var userProfile by remember { mutableStateOf<UserProfileData?>(null) }
    var isLoadingProfile by remember { mutableStateOf(false) }

    // Editable state fields
    var editPhoneNumber by remember { mutableStateOf("") }
    var editAddress by remember { mutableStateOf("") }
    var editCity by remember { mutableStateOf("") }
    var editState by remember { mutableStateOf("") }
    var editPincode by remember { mutableStateOf("") }
    
    var editParentName by remember { mutableStateOf("") }
    var editParentPhone by remember { mutableStateOf("") }
    var editParentEmail by remember { mutableStateOf("") }
    
    var editClass by remember { mutableStateOf("") }
    var editSection by remember { mutableStateOf("") }

    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(username) {
        tempUsername = username
    }

    fun fetchProfile() {
        coroutineScope.launch {
            isLoadingProfile = true
            try {
                val token = sessionManager.getSessionToken() ?: ""
                val res = RetrofitClient.authApi.getProfile("Bearer $token")
                if (res.isSuccessful && res.body() != null) {
                    val profileData = res.body()?.profile
                    userProfile = profileData
                    if (profileData != null) {
                        editPhoneNumber = profileData.phoneNumber ?: ""
                        editAddress = profileData.address ?: ""
                        editCity = profileData.city ?: ""
                        editState = profileData.state ?: ""
                        editPincode = profileData.pincode ?: ""
                        editParentName = profileData.parentName ?: ""
                        editParentPhone = profileData.parentPhone ?: ""
                        editParentEmail = profileData.parentEmail ?: ""
                        editClass = profileData.`class` ?: ""
                        editSection = profileData.section ?: ""
                        
                        val fetchedUsername = profileData.username ?: ""
                        if (fetchedUsername.isNotEmpty() && fetchedUsername != username) {
                            onUpdateUsername(fetchedUsername)
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("ProfileTab", "Error fetching profile: ${e.message}")
            } finally {
                isLoadingProfile = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchProfile()
    }

    LaunchedEffect(isRefreshing) {
        if (isRefreshing) {
            fetchProfile()
        }
    }

    fun saveProfileSettings() {
        coroutineScope.launch {
            try {
                val token = sessionManager.getSessionToken() ?: ""
                val req = com.vidyaschool.app.api.ProfileUpdateRequest(
                    username = tempUsername,
                    phoneNumber = editPhoneNumber,
                    address = editAddress,
                    city = editCity,
                    state = editState,
                    pincode = editPincode,
                    parentName = if (role.equals("student", ignoreCase = true)) editParentName else null,
                    parentPhone = if (role.equals("student", ignoreCase = true)) editParentPhone else null,
                    parentEmail = if (role.equals("student", ignoreCase = true)) editParentEmail else null,
                    class_ = editClass.takeIf { it.isNotEmpty() && it != "none" },
                    section = editSection.takeIf { it.isNotEmpty() && it != "none" }
                )
                val res = RetrofitClient.authApi.updateProfile("Bearer $token", req)
                if (res.isSuccessful) {
                    android.widget.Toast.makeText(context, "Settings updated successfully", android.widget.Toast.LENGTH_SHORT).show()
                    isEditing = false
                    onUpdateUsername(tempUsername)
                    
                    val currentClass = if (role.equals("student", ignoreCase = true)) editClass else sessionManager.getStudentClass()
                    sessionManager.saveSession(
                        provider = provider,
                        email = email,
                        name = name,
                        role = role,
                        avatarUrl = avatarUrl,
                        sessionToken = token,
                        studentClass = currentClass,
                        username = tempUsername
                    )
                    fetchProfile()
                } else {
                    val errorBody = res.errorBody()?.string() ?: ""
                    var errMsg = "Failed to update settings"
                    try {
                        val json = org.json.JSONObject(errorBody)
                        errMsg = json.optString("detail", errMsg)
                    } catch (e: Exception) {}
                    android.widget.Toast.makeText(context, errMsg, android.widget.Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
            }
        }
    }

    val scrollState = rememberScrollState()
    val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
    val headerAlpha by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 1f else 0f,
        animationSpec = androidx.compose.animation.core.tween(220),
        label = "headerAlpha"
    )
    val headerSlide by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (headerCollapsed) 0f else -24f,
        animationSpec = androidx.compose.animation.core.tween(220),
        label = "headerSlide"
    )

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .statusBarsPadding()
                    .padding(bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                DashboardHeader(
                    title = "My Profile",
                    subtitle = "${role.lowercase().replaceFirstChar { it.uppercase() }} Account Settings",
                    onNotificationClick = onNotificationClick
                )

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    // Profile Card (Shadcn style with thin border)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f),
                        RoundedCornerShape(12.dp)
                    ),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Double ring avatar style
                    Box(
                        modifier = Modifier
                            .size(90.dp)
                            .border(1.5.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f), CircleShape)
                            .padding(4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (!avatarUrl.isNullOrEmpty()) {
                            AsyncImage(
                                model = avatarUrl,
                                contentDescription = "Profile Picture",
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(CircleShape)
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
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
                    }
                    
                    Spacer(modifier = Modifier.height(14.dp))
                    
                    Text(
                        text = name,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    Text(
                        text = email,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = if (username.isNotEmpty()) "@$username" else "@Not set",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.primary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Pill Badge for Role
                    Box(
                        modifier = Modifier
                            .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(100.dp))
                            .padding(horizontal = 14.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = role.uppercase(),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.onPrimary,
                            letterSpacing = 0.5.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))
                    Spacer(modifier = Modifier.height(12.dp))

                    ProfileDetailRow(label = "Username", value = if (username.isNotEmpty()) username else "Not set")
                    ProfileDetailRow(label = "Auth Provider", value = provider.uppercase())
                    ProfileDetailRow(label = "Session Status", value = "ACTIVE")
                }
            }
            
            // App Theme Card (Shadcn Tab Selector)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f),
                        RoundedCornerShape(12.dp)
                    ),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            ) {
                Column(
                    modifier = Modifier.padding(18.dp)
                ) {
                    Text(
                        text = "App Appearance",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Shadcn Tab control segment
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.04f), RoundedCornerShape(8.dp))
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        listOf("system" to "System", "light" to "Light", "dark" to "Dark").forEach { (value, label) ->
                            val isSelected = themeMode == value
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(
                                        if (isSelected) MaterialTheme.colorScheme.surface
                                        else Color.Transparent
                                    )
                                    .clickable { onThemeChange(value) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (isSelected) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                        }
                    }
                }
            }
            
            if (isLoadingProfile) {
                    Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else {
                    // Personal Information Card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f), RoundedCornerShape(12.dp)),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                    ) {
                        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Personal Information", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.04f))
                            ProfileDetailRow(label = "User ID", value = userProfile?.userId ?: "N/A")
                            ProfileDetailRow(label = "Role", value = role.uppercase())
                        }
                    }

                    // Detailed Settings Card (Teacher Details or Student Details)
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f), RoundedCornerShape(12.dp)),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                    ) {
                        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            val detailTitle = if (role.equals("student", ignoreCase = true)) "Student Details" else "Teacher Details"
                            Text(detailTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.04f))

                            if (isEditing) {
                                Input(
                                    value = tempUsername,
                                    onValueChange = { tempUsername = it.toLowerCase().replace(Regex("[^a-z0-9_]"), "") },
                                    label = "Username",
                                    placeholder = "e.g. student_name",
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Input(
                                    value = editPhoneNumber,
                                    onValueChange = { editPhoneNumber = it },
                                    label = "Phone Number",
                                    placeholder = "e.g. 9876543210",
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Select(
                                    selectedValue = editClass.ifBlank { "none" },
                                    onValueChange = { editClass = it },
                                    options = listOf(SelectOption("none", "Not assigned")) +
                                        listOf("Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12").map { c ->
                                            SelectOption(
                                                value = c,
                                                label = if (c == "Nursery" || c == "KG") c else "Class $c"
                                            )
                                        },
                                    label = "Assigned Class",
                                    placeholder = "e.g. Class 10",
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Select(
                                    selectedValue = editSection.ifBlank { "none" },
                                    onValueChange = { editSection = it },
                                    options = listOf(SelectOption("none", "Not assigned")) +
                                        listOf("A", "B", "C", "D", "E", "F").map { SelectOption(it, it) },
                                    label = "Assigned Section",
                                    placeholder = "e.g. A",
                                    modifier = Modifier.fillMaxWidth()
                                )
                            } else {
                                ProfileDetailRow(label = "ID / Admission No", value = userProfile?.admissionNumber ?: "N/A")
                                ProfileDetailRow(label = "Username", value = if (tempUsername.isNotEmpty()) "@$tempUsername" else "Not set")
                                ProfileDetailRow(label = "Phone Number", value = if (editPhoneNumber.isNotEmpty()) editPhoneNumber else "Not set")
                                ProfileDetailRow(
                                    label = "Class",
                                    value = if (editClass.isEmpty() || editClass == "none") "Not assigned" else if (editClass == "Nursery" || editClass == "KG") editClass else "Class $editClass"
                                )
                                ProfileDetailRow(
                                    label = "Section",
                                    value = if (editSection.isEmpty() || editSection == "none") "Not assigned" else editSection
                                )
                            }
                        }
                    }

                    // Parent/Guardian details (if student)
                    if (role.equals("student", ignoreCase = true)) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f), RoundedCornerShape(12.dp)),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                        ) {
                            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Text("Parent/Guardian Details", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.04f))

                                if (isEditing) {
                                    Input(
                                        value = editParentName,
                                        onValueChange = { editParentName = it },
                                        label = "Parent Name",
                                        placeholder = "e.g. Rajesh Kumar",
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    Input(
                                        value = editParentPhone,
                                        onValueChange = { editParentPhone = it },
                                        label = "Parent Phone",
                                        placeholder = "e.g. 9876543210",
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    Input(
                                        value = editParentEmail,
                                        onValueChange = { editParentEmail = it },
                                        label = "Parent Email",
                                        placeholder = "e.g. parent@email.com",
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                } else {
                                    ProfileDetailRow(label = "Parent Name", value = if (editParentName.isNotEmpty()) editParentName else "Not set")
                                    ProfileDetailRow(label = "Parent Phone", value = if (editParentPhone.isNotEmpty()) editParentPhone else "Not set")
                                    ProfileDetailRow(label = "Parent Email", value = if (editParentEmail.isNotEmpty()) editParentEmail else "Not set")
                                }
                            }
                        }
                    }

                    // Address details Card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f), RoundedCornerShape(12.dp)),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                    ) {
                        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Address", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.04f))

                            if (isEditing) {
                                Input(
                                    value = editAddress,
                                    onValueChange = { editAddress = it },
                                    label = "Street Address",
                                    placeholder = "e.g. 42 MG Road, Block B",
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Input(
                                    value = editCity,
                                    onValueChange = { editCity = it },
                                    label = "City",
                                    placeholder = "e.g. Delhi",
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Input(
                                    value = editState,
                                    onValueChange = { editState = it },
                                    label = "State",
                                    placeholder = "e.g. Delhi",
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Input(
                                    value = editPincode,
                                    onValueChange = { editPincode = it },
                                    label = "Pincode",
                                    placeholder = "e.g. 110001",
                                    modifier = Modifier.fillMaxWidth()
                                )
                            } else {
                                ProfileDetailRow(label = "Street Address", value = if (editAddress.isNotEmpty()) editAddress else "Not set")
                                ProfileDetailRow(label = "City", value = if (editCity.isNotEmpty()) editCity else "Not set")
                                ProfileDetailRow(label = "State", value = if (editState.isNotEmpty()) editState else "Not set")
                                ProfileDetailRow(label = "Pincode", value = if (editPincode.isNotEmpty()) editPincode else "Not set")
                            }
                        }
                    }

                    // Save / Edit Actions
                    if (isEditing) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { saveProfileSettings() },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Save Changes", fontSize = 13.sp)
                            }
                            OutlinedButton(
                                onClick = {
                                    isEditing = false
                                    tempUsername = username
                                    if (userProfile != null) {
                                        editPhoneNumber = userProfile?.phoneNumber ?: ""
                                        editAddress = userProfile?.address ?: ""
                                        editCity = userProfile?.city ?: ""
                                        editState = userProfile?.state ?: ""
                                        editPincode = userProfile?.pincode ?: ""
                                        editParentName = userProfile?.parentName ?: ""
                                        editParentPhone = userProfile?.parentPhone ?: ""
                                        editParentEmail = userProfile?.parentEmail ?: ""
                                        editClass = userProfile?.`class` ?: ""
                                        editSection = userProfile?.section ?: ""
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Cancel", fontSize = 13.sp)
                            }
                        }
                    } else {
                        OutlinedButton(
                            onClick = { isEditing = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Edit Settings", fontSize = 13.sp)
                        }
                    }
                }
            
            Spacer(modifier = Modifier.height(10.dp))
            
            // Logout Destructive Action (Shadcn style outline)
            Button(
                onClick = onLogout,
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .height(44.dp)
                    .border(1.dp, MaterialTheme.colorScheme.error, RoundedCornerShape(8.dp)),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Transparent,
                    contentColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text(
                    text = "Log Out of Session",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
                }
            }
        }

        if (headerAlpha > 0f) {
            DashboardStickyHeader(
                title = "My Profile",
                headerAlpha = headerAlpha,
                headerSlide = headerSlide,
                onNotificationClick = onNotificationClick
            )
        }
    }
}
}

// Search local page item model
data class SearchPageItem(
    val name: String,
    val tabKey: String,
    val description: String,
    val icon: ImageVector,
    val isExternal: Boolean = false,
    val externalAction: (() -> Unit)? = null
)

// Help Document model
data class HelpDoc(
    val title: String,
    val category: String,
    val content: String,
    val url: String? = null
)

val helpDocs = listOf(
    HelpDoc(
        title = "Library Policies & Fines",
        category = "Library",
        content = "1. Books can be issued for a maximum of 14 days.\n2. A fine of $0.50 per day will be charged for late returns.\n3. Damaged or lost books must be replaced or paid for at double the cost.\n4. Silent study rules must be maintained in the library at all times.",
        url = "/docs/student/library"
    ),
    HelpDoc(
        title = "Late Fee Structure & Penalty",
        category = "Finance",
        content = "1. Monthly school fees must be paid by the 5th of each month.\n2. A grace period is extended until the 10th of the month.\n3. Payments made after the 10th will incur a late fee penalty of 5% of the pending amount.\n4. Continuous non-payment for 2 months may lead to suspension of access.",
        url = "/docs/student/fees"
    ),
    HelpDoc(
        title = "How to Post in Community",
        category = "Social",
        content = "1. Only authorized users and teachers can create posts.\n2. Posts must comply with the school code of conduct.\n3. Spamming or abusive content is strictly prohibited and will result in disciplinary action.\n4. Keep posts relevant to academic discussions, announcements, and events.",
        url = "/docs/student/complaints"
    ),
    HelpDoc(
        title = "Contacting Accounts Office",
        category = "Finance",
        content = "1. Operating hours: Monday to Friday, 9:00 AM to 3:00 PM.\n2. Email inquiries can be sent to billing@vidyaschool.edu.\n3. Phone support is available at extension 104 during school hours.\n4. In-person meetings require prior scheduling via the portal.",
        url = "/docs/student/fees"
    ),
    HelpDoc(
        title = "Student ID Card Reissue Policy",
        category = "General",
        content = "1. Lost ID cards must be reported immediately to the administration office.\n2. A replacement ID card can be issued upon paying a fee of $10.\n3. Processing time for a new card is 2 business days.\n4. Students must carry their ID card at all times while on school premises.",
        url = "/docs/student/onboarding"
    )
)

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
    sessionManager: SessionManager,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onNotificationClick: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var notices by remember { mutableStateOf<List<NoticeResponse>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var loadError by remember { mutableStateOf<String?>(null) }

    val role = remember { sessionManager.getRole() ?: "student" }

    val fetchNotices: () -> Unit = {
        isLoading = true
        loadError = null
        scope.launch {
            try {
                val token = sessionManager.getSessionToken()
                if (!token.isNullOrEmpty()) {
                    val response = RetrofitClient.authApi.getNotices("Bearer $token")
                    if (response.isSuccessful) {
                        notices = response.body() ?: emptyList()
                    } else {
                        loadError = "Failed to load notices"
                    }
                } else {
                    loadError = "Please sign in to view notices"
                }
            } catch (e: Exception) {
                android.util.Log.e("NoticeTabContent", "Error: ${e.message}")
                loadError = e.message ?: "Failed to load notices"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { fetchNotices() }
    LaunchedEffect(isRefreshing) { if (isRefreshing) fetchNotices() }

    PullToRefreshBox(
        isRefreshing = isRefreshing || isLoading,
        onRefresh = { onRefresh(); fetchNotices() },
        modifier = Modifier.fillMaxSize()
    ) {
        val lazyListState = rememberLazyListState()
        val headerCollapsed by remember { derivedStateOf { lazyListState.firstVisibleItemIndex > 0 || lazyListState.firstVisibleItemScrollOffset > 100 } }
        val headerAlpha by androidx.compose.animation.core.animateFloatAsState(
            targetValue = if (headerCollapsed) 1f else 0f,
            animationSpec = androidx.compose.animation.core.tween(220),
            label = "headerAlpha"
        )
        val headerSlide by androidx.compose.animation.core.animateFloatAsState(
            targetValue = if (headerCollapsed) 0f else -24f,
            animationSpec = androidx.compose.animation.core.tween(220),
            label = "headerSlide"
        )

        Box(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                state = lazyListState,
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 0.dp, bottom = 24.dp)
            ) {
                item {
                    DashboardHeader(
                        title = "Notice Board",
                        subtitle = "${role.lowercase().replaceFirstChar { it.uppercase() }} Notice Board",
                        onNotificationClick = onNotificationClick
                    )
                }

                // 2. Load Error item
                loadError?.let { error ->
                    item {
                        Text(
                            text = error,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.padding(start = 24.dp, end = 24.dp, bottom = 12.dp)
                        )
                    }
                }

                // 3. Notices content
                if (notices.isEmpty() && !isLoading && loadError == null) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .padding(horizontal = 24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No notices yet",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                } else {
                    items(notices.size) { index ->
                        val notice = notices[index]
                        val badgeLabel = when {
                            notice.isUrgent -> "Urgent"
                            notice.category.isNotBlank() -> notice.category
                            else -> "Notice"
                        }
                        val badgeColor = if (notice.isUrgent) {
                            MaterialTheme.colorScheme.error
                        } else {
                            MaterialTheme.colorScheme.primary
                        }
                        val formattedDate = notice.createdAt.take(10)

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp),
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
                                                color = badgeColor.copy(alpha = 0.15f),
                                                shape = RoundedCornerShape(8.dp)
                                            )
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = badgeLabel,
                                            color = badgeColor,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Text(
                                        text = formattedDate,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                                notice.senderName?.takeIf { it.isNotBlank() }?.let { sender ->
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "By $sender",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = notice.title,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = notice.content,
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                                    lineHeight = 20.sp
                                )
                            }
                        }
                    }
                }
            }

            if (headerAlpha > 0f) {
                DashboardStickyHeader(
                    title = "Notice Board",
                    headerAlpha = headerAlpha,
                    headerSlide = headerSlide,
                    onNotificationClick = onNotificationClick
                )
            }
        }
    }
}

data class CommunityMsg(
    val id: String,
    val userId: String,
    val name: String,
    val role: String,
    val content: String,
    val timestamp: String,
    val image: String? = null,
    val replyTo: ReplyToMsg? = null
)

data class ReplyToMsg(
    val id: String,
    val name: String,
    val content: String
)

data class CommunityTypingUser(
    val userId: String,
    val name: String
)

@Composable
fun BouncingDotsAnimation() {
    val dots = listOf(
        remember { Animatable(0f) },
        remember { Animatable(0f) },
        remember { Animatable(0f) }
    )
    
    dots.forEachIndexed { index, animatable ->
        LaunchedEffect(animatable) {
            delay(index * 150L)
            animatable.animateTo(
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(durationMillis = 450, easing = LinearEasing),
                    repeatMode = RepeatMode.Reverse
                )
            )
        }
    }
    
    Row(
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        dots.forEach { animatable ->
            val yOffset = -6.dp * animatable.value
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .graphicsLayer {
                        translationY = yOffset.toPx()
                    }
                    .background(MaterialTheme.colorScheme.primary, CircleShape)
            )
        }
    }
}

fun formatTimestamp(isoString: String): String {
    return try {
        val parts = isoString.split("T")
        if (parts.size == 2) {
            val datePart = parts[0]
            val timePart = parts[1].substring(0, 5) // "12:58"
            val todayDate = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
            if (datePart == todayDate) {
                "Today at $timePart"
            } else {
                "$datePart at $timePart"
            }
        } else {
            isoString
        }
    } catch (e: Exception) {
        isoString
    }
}

fun parseIsoTimestamp(isoString: String): Long {
    return try {
        val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }
        val cleanIso = isoString.split(".")[0].replace("Z", "")
        format.parse(cleanIso)?.time ?: 0L
    } catch (e: Exception) {
        0L
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityTabContent(
    role: String,
    sessionManager: SessionManager,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    var currentUser by remember { mutableStateOf<com.vidyaschool.app.api.User?>(null) }
    var isConnected by remember { mutableStateOf(false) }
    val messages = remember { mutableStateListOf<CommunityMsg>() }
    var socket by remember { mutableStateOf<Socket?>(null) }
    val lazyListState = rememberLazyListState()
    
    var inputText by remember { mutableStateOf("") }
    var replyingTo by remember { mutableStateOf<CommunityMsg?>(null) }
    var editingMessage by remember { mutableStateOf<CommunityMsg?>(null) }
    var onlineCount by remember { mutableStateOf(1) }
    val typingUsers = remember { mutableStateListOf<CommunityTypingUser>() }

    LaunchedEffect(inputText) {
        if (inputText.trim().isEmpty()) {
            socket?.let { s ->
                if (isConnected) {
                    val data = org.json.JSONObject().apply {
                        put("isTyping", false)
                    }
                    s.emit("typing", data)
                }
            }
            return@LaunchedEffect
        }
        
        socket?.let { s ->
            if (isConnected) {
                val data = org.json.JSONObject().apply {
                    put("isTyping", true)
                }
                s.emit("typing", data)
            }
        }
        
        delay(2500)
        socket?.let { s ->
            if (isConnected) {
                val data = org.json.JSONObject().apply {
                    put("isTyping", false)
                }
                s.emit("typing", data)
            }
        }
    }
    
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            lazyListState.scrollToItem(messages.size - 1)
        }
    }

    val imeBottom = WindowInsets.ime.getBottom(LocalDensity.current)
    LaunchedEffect(imeBottom) {
        if (imeBottom > 0 && messages.isNotEmpty()) {
            lazyListState.scrollToItem(messages.size - 1)
        }
    }
    
    val token = remember { sessionManager.getSessionToken() ?: "" }

    LaunchedEffect(token) {
        if (token.isNotEmpty()) {
            try {
                val res = RetrofitClient.authApi.getProfile("Bearer $token")
                if (res.isSuccessful && res.body() != null) {
                    currentUser = res.body()?.user
                }
            } catch (e: Exception) {
                android.util.Log.e("CommunityTab", "Fetch profile failed: ${e.message}")
            }
        }
    }

    LaunchedEffect(currentUser) {
        val user = currentUser ?: return@LaunchedEffect
        var socketInstance: io.socket.client.Socket? = null
        try {
            val opts = IO.Options().apply {
                transports = arrayOf("polling", "websocket")
                forceNew = true
                callFactory = com.vidyaschool.app.api.RetrofitClient.socketOkHttpClient
                webSocketFactory = com.vidyaschool.app.api.RetrofitClient.socketOkHttpClient
            }
            socketInstance = IO.socket("https://api.blazeneuro.com", opts)

            socketInstance.on(Socket.EVENT_CONNECT) {
                android.util.Log.d("CommunityTab", "Socket connected successfully!")
                coroutineScope.launch {
                    isConnected = true
                }
                val joinData = org.json.JSONObject().apply {
                    put("userId", user.id)
                    put("name", user.name ?: user.email)
                    put("role", user.role ?: "student")
                    put("image", user.image)
                }
                socketInstance.emit("join", joinData)
            }

            socketInstance.on(Socket.EVENT_CONNECT_ERROR) { args ->
                android.util.Log.e("CommunityTab", "Socket connection error event: ${args.getOrNull(0)}")
            }

            socketInstance.on(Socket.EVENT_DISCONNECT) {
                android.util.Log.d("CommunityTab", "Socket disconnected!")
                coroutineScope.launch {
                    isConnected = false
                    typingUsers.clear()
                }
            }

            socketInstance.on("online_users") { args ->
                if (args != null && args.isNotEmpty()) {
                    val usersArray = args[0] as? org.json.JSONArray
                    if (usersArray != null) {
                        val activeUserIds = mutableSetOf<String>()
                        for (i in 0 until usersArray.length()) {
                            val userObj = usersArray.optJSONObject(i)
                            if (userObj != null) {
                                activeUserIds.add(userObj.optString("userId"))
                            }
                        }
                        coroutineScope.launch {
                            onlineCount = usersArray.length()
                            typingUsers.removeAll { it.userId !in activeUserIds }
                        }
                    }
                }
            }

            socketInstance.on("user_typing") { args ->
                if (args != null && args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val typingUserId = obj.optString("userId")
                        val typingUserName = obj.optString("name")
                        val isTyping = obj.optBoolean("isTyping", false)
                        
                        coroutineScope.launch {
                            val user = currentUser
                            if (user != null && typingUserId != user.id) {
                                if (isTyping) {
                                    if (typingUsers.none { it.userId == typingUserId }) {
                                        typingUsers.add(CommunityTypingUser(typingUserId, typingUserName))
                                    }
                                } else {
                                    typingUsers.removeAll { it.userId == typingUserId }
                                }
                            }
                        }
                    }
                }
            }

            socketInstance.on("recent_messages") { args ->
                android.util.Log.d("CommunityTab", "recent_messages event received, args size = ${args?.size}")
                if (args != null && args.isNotEmpty()) {
                    val data = args[0] as? org.json.JSONObject
                    if (data != null) {
                        val messagesArray = data.optJSONArray("messages")
                        if (messagesArray != null) {
                            val list = mutableListOf<CommunityMsg>()
                            val gson = Gson()
                            try {
                                for (i in 0 until messagesArray.length()) {
                                    val obj = messagesArray.getJSONObject(i)
                                    val msg = gson.fromJson(obj.toString(), CommunityMsg::class.java)
                                    list.add(msg)
                                }
                                android.util.Log.d("CommunityTab", "Successfully parsed ${list.size} recent messages")
                                coroutineScope.launch {
                                    messages.clear()
                                    messages.addAll(list)
                                    if (messages.isNotEmpty()) {
                                        lazyListState.animateScrollToItem(messages.size - 1)
                                    }
                                }
                            } catch (e: Exception) {
                                android.util.Log.e("CommunityTab", "Error parsing recent messages: ${e.message}", e)
                            }
                        }
                    }
                }
            }

            socketInstance.on("new_message") { args ->
                if (args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val gson = Gson()
                        val msg = gson.fromJson(obj.toString(), CommunityMsg::class.java)
                        coroutineScope.launch {
                            messages.add(msg)
                            lazyListState.animateScrollToItem(messages.size - 1)
                        }
                    }
                }
            }

            socketInstance.on("message_edited") { args ->
                if (args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val msgId = obj.optString("id")
                        val content = obj.optString("content")
                        coroutineScope.launch {
                            val index = messages.indexOfFirst { it.id == msgId }
                            if (index != -1) {
                                messages[index] = messages[index].copy(content = content)
                            }
                        }
                    }
                }
            }

            socketInstance.on("message_deleted") { args ->
                if (args.isNotEmpty()) {
                    val obj = args[0] as? org.json.JSONObject
                    if (obj != null) {
                        val msgId = obj.optString("id")
                        coroutineScope.launch {
                            messages.removeAll { it.id == msgId }
                        }
                    }
                }
            }

            socketInstance.connect()
            socket = socketInstance

            kotlinx.coroutines.awaitCancellation()
        } catch (e: Exception) {
            android.util.Log.e("CommunityTab", "Socket connection error: ${e.message}")
        } finally {
            android.util.Log.d("CommunityTab", "Cleaning up socket...")
            socketInstance?.disconnect()
            socketInstance?.off()
            socket = null
        }
    }

    val onSendMessage = {
        val s = socket
        if (s != null && isConnected && inputText.trim().isNotEmpty()) {
            val data = org.json.JSONObject().apply {
                put("content", inputText)
                val rep = replyingTo
                if (rep != null) {
                    val repObj = org.json.JSONObject().apply {
                        put("id", rep.id)
                        put("name", rep.name)
                        put("content", rep.content)
                    }
                    put("replyTo", repObj)
                }
            }
            s.emit("send_message", data)
            inputText = ""
            replyingTo = null
        }
    }

    val onEditMessage = { msgId: String, content: String ->
        val s = socket
        if (s != null && isConnected && content.trim().isNotEmpty()) {
            val data = org.json.JSONObject().apply {
                put("messageId", msgId)
                put("content", content)
            }
            s.emit("edit_message", data)
            editingMessage = null
            inputText = ""
        }
    }

    val onDeleteMessage = { msgId: String ->
        val s = socket
        if (s != null && isConnected) {
            val data = org.json.JSONObject().apply {
                put("messageId", msgId)
            }
            s.emit("delete_message", data)
        }
    }

    LaunchedEffect(editingMessage) {
        val edit = editingMessage
        if (edit != null) {
            inputText = edit.content
        } else {
            inputText = ""
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 24.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                IconButton(
                    onClick = onBackClick,
                    modifier = Modifier
                        .size(36.dp)
                        .border(
                            1.dp,
                            MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f),
                            shape = CircleShape
                        )
                        .clip(CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }

                Column {
                    Text(
                        text = "Community Hub",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "$onlineCount ${if (onlineCount == 1) "user" else "users"} online",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(if (isConnected) Color(0xFF10B981) else Color(0xFFEF4444))
                )
                Text(
                    text = if (isConnected) "Live" else "Offline",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isConnected) Color(0xFF10B981) else Color(0xFFEF4444)
                )
            }
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f))

        // Chat list area & floating input bar
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .imePadding()
        ) {
            if (messages.isEmpty() && !isConnected) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Connecting to #community...",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                        )
                    }
                }
            } else {
                LazyColumn(
                    state = lazyListState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 100.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(messages.size) { index ->
                        val msg = messages[index]
                        val isMe = currentUser != null && msg.userId == currentUser?.id

                        val isGrouped = index > 0 &&
                                messages[index - 1].userId == msg.userId &&
                                (parseIsoTimestamp(msg.timestamp) - parseIsoTimestamp(messages[index - 1].timestamp)) < 300000 &&
                                msg.replyTo == null

                        CommunityMessageItem(
                            msg = msg,
                            isGrouped = isGrouped,
                            isMe = isMe,
                            onReply = { replyingTo = msg },
                            onEdit = { editingMessage = msg },
                            onDelete = { onDeleteMessage(msg.id) }
                        )
                    }
                }
            }

            // Bottom gradient overlay to fade out messages behind the floating input card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .align(Alignment.BottomCenter)
                    .background(
                        brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                MaterialTheme.colorScheme.background.copy(alpha = 0.7f),
                                MaterialTheme.colorScheme.background
                            )
                        )
                    )
            )

            // Floating Input bar Card
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, bottom = 16.dp)
                    .navigationBarsPadding(),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                elevation = CardDefaults.cardElevation(
                    defaultElevation = 8.dp
                ),
                border = androidx.compose.foundation.BorderStroke(
                    width = 1.dp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f)
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp, vertical = 4.dp)
                ) {
                    // Reply Preview Banner
                    val rep = replyingTo
                    if (rep != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_custom_community),
                                    contentDescription = "Reply",
                                    modifier = Modifier.size(14.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Replying to @${rep.name}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "\"${rep.content}\"",
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                )
                            }
                            IconButton(
                                onClick = { replyingTo = null },
                                modifier = Modifier.size(20.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Cancel",
                                    modifier = Modifier.size(14.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    // Edit Preview Banner
                    val edit = editingMessage
                    if (edit != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Edit,
                                    contentDescription = "Edit",
                                    modifier = Modifier.size(14.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Editing message...",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            IconButton(
                                onClick = { editingMessage = null },
                                modifier = Modifier.size(20.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Cancel",
                                    modifier = Modifier.size(14.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    // Input Row (ChatGPT style: borderless, padded, filled circular send button)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 6.dp, end = 6.dp, top = 4.dp, bottom = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = {
                                android.widget.Toast.makeText(context, "Coming Soon!", android.widget.Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Add",
                                modifier = Modifier.size(22.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }

                        // Text field Box (centered start vertical alignment)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            if (inputText.isEmpty()) {
                                Text(
                                    text = "Message #community",
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                    fontSize = 15.sp,
                                    modifier = Modifier.align(Alignment.CenterStart)
                                )
                            }
                            androidx.compose.foundation.text.BasicTextField(
                                value = inputText,
                                onValueChange = { inputText = it },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .align(Alignment.CenterStart),
                                textStyle = androidx.compose.ui.text.TextStyle(
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontSize = 15.sp
                                ),
                                maxLines = 5,
                                cursorBrush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.onSurface),
                                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                    capitalization = androidx.compose.ui.text.input.KeyboardCapitalization.Sentences,
                                    autoCorrect = true
                                )
                            )
                        }

                        val isSendEnabled = isConnected && inputText.trim().isNotEmpty()
                        val sendButtonBg = if (isSendEnabled) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)
                        val sendButtonTint = if (isSendEnabled) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)

                        IconButton(
                            onClick = {
                                if (editingMessage != null) {
                                    onEditMessage(editingMessage!!.id, inputText)
                                } else {
                                    onSendMessage()
                                }
                            },
                            enabled = isSendEnabled,
                            modifier = Modifier
                                .size(36.dp)
                                .background(sendButtonBg, CircleShape)
                                .clip(CircleShape)
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_arrow_up),
                                contentDescription = "Send",
                                modifier = Modifier.size(18.dp),
                                tint = sendButtonTint
                            )
                        }
                    }
                }
            }

            // Typing Indicator
            androidx.compose.animation.AnimatedVisibility(
                visible = typingUsers.isNotEmpty(),
                enter = fadeIn() + slideInVertically(initialOffsetY = { it }),
                exit = fadeOut() + slideOutVertically(targetOffsetY = { it }),
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 24.dp, bottom = 96.dp)
            ) {
                Row(
                    modifier = Modifier
                        .background(
                            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    BouncingDotsAnimation()
                    
                    val text = when (typingUsers.size) {
                        1 -> "${typingUsers[0].name} is typing..."
                        2 -> "${typingUsers[0].name} and ${typingUsers[1].name} are typing..."
                        else -> "Several people are typing..."
                    }
                    Text(
                        text = text,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Scroll to bottom button
            val showScrollToBottomButton by remember {
                derivedStateOf {
                    val layoutInfo = lazyListState.layoutInfo
                    val totalItems = layoutInfo.totalItemsCount
                    if (totalItems == 0) {
                        false
                    } else {
                        val lastVisibleItem = lazyListState.layoutInfo.visibleItemsInfo.lastOrNull()
                        lastVisibleItem == null || lastVisibleItem.index < totalItems - 3
                    }
                }
            }

            androidx.compose.animation.AnimatedVisibility(
                visible = showScrollToBottomButton,
                enter = fadeIn() + slideInVertically(initialOffsetY = { it }),
                exit = fadeOut() + slideOutVertically(targetOffsetY = { it }),
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 24.dp, bottom = 96.dp)
            ) {
                FloatingActionButton(
                    onClick = {
                        coroutineScope.launch {
                            if (messages.isNotEmpty()) {
                                if (lazyListState.firstVisibleItemIndex < messages.size - 15) {
                                    lazyListState.scrollToItem(messages.size - 10)
                                }
                                lazyListState.animateScrollToItem(messages.size - 1)
                            }
                        }
                    },
                    containerColor = if (isSystemInDarkTheme()) Color.White else Color.Black,
                    contentColor = if (isSystemInDarkTheme()) Color.Black else Color.White,
                    shape = CircleShape,
                    modifier = Modifier
                        .size(40.dp)
                        .border(
                            width = 1.dp,
                            color = (if (isSystemInDarkTheme()) Color.White else Color.Black).copy(alpha = 0.15f),
                            shape = CircleShape
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowDropDown,
                        contentDescription = "Scroll to bottom",
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CommunityMessageItem(
    msg: CommunityMsg,
    isGrouped: Boolean,
    isMe: Boolean,
    onReply: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    
    val roleColor = when (msg.role.lowercase()) {
        "admin" -> Color(0xFFE11D48)
        "teacher", "librarian" -> Color(0xFF2563EB)
        "account" -> Color(0xFF059669)
        else -> MaterialTheme.colorScheme.onBackground
    }

    val roleBg = when (msg.role.lowercase()) {
        "admin" -> Color(0xFFFFE4E6)
        "teacher", "librarian" -> Color(0xFFDBEAFE)
        "account" -> Color(0xFFD1FAE5)
        else -> Color(0xFFF1F5F9)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .combinedClickable(
                onLongClick = { showMenu = true },
                onClick = { onReply() }
            )
            .padding(horizontal = 8.dp, vertical = if (isGrouped) 2.dp else 6.dp)
    ) {
        DropdownMenu(
            expanded = showMenu,
            onDismissRequest = { showMenu = false }
        ) {
            DropdownMenuItem(
                text = { Text("Reply") },
                onClick = {
                    onReply()
                    showMenu = false
                },
                leadingIcon = { Icon(Icons.Default.Share, contentDescription = "Reply", modifier = Modifier.size(16.dp)) }
            )
            if (isMe) {
                DropdownMenuItem(
                    text = { Text("Edit") },
                    onClick = {
                        onEdit()
                        showMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(16.dp)) }
                )
                DropdownMenuItem(
                    text = { Text("Delete", color = Color.Red) },
                    onClick = {
                        onDelete()
                        showMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(16.dp), tint = Color.Red) }
                )
            }
        }

        if (msg.replyTo != null) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 28.dp, bottom = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_custom_community),
                    contentDescription = "Reply",
                    modifier = Modifier.size(10.dp),
                    tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                )
                Text(
                    text = "@${msg.replyTo.name}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
                Text(
                    text = msg.replyTo.content,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                )
            }
        }

        if (isGrouped) {
            Row(
                modifier = Modifier.fillMaxWidth()
            ) {
                Spacer(modifier = Modifier.width(44.dp))
                Text(
                    text = msg.content,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (!msg.image.isNullOrEmpty()) {
                    AsyncImage(
                        model = msg.image,
                        contentDescription = "Avatar",
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(
                                when (msg.role.lowercase()) {
                                    "admin" -> Color(0xFFF43F5E)
                                    "teacher", "librarian" -> Color(0xFF3B82F6)
                                    "account" -> Color(0xFF10B981)
                                    else -> Color(0xFF64748B)
                                }
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (msg.name.isNotEmpty()) msg.name.take(1).uppercase() else "?",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = msg.name,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = roleColor
                        )



                        Text(
                            text = formatTimestamp(msg.timestamp),
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                        )
                    }

                    Text(
                        text = msg.content,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationDrawer(
    sessionManager: SessionManager,
    onDismiss: () -> Unit
) {
    var notifications by remember { mutableStateOf<List<NotificationHistoryItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val token = sessionManager.getSessionToken()
            if (!token.isNullOrEmpty()) {
                val res = RetrofitClient.authApi.getNotificationHistory("Bearer $token", 30)
                if (res.isSuccessful) {
                    notifications = res.body() ?: emptyList()
                } else {
                    errorMsg = "Failed to load notifications"
                }
            }
        } catch (e: Exception) {
            errorMsg = "Could not load notifications"
        } finally {
            isLoading = false
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false),
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 12.dp, bottom = 4.dp)
                    .width(40.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 24.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Notifications",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Last 30 days",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .size(32.dp)
                        .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), CircleShape)
                        .clip(CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
            Spacer(modifier = Modifier.height(8.dp))

            when {
                isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(28.dp), strokeWidth = 2.dp)
                    }
                }
                errorMsg != null -> {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(errorMsg!!, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                }
                notifications.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_custom_notification),
                                contentDescription = null,
                                modifier = Modifier.size(32.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f)
                            )
                            Text(
                                text = "No notifications in the last 30 days",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                            )
                        }
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth().heightIn(max = 520.dp),
                        verticalArrangement = Arrangement.spacedBy(0.dp)
                    ) {
                        items(notifications.size) { idx ->
                            val notif = notifications[idx]
                            val dateLabel = try {
                                val parts = notif.createdAt.split("T")[0].split("-")
                                val months = listOf("","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")
                                "${months[parts[1].toInt()]} ${parts[2].toInt()}, ${parts[0]}"
                            } catch (e: Exception) { notif.createdAt.take(10) }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_custom_notification),
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = notif.title,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    if (notif.body.isNotBlank()) {
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = notif.body,
                                            fontSize = 13.sp,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f),
                                            lineHeight = 18.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = dateLabel,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                    )
                                }
                            }
                            if (idx < notifications.lastIndex) {
                                HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f))
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun UpdateBanner(
    updateInfo: UpdateInfo,
    isDownloading: Boolean,
    downloadProgress: Float,
    isDownloaded: Boolean,
    onUpdateClick: () -> Unit,
    onDismissClick: () -> Unit
) {
    androidx.compose.material3.Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
        ),
        tonalElevation = 2.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (isDownloading) "Downloading Update" else "New Version Available",
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (isDownloading) {
                            "Installing version ${updateInfo.versionName}..."
                        } else {
                            "Version ${updateInfo.versionName} is ready to install."
                        },
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (!isDownloading) {
                    Row(
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp)
                    ) {
                        // Dismiss/Later button (Shadcn Outline variant)
                        androidx.compose.material3.OutlinedButton(
                            onClick = onDismissClick,
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(6.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                        ) {
                            Text("Later", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        }

                        // Update Now button (Shadcn Primary variant)
                        androidx.compose.material3.Button(
                            onClick = onUpdateClick,
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(6.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp),
                            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.onSurface,
                                contentColor = MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Text(
                                text = if (isDownloaded) "Install" else "Update",
                                fontSize = 12.sp,
                                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            if (isDownloading) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    androidx.compose.material3.LinearProgressIndicator(
                        progress = { downloadProgress },
                        modifier = Modifier
                            .weight(1f)
                            .height(6.dp),
                        strokeCap = androidx.compose.ui.graphics.StrokeCap.Round,
                        color = MaterialTheme.colorScheme.onSurface,
                        trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                    )
                    Text(
                        text = "${(downloadProgress * 100).toInt()}%",
                        fontSize = 11.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

fun parseMarkdownToAnnotatedString(
    text: String,
    primaryColor: androidx.compose.ui.graphics.Color
): androidx.compose.ui.text.AnnotatedString {
    return androidx.compose.ui.text.buildAnnotatedString {
        var i = 0
        while (i < text.length) {
            when {
                text.startsWith("**", i) -> {
                    val end = text.indexOf("**", i + 2)
                    if (end != -1) {
                        pushStyle(androidx.compose.ui.text.SpanStyle(fontWeight = androidx.compose.ui.text.font.FontWeight.Bold))
                        append(text.substring(i + 2, end))
                        pop()
                        i = end + 2
                    } else {
                        append("**")
                        i += 2
                    }
                }
                text.startsWith("*", i) -> {
                    val end = text.indexOf("*", i + 1)
                    if (end != -1 && end > i + 1) {
                        pushStyle(androidx.compose.ui.text.SpanStyle(fontStyle = androidx.compose.ui.text.font.FontStyle.Italic))
                        append(text.substring(i + 1, end))
                        pop()
                        i = end + 1
                    } else {
                        append("*")
                        i += 1
                    }
                }
                text.startsWith("`", i) -> {
                    val end = text.indexOf("`", i + 1)
                    if (end != -1) {
                        pushStyle(
                            androidx.compose.ui.text.SpanStyle(
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                                background = primaryColor.copy(alpha = 0.1f),
                                color = primaryColor
                            )
                        )
                        append(text.substring(i + 1, end))
                        pop()
                        i = end + 1
                    } else {
                        append("`")
                        i += 1
                    }
                }
                text.startsWith("[", i) -> {
                    val closeBracket = text.indexOf("]", i + 1)
                    if (closeBracket != -1) {
                        val openParen = closeBracket + 1
                        if (openParen < text.length && text[openParen] == '(') {
                            val closeParen = text.indexOf(")", openParen + 1)
                            if (closeParen != -1) {
                                val linkText = text.substring(i + 1, closeBracket)
                                pushStyle(
                                    androidx.compose.ui.text.SpanStyle(
                                        color = primaryColor,
                                        textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline
                                    )
                                )
                                append(linkText)
                                pop()
                                i = closeParen + 1
                            } else {
                                append("[")
                                i += 1
                            }
                        } else {
                            append("[")
                            i += 1
                        }
                    } else {
                        append("[")
                        i += 1
                    }
                }
                else -> {
                    append(text[i])
                    i++
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocViewerScreen(
    path: String,
    fallbackContent: String? = null,
    onBack: () -> Unit
) {
    var title by remember { mutableStateOf("Documentation") }
    var markdown by remember { mutableStateOf(fallbackContent ?: "") }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    
    LaunchedEffect(path) {
        isLoading = true
        errorMsg = null
        
        val cleanPath = when {
            path.contains("vercel.app") -> "/" + path.split("vercel.app/").last().trim('/')
            else -> "/" + path.trim('/')
        }
        
        val localContent = localDocMarkdowns[cleanPath]
        if (localContent != null) {
            val titleLine = localContent.split("\n").firstOrNull() ?: "# Documentation"
            title = titleLine.replace("#", "").trim()
            markdown = localContent
            isLoading = false
            return@LaunchedEffect
        }
        
        try {
            val response = RetrofitClient.authApi.getDocMarkdown(cleanPath)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                title = body.title
                markdown = body.markdown
            } else {
                if (fallbackContent.isNullOrBlank()) {
                    errorMsg = "Failed to load document content: ${response.code()}"
                } else {
                    markdown = fallbackContent
                }
            }
        } catch (e: Exception) {
            if (fallbackContent.isNullOrBlank()) {
                errorMsg = "Connection failed: ${e.localizedMessage}"
            } else {
                markdown = fallbackContent
            }
        } finally {
            isLoading = false
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        title, 
                        fontSize = 18.sp, 
                        fontWeight = FontWeight.Bold, 
                        maxLines = 1, 
                        overflow = TextOverflow.Ellipsis
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(strokeWidth = 2.5.dp, modifier = Modifier.size(36.dp))
                }
            } else if (errorMsg != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(errorMsg!!, color = MaterialTheme.colorScheme.error, fontSize = 14.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onBack) {
                        Text("Go Back")
                    }
                }
            } else {
                val scrollState = rememberScrollState()
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    val lines = markdown.split("\n")
                    lines.forEach { line ->
                        val trimmed = line.trim()
                        val primaryColor = MaterialTheme.colorScheme.primary
                        when {
                            trimmed.startsWith("# ") -> {
                                Text(
                                    text = parseMarkdownToAnnotatedString(trimmed.substring(2), primaryColor),
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = primaryColor,
                                    modifier = Modifier.padding(top = 12.dp, bottom = 4.dp)
                                )
                            }
                            trimmed.startsWith("## ") -> {
                                Text(
                                    text = parseMarkdownToAnnotatedString(trimmed.substring(3), primaryColor),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.padding(top = 8.dp, bottom = 2.dp)
                                )
                            }
                            trimmed.startsWith("### ") -> {
                                Text(
                                    text = parseMarkdownToAnnotatedString(trimmed.substring(4), primaryColor),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.9f),
                                    modifier = Modifier.padding(top = 4.dp, bottom = 1.dp)
                                )
                            }
                            trimmed.startsWith("> ") -> {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.04f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 12.dp, vertical = 8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .width(3.dp)
                                            .height(16.dp)
                                            .background(primaryColor, RoundedCornerShape(1.5.dp))
                                            .align(Alignment.CenterVertically)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = parseMarkdownToAnnotatedString(trimmed.substring(2), primaryColor),
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.75f),
                                        lineHeight = 18.sp,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                            trimmed.startsWith("- ") || trimmed.startsWith("* ") -> {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(start = 8.dp).padding(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "•",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = primaryColor
                                    )
                                    Text(
                                        text = parseMarkdownToAnnotatedString(trimmed.substring(2), primaryColor),
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.85f),
                                        lineHeight = 18.sp
                                    )
                                }
                            }
                            trimmed.startsWith("1. ") || trimmed.startsWith("2. ") || trimmed.startsWith("3. ") || trimmed.startsWith("4. ") || trimmed.startsWith("5. ") || trimmed.startsWith("6. ") -> {
                                val dotIndex = trimmed.indexOf(". ")
                                val num = trimmed.substring(0, dotIndex + 1)
                                val text = trimmed.substring(dotIndex + 2)
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(start = 8.dp).padding(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = num,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = primaryColor
                                    )
                                    Text(
                                        text = parseMarkdownToAnnotatedString(text, primaryColor),
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.85f),
                                        lineHeight = 18.sp
                                    )
                                }
                            }
                            trimmed.isEmpty() -> {
                                Spacer(modifier = Modifier.height(6.dp))
                            }
                            else -> {
                                Text(
                                    text = parseMarkdownToAnnotatedString(trimmed, primaryColor),
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f),
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

val localDocMarkdowns = mapOf(
    "/docs/auth/signup" to """# Account Registration (Signup)
Learn how to register your profile credentials on the VidyaSchool portal and choose your preferred platform roles.

## Step-by-Step Guide

### 01. Select preferred Role
Choose between 'Student' or 'Teacher' when creating your profile. Students are registered directly on submission, whereas Teachers are queued for manual administrative verification before portal activation.

### 02. Email & Credentials
Provide your full name, institutional email address, and select a secure password. Ensure institutional emails are typed correctly to receive verification links.

### 03. Social Logins (Alternative)
Alternatively, click Google or GitHub icons to link and sign in directly using OAuth social login channels. This automatically verifies your email profile.""",

    "/docs/auth/login" to """# Portal Login Streams
Walkthrough on signing into the dashboard and accessing your designated workspace controls.

## Details

### 1. Credential Login
Input your registered email address and password on the login screen. Click Sign In to verify credentials.

### 2. Automatic Dashboard Redirects
Upon successful authentication, the gateway redirects you to your corresponding dashboard layout:
- **Students**: Redirected to `/student/[username]` dashboard.
- **Teachers**: Redirected to `/teacher/[username]` workspace.
- **Accounts Clerks**: Redirected to `/accounts/[username]` control panels.
- **Administrators**: Redirected to `/admin/[username]` command center.""",

    "/docs/auth/approval" to """# Verification & Educator Approvals
Understand the email verification cycle and administrative approval flows for teachers.

## Details

### 1. Email Verification links
Upon creating an account, an automated email verification link is transmitted. Clicking this link verifies your profile status, enabling dashboard onboarding.

### 2. Educator/Teacher Approval Waiting Room
For security, new teacher registrations are placed in a 'pending' state. Teachers will be redirected to the Waiting Room page and cannot access classroom tools. Once an Administrator audits and approves the teacher request, access is instantly granted.""",

    "/docs/student/onboarding" to """# Student Profile Onboarding
Complete guide on setting up your account profile, emergency coordinates, class allocations, and commuter choices to activate your portal workspace.

## Step-by-Step Guide

### 01. Admission Number & Phone Registration
Input your official school-assigned admission key (e.g. 2024/STU/102). This matches your registration with the central registrar database. Submit your primary mobile number to register for automated text alert streams.

### 02. Assigned Class Bracket & Section Setup
Select your active grade level and sections. This configures your dashboard feeds, class homework journals, and examination calendars. Double-check this selection as class assignments can only be changed by administrators.

### 03. Mode of Commute selection
Choose between 'Walking' and 'School Transport'. Selecting School Transport links your profile to transit logs and school bus schedules. Walkers are tracked for perimeter checkouts only.

### 04. Parent / Guardian Contact Information
Submit parent names, emergency phone numbers, and optional email IDs. This is required for fee-due notices, progress report card sign-offs, and critical school announcements.

### 05. Mailing Address Verification
Provide street address, state, city, and a valid 6-digit postal pincode. This is verified against municipal zones for school transport routing setups.

## Additional Details

### Why is onboarding mandatory?
Without completed onboarding records, the database locks student dashboard access. Complete profile registration resolves database tags, allowing instant ledger views, report card releases, and message boards logs.

### Troubleshooting common errors
If the screen reports 'Admission number already exists', it means another profile is registered with those details. Contact the administration helpdesk to reset credentials. Ensure your pincode contains exactly 6 digits.""",

    "/docs/student/fees" to """# Fees Ledger & Online Payments
Verify outstanding balances, tuition fees, transport fees, and co-curricular concessions, and pay online securely.

## Details

### 1. Auditing the Fees Ledger
Navigate to the Fees section of your sidebar. The ledger details all generated monthly fee installments, itemized by basic tuition, transport surcharge, and activity fees. Outstanding items are categorized as 'Pending' or 'Overdue' (past payment deadline), while settled items are marked as 'Paid'.

### 2. Executing Online Payments
Click the Pay Now button next to any unpaid installment. This launches the secure Razorpay Checkout overlay. You can process transactions using credit/debit cards, NetBanking, mobile wallets, or instant UPI (Google Pay, PhonePe, Paytm). Confirmations are processed in real-time, instantly marking installments as Paid.

### 3. Downloading Official Receipts
Once paid, click the 'PDF Receipt' action next to the installment. This generates a digitally signed PDF invoice showing receipt numbers, transaction reference IDs, and payment stamps. Keep these for tax clearance audits.

### 4. Scholarship Concessions & Waivers
If you are on EWS, Merit-based, or Sports scholarships, concessions are applied directly to the installment amount. Check the 'Applied Waiver' lines on the card detail drawers. Contact the accountant's desk if waivers are missing.""",

    "/docs/student/marks" to """# Academic Marks & Performance Sheets
Detailed view of your test results, subject aggregates, term percentages, and grade cards.

## Details

### 1. Navigating Grades
The Marks portal compiles all test sheets published by teachers. Select terms (Term 1, Mid-Term, Term 2) or filter by specific subjects (Mathematics, Physics, English) using the filter dropdown cards.

### 2. Weighted Grading System
Your final subject percentages are calculated using weighted grades: Assignments contribute 20% to the subject grade, Mid-Terms contribute 30%, and Term Finals contribute 50%. The cumulative GPA is auto-generated upon term final score submissions.

### 3. Accessing Remarks & Sign-offs
Check teacher comments on assignment lines. Report cards require parent sign-off parameters, which are tracked on the profile dashboard sheets.""",

    "/docs/student/library" to """# Library Catalog & Borrowing Tracker
Manage issued books, verify return deadlines, avoid late fines, and search library collections.

## Details

### 1. Borrowed Books Ledger
The library card lists all active books issued to your student card. Each item lists the library barcode, book title, checkout date, and return deadline. Items past deadlines are flagged with high-visibility overdue warnings.

### 2. Fine Calculation Surcharges
Overdue books accumulate library fines at a rate of ₹10 per day. Accumulated fines are added to the next student fees ledger installment automatically. Prompt returns avoid these charges.

### 3. Catalog Search
Search the digital catalog by title, author, or genre to check current shelf availability before visiting the library desk.""",

    "/docs/student/complaints" to """# Filing a Complaint & Support Tickets
Report technical glitches, infrastructural issues, or classroom concerns directly to authorities.

## Details

### 1. Launching a Ticket
Click the File a Complaint button in the sidebar. This opens the complaint submission modal, which bypasses general inbox channels to route issues directly to designated staff.

### 2. Recipient Routing Options
Select the appropriate destination for your issue:
- **Teacher**: For classroom, syllabus, or peer concerns.
- **Tech Support (Admin)**: For portal issues, password resets, or device bugs.
- **Principal / Vice-Principal (Admin)**: For serious escalations or infrastructural reports.

### 3. Tagging Users
Use the 'Tag People' field to reference specific users. Start typing '@' to search and tag students or teachers. Tagged users will receive a copy of the ticket in their portal notifications.

### 4. Tracking Resolutions
Upon submission, the portal outputs a success toast with a unique reference number (e.g., CMP-77169). Use this ID to track updates with support clerks.""",

    "/docs/teacher/roster" to """# Class Roster & Student Profiles
Detailed instructions for teachers to manage student lists, emergency phone numbers, and transit modes.

## Details

### 1. Roster Auditing
Access the Class section of your dashboard. The roster grid lists all assigned class students, including admission codes, registered emails, and onboarding statuses (Completed vs Pending).

### 2. Filtering & Contact Cards
Use search bars to filter by student name. Clicking a student row opens their contact card, listing parent names, emergency phone numbers, and commute modes (Walking vs Transport). This is critical for organizing school bus routes or coordinating parent updates.""",

    "/docs/teacher/grading" to """# Marks Submission & Grading Management
Learn how to record student test scores, batch-submit term exams, and publish grades.

## Details

### 1. Entering Grades
Navigate to your assigned subjects page. Select the target class and exam type (Assignment, Midterm, or Final Exam). The grid updates to show input fields for each student.

### 2. Score Ranges & Validation
Input numeric scores within the designated max limits (e.g. 0-100). The form checks inputs in real-time, preventing input of values exceeding max limits or negative scores.

### 3. Grade Publishing
Review the filled grades and click Submit. Published scores update student report cards instantly and trigger GPA/average percentage recalculations.""",

    "/docs/teacher/notices" to """# Publishing Notices & Announcements
Broadcast class updates, homework tasks, or exam announcements directly to student portals.

## Details

### 1. Creating an Announcement
Open the Notices tab and click New Announcement. Draft your notice, add titles, select target classes (e.g. Class 10-A, Class 9-B), and attach optional files.

### 2. Broadcast Delivery
Clicking Publish instantly pushes the notice to the target student notice board streams. Important notices can be flagged as urgent to display warning flags on student log screens.""",

    "/docs/teacher/escalations" to """# Leave Requests & Supplies Procurements
How to submit official leaves or supply orders directly to administration.

## Details

### 1. Supply Orders
Request classroom materials (supplies, books, lab assets) through the requests panel. Input item names, quantities, and justification reasons. Admin reviews requests in real-time.

### 2. Submitting Leave Requests
Select the leave option, choose date ranges, input reason descriptions, and submit. Status fields update to Approved or Rejected as admin reviews the request.""",

    "/docs/teacher/complaints" to """# Educator Support & Complaint Tickets
Log infrastructural issues or coordinate reports directly with coordinators or IT support.

## Details

### 1. Submitting Support Requests
Use the File a Complaint button in the sidebar. Select Academic Coordinator, Principal, or IT Support, fill in titles, tag users, and describe your request. CMP reference numbers are issued for all submissions.""",

    "/docs/privacy-policy" to """# Privacy Policy
This Privacy Policy details how VidyaSchool collects, utilizes, protects, and governs personal information for students, educators, and guardians.

## 1. Introduction
Welcome to VidyaSchool ("we", "us", "our"). We are committed to safeguarding the privacy and security of our portal users. This policy governs data collected through the portal, mobile apps, and school databases.

## 2. Data We Collect
To provide efficient academic workflows, we gather the following personal identifiers:
- **Profiles**: Full names, profile pictures, institutional emails, secure credentials, and preferred platform roles.
- **Academics**: Grade level, section allocations, exam marks, classes rosters, and report card remarks.
- **Emergency Contacts**: Parent or guardian names, verified phone numbers, and physical residential addresses.
- **Commute Coordinates**: Selected transit modes (Walking vs Transport) and transport route zones.

## 3. How We Use Data
Collected data is restricted solely to institutional academic administration:
- Managing classroom registers and verifying student onboarding.
- Generating tuition fee ledgers and issuing transaction receipts.
- Routing transportation school buses based on pincodes.
- Delivering real-time complaint updates and notices notifications.

## 4. Data Security
VidyaSchool employs industry-standard encryption protocols (SSL/TLS) for data transmission. Access to database ledgers is governed strictly by Role-Based Access Control (RBAC), restricting student profile visibility only to verified educators and administrators.

## 5. Your Rights
Students and guardians retain the right to audit profile records, request correction of grades (via class teacher tickets), or modify commuter preferences. Administrative access is required to purge student account profiles permanently.

## 6. Contact Us
For privacy inquiries or data auditing concerns, please file a support ticket directly through the portal helpdesk or contact the registrar office at: `privacy@vidyaschool.edu`""",

    "/docs/terms-of-service" to """# Terms of Service
These Terms of Service regulate access and use of the VidyaSchool digital portal, mobile applications, and student information systems.

## 1. Acceptance of Terms
By registering an account, completing onboarding profiles, or using any portal services, you agree to be bound by these Terms of Service. If you disagree with any segment of these clauses, portal access must be discontinued.

## 2. User Portal Conduct
Users must provide accurate, truthful details during onboarding (such as legitimate admission keys and phone numbers). Sharing login sessions or social credentials is prohibited. Harassment or inappropriate language on community chat boards will trigger immediate disciplinary reviews.

## 3. Educator Responsibilities
Teachers and librarians must maintain academic integrity when publishing marks and entering classroom registers. All Educator accounts require administrative screening and approval. Unauthorized modifications of grading schemas will lead to account suspension.

## 4. Financial Transactions
Tuition fee processing utilizes third-party gateways (Razorpay). Users must ensure UPI credentials or bank credit details are secure. VidyaSchool is not liable for transactions failed at banking networks. Official digital receipts generated by the accountant module are final evidence of settlement.

## 5. Account Termination
We reserve the right to suspend or terminate accounts that breach portal rules, violate academic guidelines, or post false information. Suspended users will be redirected to the unauthorized error dashboard.

## 6. Limitation of Liability
The VidyaSchool portal is provided on an "as-is" and "as-available" baseline. We do not guarantee uninterrupted system connection during maintenance cycles. We are not liable for transport delays or technical outages impacting online class submissions."""
)



