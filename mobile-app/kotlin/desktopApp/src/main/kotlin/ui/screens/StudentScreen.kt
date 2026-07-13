package ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.border
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.draw.clip
import androidx.compose.ui.zIndex
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.toComposeImageBitmap
import javax.imageio.ImageIO
import java.net.URL
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import com.vidyaschool.shared.session.SessionStorage
import com.vidyaschool.shared.network.ApiClient
import com.vidyaschool.shared.models.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import ui.components.SliderSkeleton

import ui.components.AsyncImage

@Composable
fun StudentScreen(
    provider: String = "",
    email: String = "",
    name: String = "",
    avatarUrl: String = "",
    studentClass: String = "",
    themeMode: String = "system",
    onThemeChange: (String) -> Unit = {},
    onShowLibrary: () -> Unit = {},
    onLogout: () -> Unit,
    showToast: (String) -> Unit
) {
    val sessionStorage = remember { SessionStorage() }
    val sessionToken = sessionStorage.getSessionToken()
    val apiClient = remember { ApiClient() }

    var currentStudentClass by remember { mutableStateOf(studentClass) }
    var sliderImages by remember { mutableStateOf<List<SliderImage>>(emptyList()) }
    var isLoadingSlider by remember { mutableStateOf(true) }
    var showOnboarding by remember { mutableStateOf(false) }
    var isCheckingOnboarding by remember { mutableStateOf(true) }

    LaunchedEffect(sessionToken) {
        isCheckingOnboarding = true
        if (sessionToken.isNullOrEmpty()) {
            isCheckingOnboarding = false
            return@LaunchedEffect
        }
        try {
            val response = apiClient.getProfile("Bearer $sessionToken")
            val completed = response.profile?.onboardingCompleted == true && !response.profile?.username.isNullOrBlank()
            showOnboarding = !completed
            response.profile?.studentClass?.takeIf { it.isNotBlank() }?.let { currentStudentClass = it }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isCheckingOnboarding = false
        }
    }
    
    LaunchedEffect(currentStudentClass, showOnboarding) {
        if (showOnboarding) return@LaunchedEffect
        isLoadingSlider = true
        try {
            delay(1000)
            val response = apiClient.getSliderImages(
                role = "student",
                studentClass = currentStudentClass.takeIf { it.isNotEmpty() }
            )
            sliderImages = response
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isLoadingSlider = false
        }
    }
    
    Box(modifier = Modifier.fillMaxSize()) {
        DashboardLayout(
            role = "student",
            provider = provider,
            email = email,
            name = name,
            avatarUrl = avatarUrl.takeIf { it.isNotEmpty() },
            themeMode = themeMode,
            onThemeChange = onThemeChange,
            onLogout = onLogout,
            onShowLibrary = onShowLibrary,
            showToast = showToast
        ) { onNotificationClick ->
            val scrollState = rememberScrollState()
            val headerCollapsed by remember { derivedStateOf { scrollState.value > 100 } }
            val headerAlpha by animateFloatAsState(
                targetValue = if (headerCollapsed) 1f else 0f,
                animationSpec = androidx.compose.animation.core.tween(220),
                label = "headerAlpha"
            )
            val headerSlide by animateFloatAsState(
                targetValue = if (headerCollapsed) 0f else -24f,
                animationSpec = androidx.compose.animation.core.tween(220),
                label = "headerSlide"
            )

            Box(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(bottom = 24.dp)
                ) {
                    DashboardHeader(
                        title = "Dashboard",
                        subtitle = "Welcome, ${name.ifEmpty { "Student" }}",
                        onNotificationClick = onNotificationClick
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp)
                    ) {
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
                        
                        AcademicPerformanceCard()
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        LibraryBooksSection(onShowMore = onShowLibrary, showToast = showToast)
                    }
                }

                if (headerAlpha > 0f) {
                    DashboardStickyHeader(
                        title = "Dashboard",
                        headerAlpha = headerAlpha,
                        headerSlide = headerSlide,
                        onNotificationClick = onNotificationClick
                    )
                }
            }
        }

        if (!isCheckingOnboarding && showOnboarding && !sessionToken.isNullOrEmpty()) {
            StudentOnboardingDrawer(
                email = email,
                sessionToken = sessionToken,
                onComplete = { username, newClass ->
                    sessionStorage.updateOnboardingData(username, newClass)
                    if (!newClass.isNullOrEmpty()) {
                        currentStudentClass = newClass
                    }
                    showOnboarding = false
                },
                showToast = showToast
            )
        }
    }
}

