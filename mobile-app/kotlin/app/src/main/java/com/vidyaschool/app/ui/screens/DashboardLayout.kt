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
import coil.compose.AsyncImage
import com.vidyaschool.app.api.FeeInstallment
import com.vidyaschool.app.api.PayFeesRequest
import com.vidyaschool.app.api.PayFeesResponse
import com.vidyaschool.app.api.SearchUserResponse
import com.vidyaschool.app.api.UserProfileData
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R
import androidx.compose.ui.graphics.vector.ImageVector

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
    homeContent: @Composable () -> Unit
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
    
    Scaffold(
        bottomBar = {
            Column(
                modifier = Modifier.background(MaterialTheme.colorScheme.background)
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
                NavigationBar(
                    modifier = Modifier.height(70.dp),
                    containerColor = MaterialTheme.colorScheme.background,
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
                .background(MaterialTheme.colorScheme.background)
                .padding(bottom = innerPadding.calculateBottomPadding())
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
                        sessionManager = sessionManager,
                        onTabSelect = { tab -> selectedTab = tab },
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
                        },
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
    sessionManager: SessionManager,
    onTabSelect: (String) -> Unit,
    onShowLibrary: (() -> Unit)?,
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<SearchUserResponse>>(emptyList()) }
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
            return@LaunchedEffect
        }
        delay(300)
        isLoading = true
        try {
            val token = sessionManager.getSessionToken() ?: ""
            val authHeader = "Bearer $token"
            val response = RetrofitClient.authApi.searchUsers(authHeader, searchQuery)
            if (response.isSuccessful) {
                searchResults = response.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("SearchTab", "Backend search error: ${e.message}")
        } finally {
            isLoading = false
        }
    }

    val filteredPages = remember(searchQuery, pages) {
        if (searchQuery.isBlank()) pages else pages.filter {
            it.name.contains(searchQuery, ignoreCase = true) || it.description.contains(searchQuery, ignoreCase = true)
        }
    }

    val filteredDocs = remember(searchQuery) {
        if (searchQuery.isBlank()) helpDocs else helpDocs.filter {
            it.title.contains(searchQuery, ignoreCase = true) || it.content.contains(searchQuery, ignoreCase = true)
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
                .padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 20.dp)
        ) {
            // Search Input styled like Shadcn command input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search pages, users, docs...", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.12f),
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Shadcn filter tabs/pills
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("All", "Pages", "Users", "Docs").forEach { filter ->
                    val isSelected = activeFilter == filter
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (isSelected) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)
                            )
                            .clickable { activeFilter = filter }
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = filter,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
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
                    verticalArrangement = Arrangement.spacedBy(16.dp)
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
                                    onClick = { selectedDoc = doc }
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
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(
                1.dp,
                MaterialTheme.colorScheme.onBackground.copy(alpha = 0.05f),
                RoundedCornerShape(10.dp)
            ),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.background
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
                    .size(36.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f), RoundedCornerShape(4.dp))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = category,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
            Spacer(modifier = Modifier.width(4.dp))
            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
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
    onLogout: () -> Unit
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
                .padding(horizontal = 24.dp, vertical = 24.dp),
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
                                OutlinedTextField(
                                    value = tempUsername,
                                    onValueChange = { tempUsername = it.toLowerCase().replace(Regex("[^a-z0-9_]"), "") },
                                    label = { Text("Username") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                OutlinedTextField(
                                    value = editPhoneNumber,
                                    onValueChange = { editPhoneNumber = it },
                                    label = { Text("Phone Number") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                var classMenuExpanded by remember { mutableStateOf(false) }
                                Box(modifier = Modifier.fillMaxWidth()) {
                                    OutlinedTextField(
                                        value = if (editClass == "none" || editClass.isEmpty()) "Not assigned" else if (editClass == "Nursery" || editClass == "KG") editClass else "Class $editClass",
                                        onValueChange = {},
                                        readOnly = true,
                                        label = { Text("Assigned Class") },
                                        trailingIcon = {
                                            IconButton(onClick = { classMenuExpanded = true }) {
                                                Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                                            }
                                        },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    DropdownMenu(
                                        expanded = classMenuExpanded,
                                        onDismissRequest = { classMenuExpanded = false }
                                    ) {
                                        DropdownMenuItem(
                                            text = { Text("Not assigned") },
                                            onClick = {
                                                editClass = "none"
                                                classMenuExpanded = false
                                            }
                                        )
                                        listOf("Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12").forEach { c ->
                                            DropdownMenuItem(
                                                text = { Text(if (c == "Nursery" || c == "KG") c else "Class $c") },
                                                onClick = {
                                                    editClass = c
                                                    classMenuExpanded = false
                                                }
                                            )
                                        }
                                    }
                                }

                                var sectionMenuExpanded by remember { mutableStateOf(false) }
                                Box(modifier = Modifier.fillMaxWidth()) {
                                    OutlinedTextField(
                                        value = if (editSection == "none" || editSection.isEmpty()) "Not assigned" else editSection,
                                        onValueChange = {},
                                        readOnly = true,
                                        label = { Text("Assigned Section") },
                                        trailingIcon = {
                                            IconButton(onClick = { sectionMenuExpanded = true }) {
                                                Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                                            }
                                        },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    DropdownMenu(
                                        expanded = sectionMenuExpanded,
                                        onDismissRequest = { sectionMenuExpanded = false }
                                    ) {
                                        DropdownMenuItem(
                                            text = { Text("Not assigned") },
                                            onClick = {
                                                editSection = "none"
                                                sectionMenuExpanded = false
                                            }
                                        )
                                        listOf("A", "B", "C", "D", "E", "F").forEach { s ->
                                            DropdownMenuItem(
                                                text = { Text(s) },
                                                onClick = {
                                                    editSection = s
                                                    sectionMenuExpanded = false
                                                }
                                            )
                                        }
                                    }
                                }
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
                                    OutlinedTextField(
                                        value = editParentName,
                                        onValueChange = { editParentName = it },
                                        label = { Text("Parent Name") },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    OutlinedTextField(
                                        value = editParentPhone,
                                        onValueChange = { editParentPhone = it },
                                        label = { Text("Parent Phone") },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    OutlinedTextField(
                                        value = editParentEmail,
                                        onValueChange = { editParentEmail = it },
                                        label = { Text("Parent Email") },
                                        singleLine = true,
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
                                OutlinedTextField(
                                    value = editAddress,
                                    onValueChange = { editAddress = it },
                                    label = { Text("Street Address") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )
                                OutlinedTextField(
                                    value = editCity,
                                    onValueChange = { editCity = it },
                                    label = { Text("City") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )
                                OutlinedTextField(
                                    value = editState,
                                    onValueChange = { editState = it },
                                    label = { Text("State") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )
                                OutlinedTextField(
                                    value = editPincode,
                                    onValueChange = { editPincode = it },
                                    label = { Text("Pincode") },
                                    singleLine = true,
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
    val content: String
)

val helpDocs = listOf(
    HelpDoc(
        title = "Library Policies & Fines",
        category = "Library",
        content = "1. Books can be issued for a maximum of 14 days.\n2. A fine of $0.50 per day will be charged for late returns.\n3. Damaged or lost books must be replaced or paid for at double the cost.\n4. Silent study rules must be maintained in the library at all times."
    ),
    HelpDoc(
        title = "Late Fee Structure & Penalty",
        category = "Finance",
        content = "1. Monthly school fees must be paid by the 5th of each month.\n2. A grace period is extended until the 10th of the month.\n3. Payments made after the 10th will incur a late fee penalty of 5% of the pending amount.\n4. Continuous non-payment for 2 months may lead to suspension of access."
    ),
    HelpDoc(
        title = "How to Post in Community",
        category = "Social",
        content = "1. Only authorized users and teachers can create posts.\n2. Posts must comply with the school code of conduct.\n3. Spamming or abusive content is strictly prohibited and will result in disciplinary action.\n4. Keep posts relevant to academic discussions, announcements, and events."
    ),
    HelpDoc(
        title = "Contacting Accounts Office",
        category = "Finance",
        content = "1. Operating hours: Monday to Friday, 9:00 AM to 3:00 PM.\n2. Email inquiries can be sent to billing@vidyaschool.edu.\n3. Phone support is available at extension 104 during school hours.\n4. In-person meetings require prior scheduling via the portal."
    ),
    HelpDoc(
        title = "Student ID Card Reissue Policy",
        category = "General",
        content = "1. Lost ID cards must be reported immediately to the administration office.\n2. A replacement ID card can be issued upon paying a fee of $10.\n3. Processing time for a new card is 2 business days.\n4. Students must carry their ID card at all times while on school premises."
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


