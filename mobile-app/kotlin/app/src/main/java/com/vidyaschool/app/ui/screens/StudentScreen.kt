package com.vidyaschool.app.ui.screens

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.SliderImage
import coil.compose.AsyncImage
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import kotlinx.coroutines.delay

@Composable
fun StudentScreen(
    provider: String = "",
    email: String = "",
    name: String = "",
    avatarUrl: String = "",
    themeMode: String = "system",
    onThemeChange: (String) -> Unit = {},
    onLogout: () -> Unit
) {
    var sliderImages by remember { mutableStateOf<List<SliderImage>>(emptyList()) }
    
    LaunchedEffect(Unit) {
        try {
            val response = RetrofitClient.authApi.getSliderImages()
            if (response.isSuccessful) {
                sliderImages = response.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("StudentScreen", "Failed to fetch slider images: ${e.message}")
        }
    }
    
    DashboardLayout(
        role = "student",
        provider = provider,
        email = email,
        name = name,
        avatarUrl = avatarUrl.takeIf { it.isNotEmpty() },
        themeMode = themeMode,
        onThemeChange = onThemeChange,
        onLogout = onLogout
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(start = 24.dp, end = 24.dp, top = 0.dp, bottom = 24.dp)
            ) {
                Text(
                    text = "Welcome, ${name.ifEmpty { "Student" }}",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Student Portal",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp)
                    ) {
                        Text(
                            text = "Academic Performance",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "School Highlights & Analytics",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Auto-playing Image Slider (Controlled by Admin Panel)
                        val enabledImages = sliderImages.filter { it.enabled }
                        if (enabledImages.isNotEmpty()) {
                            ImageSlider(
                                images = enabledImages,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(150.dp)
                            )
                            Spacer(modifier = Modifier.height(24.dp))
                        }
                        
                        AcademicPerformanceChart(
                            data = listOf(65f, 80f, 75f, 90f, 85f, 95f),
                            labels = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun"),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ImageSlider(
    images: List<SliderImage>,
    modifier: Modifier = Modifier
) {
    if (images.isEmpty()) return
    
    val pagerState = rememberPagerState(pageCount = { images.size })
    
    // Auto-scroll loop
    LaunchedEffect(pagerState) {
        while (true) {
            delay(4000)
            val nextPage = (pagerState.currentPage + 1) % images.size
            pagerState.animateScrollToPage(nextPage)
        }
    }
    
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            val img = images[page]
            Box(modifier = Modifier.fillMaxSize()) {
                AsyncImage(
                    model = img.url,
                    contentDescription = img.title,
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                
                // Dark bottom gradient overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f)),
                                startY = 150f
                            )
                        )
                )
                
                // Image title text overlay
                Text(
                    text = img.title,
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp)
                )
            }
        }
        
        // Progress dot indicators
        Row(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            repeat(images.size) { index ->
                val active = pagerState.currentPage == index
                Box(
                    modifier = Modifier
                        .size(if (active) 12.dp else 6.dp, 6.dp)
                        .clip(CircleShape)
                        .background(if (active) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.5f))
                )
            }
        }
    }
}

@Composable
fun AcademicPerformanceChart(
    data: List<Float>,
    labels: List<String>,
    modifier: Modifier = Modifier
) {
    val primaryColor = MaterialTheme.colorScheme.primary
    val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
    val textColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
    val backgroundColor = MaterialTheme.colorScheme.background
    
    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        
        val paddingLeft = 40f
        val paddingRight = 20f
        val paddingTop = 20f
        val paddingBottom = 40f
        
        val chartWidth = width - paddingLeft - paddingRight
        val chartHeight = height - paddingTop - paddingBottom
        
        // Draw grid lines
        val gridLines = 4
        for (i in 0..gridLines) {
            val y = paddingTop + chartHeight * (i.toFloat() / gridLines)
            drawLine(
                color = gridColor,
                start = androidx.compose.ui.geometry.Offset(paddingLeft, y),
                end = androidx.compose.ui.geometry.Offset(width - paddingRight, y),
                strokeWidth = 1f
            )
        }
        
        // Draw path
        if (data.size > 1) {
            val points = data.indices.map { index ->
                val x = paddingLeft + chartWidth * (index.toFloat() / (data.size - 1))
                val percentage = (data[index] - 0f) / 100f // range 0..100
                val y = paddingTop + chartHeight * (1f - percentage)
                androidx.compose.ui.geometry.Offset(x, y)
            }
            
            // Build smooth cubic curve
            val strokePath = Path().apply {
                if (points.isNotEmpty()) {
                    moveTo(points.first().x, points.first().y)
                    for (i in 1 until points.size) {
                        val prev = points[i - 1]
                        val curr = points[i]
                        val controlX1 = prev.x + (curr.x - prev.x) / 2f
                        val controlY1 = prev.y
                        val controlX2 = prev.x + (curr.x - prev.x) / 2f
                        val controlY2 = curr.y
                        cubicTo(controlX1, controlY1, controlX2, controlY2, curr.x, curr.y)
                    }
                }
            }
            
            // Draw Gradient Area under curve
            val fillPath = Path().apply {
                addPath(strokePath)
                lineTo(points.last().x, paddingTop + chartHeight)
                lineTo(points.first().x, paddingTop + chartHeight)
                close()
            }
            
            drawPath(
                path = fillPath,
                brush = Brush.verticalGradient(
                    colors = listOf(
                        primaryColor.copy(alpha = 0.3f),
                        Color.Transparent
                    ),
                    startY = points.minOf { it.y },
                    endY = paddingTop + chartHeight
                )
            )
            
            // Draw Stroke line
            drawPath(
                path = strokePath,
                color = primaryColor,
                style = Stroke(width = 3.dp.toPx())
            )
            
            // Draw data points & outer rings
            points.forEach { point ->
                drawCircle(
                    color = primaryColor,
                    radius = 5.dp.toPx(),
                    center = point
                )
                drawCircle(
                    color = backgroundColor,
                    radius = 2.dp.toPx(),
                    center = point
                )
            }
        }
        
        // Draw labels
        val paint = Paint().apply {
            color = textColor.toArgb()
            textSize = 10.sp.toPx()
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
        
        drawIntoCanvas { canvas ->
            labels.forEachIndexed { index, label ->
                val x = paddingLeft + chartWidth * (index.toFloat() / (labels.size - 1))
                val y = height - 10f
                canvas.nativeCanvas.drawText(label, x, y, paint)
            }
        }
    }
}
