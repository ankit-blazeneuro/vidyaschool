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
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.ui.components.SliderSkeleton
import com.vidyaschool.app.api.SliderImage
import kotlinx.coroutines.delay
import androidx.compose.foundation.border
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R

@Composable
fun TeacherScreen(
    provider: String = "",
    email: String = "",
    name: String = "",
    avatarUrl: String = "",
    themeMode: String = "system",
    onThemeChange: (String) -> Unit = {},
    onLogout: () -> Unit
) {
    var sliderImages by remember { mutableStateOf<List<SliderImage>>(emptyList()) }
    var isLoadingSlider by remember { mutableStateOf(true) }
    
    LaunchedEffect(Unit) {
        isLoadingSlider = true
        try {
            delay(2000) // Deliberate delay to show skeleton shimmer
            val response = RetrofitClient.authApi.getSliderImages(role = "teacher")
            if (response.isSuccessful) {
                sliderImages = response.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("TeacherScreen", "Failed to fetch slider images: ${e.message}")
        } finally {
            isLoadingSlider = false
        }
    }
    
    DashboardLayout(
        role = "teacher",
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
                    subtitle = "Welcome, ${name.ifEmpty { "Teacher" }}",
                    onNotificationClick = { }
                )

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                ) {
                    // Image Slider for Teachers at the top
                    if (isLoadingSlider) {
                        SliderSkeleton(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                    } else {
                        val enabledImages = sliderImages.filter { it.enabled }
                        if (enabledImages.isNotEmpty()) {
                            ImageSlider(
                                images = enabledImages,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                            )
                            Spacer(modifier = Modifier.height(24.dp))
                        }
                    }
                    
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = "Today's Schedule",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "• Grade 10 Math - 09:00 AM\n• Grade 12 Calculus - 11:00 AM\n• Staff Meeting - 02:00 PM",
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