@Composable
fun LibraryBooksSection(onShowMore: () -> Unit = {}, showToast: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    val sessionStorage = remember { SessionStorage() }
    val sessionToken = sessionStorage.getSessionToken()
    val apiClient = remember { ApiClient() }

    val allBooks = remember { mutableStateListOf<StudentBorrowingResponse>() }
    var isLoading by remember { mutableStateOf(false) }

    fun loadBooks() {
        if (!sessionToken.isNullOrEmpty()) {
            isLoading = true
            scope.launch {
                try {
                    val res = apiClient.getStudentBorrowings("Bearer $sessionToken")
                    allBooks.clear()
                    allBooks.addAll(res)
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    isLoading = false
                }
            }
        }
    }

    LaunchedEffect(sessionToken) {
        loadBooks()
    }

    val preview = allBooks.take(3)
    val hasMore = allBooks.size > 3
    val border = MaterialTheme.colorScheme.outline
    val onSurface = MaterialTheme.colorScheme.onSurface

    fun formatIsoDate(isoStr: String): String {
        return try {
            val parts = isoStr.split("T")[0].split("-")
            val year = parts[0]
            val monthNum = parts[1].toInt()
            val day = parts[2].toInt()
            val month = when (monthNum) {
                1 -> "Jan"
                2 -> "Feb"
                3 -> "Mar"
                4 -> "Apr"
                5 -> "May"
                6 -> "Jun"
                7 -> "Jul"
                8 -> "Aug"
                9 -> "Sep"
                10 -> "Oct"
                11 -> "Nov"
                12 -> "Dec"
                else -> "Month"
            }
            "$month $day, $year"
        } catch (e: Exception) {
            isoStr
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Library Books", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = onSurface)
                Text("Issued books & renewals", fontSize = 12.sp, color = onSurface.copy(alpha = 0.45f))
            }
            if (hasMore) {
                Text(
                    text = "View all →",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = onSurface.copy(alpha = 0.6f),
                    modifier = Modifier.clickable(
                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                        indication = null
                    ) { onShowMore() }
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (isLoading && allBooks.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(strokeWidth = 2.dp)
            }
        } else if (allBooks.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, border, RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(vertical = 28.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No issued books", fontSize = 12.sp, color = onSurface.copy(alpha = 0.4f))
            }
        } else {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, border, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) {
                    preview.forEachIndexed { idx, book ->
                        val renewalsLeft = 3 - book.renewalsCount
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(onSurface.copy(alpha = 0.06f))
                                    .border(1.dp, border, RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = book.title.firstOrNull()?.toString() ?: "",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = onSurface
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(book.title, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = onSurface)
                                Text(book.author, fontSize = 11.sp, color = onSurface.copy(alpha = 0.45f))
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(
                                        text = "Due ${formatIsoDate(book.dueDate)}",
                                        fontSize = 10.sp,
                                        color = if (renewalsLeft == 0) onSurface else onSurface.copy(alpha = 0.45f)
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                        repeat(3) { i ->
                                            Box(
                                                modifier = Modifier
                                                    .size(width = 10.dp, height = 3.dp)
                                                    .clip(RoundedCornerShape(2.dp))
                                                    .background(
                                                        if (i < book.renewalsCount) onSurface.copy(alpha = 0.15f)
                                                        else onSurface.copy(alpha = 0.7f)
                                                    )
                                            )
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            if (renewalsLeft > 0) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .border(1.dp, border, RoundedCornerShape(8.dp))
                                        .clickable {
                                            scope.launch {
                                                try {
                                                    val res = apiClient.renewBook("Bearer $sessionToken", StudentRenewRequest(id = book.id))
                                                    if (res.status.value in 200..299) {
                                                        showToast("Book renewed successfully")
                                                        loadBooks()
                                                    } else {
                                                        showToast("Failed to renew book")
                                                    }
                                                } catch (e: Exception) {
                                                    showToast("Error: ${e.message}")
                                                }
                                            }
                                        }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("Renew", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = onSurface)
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(onSurface.copy(alpha = 0.06f))
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("Max", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = onSurface.copy(alpha = 0.35f))
                                }
                            }
                        }

                        if (idx < preview.lastIndex) {
                            Divider(color = border.copy(alpha = 0.4f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AcademicPerformanceCard() {
    val tabs = listOf("Performance", "Subject", "Attendance")
    var selectedTab by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(10_000)
            selectedTab = (selectedTab + 1) % tabs.size
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 16.dp)) {
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

            when (selectedTab) {
                0 -> AcademicPerformanceChart(
                    data = listOf(65f, 80f, 75f, 90f, 85f, 95f),
                    labels = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun"),
                    modifier = Modifier.fillMaxWidth().height(180.dp)
                )
                1 -> SubjectBarChart(
                    data = listOf(72f, 68f, 85f, 78f, 91f, 88f),
                    labels = listOf("Math", "Sci", "Eng", "His", "Geo", "Art"),
                    modifier = Modifier.fillMaxWidth().height(180.dp)
                )
                2 -> AttendancePieChart(
                    present = 82f,
                    absent = 10f,
                    modifier = Modifier.fillMaxWidth().height(180.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            val pillColor = MaterialTheme.colorScheme.surface
            var stripWidth by remember { mutableStateOf(0) }
            var stripHeight by remember { mutableStateOf(0) }
            val pillOffsetX by animateIntAsState(
                targetValue = if (stripWidth > 0) stripWidth / tabs.size * selectedTab else 0,
                animationSpec = spring(dampingRatio = 0.8f, stiffness = 400f),
                label = "tabSlide"
            )

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                    .padding(3.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .onSizeChanged { stripWidth = it.width; stripHeight = it.height }
                ) {
                    tabs.forEachIndexed { index, title ->
                        val selected = selectedTab == index
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clickable(
                                    interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                    indication = null
                                ) { selectedTab = index }
                                .padding(vertical = 3.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = title,
                                fontSize = 11.sp,
                                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                color = if (selected) MaterialTheme.colorScheme.onSurface
                                        else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                }

                if (stripWidth > 0 && stripHeight > 0) {
                    val density = androidx.compose.ui.platform.LocalDensity.current
                    val pillW = with(density) { (stripWidth / tabs.size).toDp() }
                    val pillH = with(density) { stripHeight.toDp() }
                    val offsetDp = with(density) { pillOffsetX.toDp() }
                    Box(
                        modifier = Modifier
                            .offset(x = offsetDp)
                            .width(pillW)
                            .height(pillH)
                            .clip(RoundedCornerShape(6.dp))
                            .background(pillColor)
                            .zIndex(-1f)
                    )
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
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                
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
    val secondaryColor = MaterialTheme.colorScheme.secondary
    val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f)
    val textColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
    val surfaceColor = MaterialTheme.colorScheme.surface

    val textMeasurer = rememberTextMeasurer()
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val pL = 8f; val pR = 8f; val pT = 16f; val pB = 28f
        val cW = w - pL - pR
        val cH = h - pT - pB

        // Grid lines
        for (i in 0..4) {
            val y = pT + cH * (i.toFloat() / 4)
            drawLine(gridColor, Offset(pL, y), Offset(w - pR, y), strokeWidth = 1f)
        }

        if (data.size > 1) {
            val points = data.indices.map { i ->
                val x = pL + cW * (i.toFloat() / (data.size - 1))
                val y = pT + cH * (1f - data[i] / 100f)
                Offset(x, y)
            }

            val strokePath = Path().apply {
                moveTo(points.first().x, points.first().y)
                for (i in 1 until points.size) {
                    val p = points[i - 1]; val c = points[i]
                    val cx1 = p.x + (c.x - p.x) / 2f
                    cubicTo(cx1, p.y, cx1, c.y, c.x, c.y)
                }
            }

            listOf(0.18f, 0.10f, 0.05f).forEachIndexed { idx, alpha ->
                val fillPath = Path().apply {
                    addPath(strokePath)
                    lineTo(points.last().x, pT + cH)
                    lineTo(points.first().x, pT + cH)
                    close()
                }
                drawPath(
                    fillPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(primaryColor.copy(alpha = alpha + idx * 0.04f), Color.Transparent),
                        startY = points.minOf { it.y }, endY = pT + cH
                    )
                )
            }

            drawPath(
                strokePath,
                brush = Brush.linearGradient(
                    colors = listOf(secondaryColor.copy(alpha = 0.8f), primaryColor),
                    start = Offset(pL, 0f),
                    end = Offset(w - pR, 0f)
                ),
                style = Stroke(width = 2.5.dp.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round)
            )

            points.forEach { pt ->
                drawCircle(primaryColor.copy(alpha = 0.2f), radius = 9.dp.toPx(), center = pt)
                drawCircle(primaryColor, radius = 4.dp.toPx(), center = pt)
                drawCircle(surfaceColor, radius = 2.dp.toPx(), center = pt)
            }
        }

        labels.forEachIndexed { i, label ->
            val x = pL + cW * (i.toFloat() / (labels.size - 1))
            val textLayoutResult = textMeasurer.measure(
                text = label,
                style = TextStyle(color = textColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            )
            drawText(
                textLayoutResult = textLayoutResult,
                topLeft = Offset(x - textLayoutResult.size.width / 2f, h - textLayoutResult.size.height - 4f)
            )
        }
    }
}

@Composable
fun SubjectBarChart(
    data: List<Float>,
    labels: List<String>,
    modifier: Modifier = Modifier
) {
    val primaryColor = MaterialTheme.colorScheme.primary
    val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f)
    val textColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
    val barAlphas = listOf(1f, 0.8f, 0.65f, 0.5f, 0.38f, 0.25f)

    val textMeasurer = rememberTextMeasurer()
    Canvas(modifier = modifier) {
        val w = size.width; val h = size.height
        val pL = 8f; val pR = 8f; val pT = 12f; val pB = 28f
        val cW = w - pL - pR; val cH = h - pT - pB

        for (i in 0..4) {
            val y = pT + cH * (i.toFloat() / 4)
            drawLine(gridColor, Offset(pL, y), Offset(w - pR, y), strokeWidth = 1f)
        }

        val slotW = cW / data.size
        val barW = slotW * 0.42f

        data.forEachIndexed { i, value ->
            val barH = cH * (value / 100f)
            val cx = pL + i * slotW + slotW / 2f
            val left = cx - barW / 2f
            val top = pT + cH - barH
            val r = barW / 2.5f
            val alpha = barAlphas[i % barAlphas.size]

            drawRoundRect(
                color = primaryColor.copy(alpha = 0.08f),
                topLeft = Offset(left, pT),
                size = androidx.compose.ui.geometry.Size(barW, cH),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r)
            )
            drawRoundRect(
                color = primaryColor.copy(alpha = alpha),
                topLeft = Offset(left, top),
                size = androidx.compose.ui.geometry.Size(barW, barH),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r)
            )
        }

        labels.forEachIndexed { i, label ->
            val cx = pL + i * slotW + slotW / 2f
            val textLayoutResult = textMeasurer.measure(
                text = label,
                style = TextStyle(color = textColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            )
            drawText(
                textLayoutResult = textLayoutResult,
                topLeft = Offset(cx - textLayoutResult.size.width / 2f, h - textLayoutResult.size.height - 4f)
            )
        }
    }
}

@Composable
fun AttendancePieChart(
    present: Float,
    absent: Float,
    modifier: Modifier = Modifier
) {
    val onSurface    = MaterialTheme.colorScheme.onSurface
    val trackColor   = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f)
    val presentColor = onSurface
    val absentColor  = onSurface.copy(alpha = 0.55f)
    val leaveColor   = onSurface.copy(alpha = 0.25f)
    val leave        = 100f - present - absent

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.weight(1f).fillMaxHeight(),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val sz = minOf(size.width, size.height)
                val cx = size.width / 2f; val cy = size.height / 2f
                val outerR = sz / 2f * 0.78f
                val strokeW = outerR * 0.30f
                val r = outerR - strokeW / 2f
                val arcSz = androidx.compose.ui.geometry.Size(r * 2, r * 2)
                val tl = Offset(cx - r, cy - r)
                val gap = 3f
                val total = present + absent + leave
                val pSweep = 360f * (present / total)
                val aSweep = 360f * (absent  / total)
                val lSweep = 360f * (leave   / total)

                drawArc(trackColor, 0f, 360f, false, style = Stroke(strokeW), topLeft = tl, size = arcSz)
                drawArc(presentColor, -90f, pSweep - gap, false,
                    style = Stroke(strokeW, cap = androidx.compose.ui.graphics.StrokeCap.Round), topLeft = tl, size = arcSz)
                drawArc(absentColor, -90f + pSweep + gap, aSweep - gap, false,
                    style = Stroke(strokeW, cap = androidx.compose.ui.graphics.StrokeCap.Round), topLeft = tl, size = arcSz)
                drawArc(leaveColor, -90f + pSweep + aSweep + gap * 2, lSweep - gap, false,
                    style = Stroke(strokeW, cap = androidx.compose.ui.graphics.StrokeCap.Round), topLeft = tl, size = arcSz)
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("${present.toInt()}%", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = onSurface)
                Text("Present", fontSize = 10.sp, color = onSurface.copy(alpha = 0.45f))
            }
        }

        Column(
            modifier = Modifier.padding(start = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            listOf(
                Triple(presentColor, "Present", "${present.toInt()}%"),
                Triple(absentColor,  "Absent",  "${absent.toInt()}%"),
                Triple(leaveColor,   "Leave",   "${leave.toInt()}%")
            ).forEach { (color, label, value) ->
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(color))
                    Column {
                        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = onSurface)
                        Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = onSurface)
                    }
                }
            }
        }
    }
}
