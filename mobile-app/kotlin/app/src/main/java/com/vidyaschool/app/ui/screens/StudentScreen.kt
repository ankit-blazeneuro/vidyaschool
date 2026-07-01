package com.vidyaschool.app.ui.screens

import android.graphics.Paint
import android.graphics.Typeface
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
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.draw.clip
import androidx.compose.ui.zIndex
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.graphicsLayer
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
import com.vidyaschool.app.ui.components.SliderSkeleton
import com.vidyaschool.app.api.SliderImage
import coil.compose.AsyncImage
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import kotlinx.coroutines.delay
import androidx.compose.foundation.border
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R

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
    onLogout: () -> Unit
) {
    var sliderImages by remember { mutableStateOf<List<SliderImage>>(emptyList()) }
    var isLoadingSlider by remember { mutableStateOf(true) }
    
    LaunchedEffect(studentClass) {
        isLoadingSlider = true
        try {
            delay(2000) // Deliberate delay to show skeleton shimmer
            val response = RetrofitClient.authApi.getSliderImages(
                role = "student",
                studentClass = studentClass.takeIf { it.isNotEmpty() }
            )
            if (response.isSuccessful) {
                sliderImages = response.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("StudentScreen", "Failed to fetch slider images: ${e.message}")
        } finally {
            isLoadingSlider = false
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
                    .statusBarsPadding()
                    .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 24.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        IconButton(
                            onClick = { /* Open menu */ },
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
                                text = "Welcome, ${name.ifEmpty { "Student" }}",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Text(
                                text = "Student Portal",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                            )
                        }
                    }
                    
                    IconButton(
                        onClick = { /* Notifications */ },
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
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Auto-playing Image Slider at the top
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
                
                LibraryBooksSection(onShowMore = onShowLibrary)
            }
        }
    }
}

