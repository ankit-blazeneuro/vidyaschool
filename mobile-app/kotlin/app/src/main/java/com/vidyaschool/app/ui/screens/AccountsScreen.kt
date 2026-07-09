package com.vidyaschool.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun AccountsScreen(
    provider: String = "",
    email: String = "",
    name: String = "",
    avatarUrl: String = "",
    themeMode: String = "system",
    onThemeChange: (String) -> Unit = {},
    onLogout: () -> Unit
) {
    DashboardLayout(
        role = "accounts",
        provider = provider,
        email = email,
        name = name,
        avatarUrl = avatarUrl.takeIf { it.isNotEmpty() },
        themeMode = themeMode,
        onThemeChange = onThemeChange,
        onLogout = onLogout
    ) {
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

        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .statusBarsPadding()
                    .padding(bottom = 24.dp)
            ) {
                DashboardHeader(
                    title = "Dashboard",
                    subtitle = "Welcome, ${name.ifEmpty { "Accounts officer" }}",
                    onNotificationClick = { }
                )

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = "Pending Invoices",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "• Invoice #1024 - PENDING ($450)\n• Invoice #1025 - PAID ($1,200)\n• Invoice #1026 - OVERDUE ($300)",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                                lineHeight = 20.sp
                            )
                        }
                    }
                }
            }

            if (headerAlpha > 0f) {
                DashboardStickyHeader(
                    title = "Dashboard",
                    headerAlpha = headerAlpha,
                    headerSlide = headerSlide,
                    onNotificationClick = { }
                )
            }
        }
    }
}