@Composable
fun LibraryBooksSection(onShowMore: () -> Unit = {}) {
    data class IssuedBook(val title: String, val author: String, val dueDate: String, val renewalsUsed: Int)

    val allBooks = remember {
        mutableStateListOf(
            IssuedBook("The Alchemist", "Paulo Coelho", "Jul 10, 2026", 0),
            IssuedBook("Clean Code", "Robert C. Martin", "Jul 05, 2026", 2),
            IssuedBook("Atomic Habits", "James Clear", "Jul 15, 2026", 3),
            IssuedBook("Deep Work", "Cal Newport", "Jul 20, 2026", 1),
            IssuedBook("Sapiens", "Yuval Noah Harari", "Jul 25, 2026", 0),
        )
    }

    val preview = allBooks.take(3)
    val hasMore = allBooks.size > 3
    val border = MaterialTheme.colorScheme.outline
    val onSurface = MaterialTheme.colorScheme.onSurface

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

        Spacer(modifier = Modifier.height(12.dp))        // Shadcn card: bordered, no fill, clean
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .border(
                    width = 1.dp,
                    brush = Brush.verticalGradient(
                        0.0f to border,
                        0.65f to border,
                        1.0f to Color.Transparent
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
        ) {
            Column {
                preview.forEachIndexed { idx, book ->
                    val renewalsLeft = 3 - book.renewalsUsed
                    if (idx == preview.lastIndex && hasMore) {
                        Box(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Monochrome initial avatar
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(onSurface.copy(alpha = 0.06f))
                                        .border(1.dp, border, RoundedCornerShape(8.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = book.title.first().toString(),
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
                                            text = "Due ${book.dueDate}",
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
                                                            if (i < book.renewalsUsed) onSurface.copy(alpha = 0.15f)
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

                            // Half-gradient overlay + Show More button directly on the item
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(
                                                Color.Transparent,
                                                MaterialTheme.colorScheme.background.copy(alpha = 0.85f),
                                                MaterialTheme.colorScheme.background
                                            )
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(MaterialTheme.colorScheme.surface)
                                        .border(1.dp, border, RoundedCornerShape(8.dp))
                                        .clickable(
                                            interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                            indication = null
                                        ) { onShowMore() }
                                        .padding(horizontal = 18.dp, vertical = 8.dp)
                                ) {
                                    Text(
                                        text = "Show ${allBooks.size - 3} more books",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = onSurface
                                    )
                                }
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Monochrome initial avatar
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(onSurface.copy(alpha = 0.06f))
                                    .border(1.dp, border, RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = book.title.first().toString(),
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
                                        text = "Due ${book.dueDate}",
                                        fontSize = 10.sp,
                                        color = if (renewalsLeft == 0) onSurface else onSurface.copy(alpha = 0.45f)
                                    )
                                    // Pip track — filled = used (dim), empty = remaining (solid)
                                    Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                        repeat(3) { i ->
                                            Box(
                                                modifier = Modifier
                                                    .size(width = 10.dp, height = 3.dp)
                                                    .clip(RoundedCornerShape(2.dp))
                                                    .background(
                                                        if (i < book.renewalsUsed) onSurface.copy(alpha = 0.15f)
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
                                        .clickable(
                                            interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                            indication = null
                                        ) { allBooks[idx] = book.copy(renewalsUsed = book.renewalsUsed + 1) }
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
                    }

                    // Divider between rows, not after last
                    if (idx < preview.lastIndex) {
                        HorizontalDivider(color = border, thickness = 1.dp)
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

    // Auto-slide every 10 seconds
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

            // Graph content
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

            // Shadcn-style tab strip with sliding animation
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

                // Animated pill drawn after Row so size is known, but visually behind via zIndex
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
fun SubjectBarChart(
    data: List<Float>,
    labels: List<String>,
    modifier: Modifier = Modifier
) {
    val primaryColor = MaterialTheme.colorScheme.primary
    val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f)
    val textColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
    // Theme-aware opacity steps instead of hue colors
    val barAlphas = listOf(1f, 0.8f, 0.65f, 0.5f, 0.38f, 0.25f)

    Canvas(modifier = modifier) {
        val w = size.width; val h = size.height
        val pL = 8f; val pR = 8f; val pT = 12f; val pB = 28f
        val cW = w - pL - pR; val cH = h - pT - pB

        for (i in 0..4) {
            val y = pT + cH * (i.toFloat() / 4)
            drawLine(gridColor, androidx.compose.ui.geometry.Offset(pL, y),
                androidx.compose.ui.geometry.Offset(w - pR, y), strokeWidth = 1f)
        }

        val slotW = cW / data.size
        val barW = slotW * 0.42f

        data.forEachIndexed { i, value ->
            val barH = cH * (value / 100f)
            val cx = pL + i * slotW + slotW / 2f
            val left = cx - barW / 2f
            val top = pT + cH - barH; val bottom = pT + cH
            val r = barW / 2.5f
            val alpha = barAlphas[i % barAlphas.size]

            drawRoundRect(
                color = primaryColor.copy(alpha = 0.08f),
                topLeft = androidx.compose.ui.geometry.Offset(left, pT),
                size = androidx.compose.ui.geometry.Size(barW, cH),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r)
            )
            drawRoundRect(
                color = primaryColor.copy(alpha = alpha),
                topLeft = androidx.compose.ui.geometry.Offset(left, top),
                size = androidx.compose.ui.geometry.Size(barW, barH),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r)
            )
        }

        val paint = Paint().apply {
            color = textColor.toArgb()
            textSize = 10.sp.toPx()
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
        drawIntoCanvas { canvas ->
            labels.forEachIndexed { i, label ->
                canvas.nativeCanvas.drawText(label, pL + i * slotW + slotW / 2f, h - 10f, paint)
            }
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
    // Theme-aware: primary=solid, 60%, 30% opacity for 3 segments
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
                val tl = androidx.compose.ui.geometry.Offset(cx - r, cy - r)
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
    val secondaryColor = MaterialTheme.colorScheme.secondary
    val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f)
    val textColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
    val surfaceColor = MaterialTheme.colorScheme.surface

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val pL = 8f; val pR = 8f; val pT = 16f; val pB = 28f
        val cW = w - pL - pR
        val cH = h - pT - pB

        // Dashed-style subtle grid
        for (i in 0..4) {
            val y = pT + cH * (i.toFloat() / 4)
            drawLine(gridColor, androidx.compose.ui.geometry.Offset(pL, y),
                androidx.compose.ui.geometry.Offset(w - pR, y), strokeWidth = 1f)
        }

        if (data.size > 1) {
            val points = data.indices.map { i ->
                val x = pL + cW * (i.toFloat() / (data.size - 1))
                val y = pT + cH * (1f - data[i] / 100f)
                androidx.compose.ui.geometry.Offset(x, y)
            }

            val strokePath = Path().apply {
                moveTo(points.first().x, points.first().y)
                for (i in 1 until points.size) {
                    val p = points[i - 1]; val c = points[i]
                    val cx1 = p.x + (c.x - p.x) / 2f
                    cubicTo(cx1, p.y, cx1, c.y, c.x, c.y)
                }
            }

            // Multi-layer glow fill
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

            // Stroke with sweep gradient for color shift
            drawPath(
                strokePath,
                brush = Brush.linearGradient(
                    colors = listOf(secondaryColor.copy(alpha = 0.8f), primaryColor),
                    start = androidx.compose.ui.geometry.Offset(pL, 0f),
                    end = androidx.compose.ui.geometry.Offset(w - pR, 0f)
                ),
                style = Stroke(width = 2.5.dp.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round)
            )

            // Dots with glow
            points.forEach { pt ->
                drawCircle(primaryColor.copy(alpha = 0.2f), radius = 9.dp.toPx(), center = pt)
                drawCircle(primaryColor, radius = 4.dp.toPx(), center = pt)
                drawCircle(surfaceColor, radius = 2.dp.toPx(), center = pt)
            }
        }

        val paint = Paint().apply {
            color = textColor.toArgb()
            textSize = 10.sp.toPx()
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
        drawIntoCanvas { canvas ->
            labels.forEachIndexed { i, label ->
                val x = pL + cW * (i.toFloat() / (labels.size - 1))
                canvas.nativeCanvas.drawText(label, x, h - 10f, paint)
            }
        }
    }
}
