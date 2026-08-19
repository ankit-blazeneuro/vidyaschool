package com.vidyaschool.app.ui.screens

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.StudentExamResult
import com.vidyaschool.app.api.StudentSubjectMark
import androidx.compose.ui.graphics.luminance
import com.vidyaschool.app.auth.SessionManager
import kotlinx.coroutines.launch

@Composable
fun isAcademicMarksScreenInDarkTheme(): Boolean {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val isSurfaceDark = MaterialTheme.colorScheme.surface.luminance() < 0.5f
    return when (sessionManager.getThemeMode()) {
        "light" -> false
        "dark" -> true
        else -> isSurfaceDark
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AcademicMarksScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    val sessionToken = sessionManager.getSessionToken()
    val isDark = isAcademicMarksScreenInDarkTheme()

    var examDataMap by remember { mutableStateOf<Map<String, StudentExamResult>>(emptyMap()) }
    var selectedTermKey by remember { mutableStateOf<String>("") }
    var isLoading by remember { mutableStateOf(true) }
    var isRefreshing by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }
    var showSearchBar by remember { mutableStateOf(false) }

    // Color tokens optimized for both Light Mode & Dark Mode
    val bgColor = if (isDark) Color(0xFF09090B) else Color(0xFFFFFFFF)
    val cardBg = if (isDark) Color(0xFF18181B) else Color(0xFFFFFFFF)
    val cardBorder = if (isDark) Color(0xFF27272A) else Color(0xFFE2E8F0)
    val primaryText = if (isDark) Color(0xFFFAFAFA) else Color(0xFF0F172A)
    val secondaryText = if (isDark) Color(0xFFA1A1AA) else Color(0xFF64748B)
    val accentBlackWhite = if (isDark) Color(0xFFFFFFFF) else Color(0xFF0F172A)
    val contrastMuted = if (isDark) Color(0xFF3F3F46) else Color(0xFFCBD5E1)
    val chipUnselectedBg = if (isDark) Color(0xFF18181B) else Color(0xFFF1F5F9)
    val chipUnselectedBorder = if (isDark) Color(0xFF27272A) else Color(0xFFE2E8F0)

    fun fetchMarks(isPullRefresh: Boolean = false) {
        if (sessionToken.isNullOrEmpty()) {
            isLoading = false
            isRefreshing = false
            return
        }
        if (isPullRefresh) isRefreshing = true else isLoading = true
        scope.launch {
            try {
                val res = RetrofitClient.authApi.getStudentMarks("Bearer $sessionToken")
                if (res.isSuccessful && res.body() != null) {
                    val map = res.body()!!
                    examDataMap = map
                    if (map.isNotEmpty() && (selectedTermKey.isEmpty() || !map.containsKey(selectedTermKey))) {
                        selectedTermKey = map.keys.first()
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("AcademicMarksScreen", "Error fetching marks: ${e.message}")
            } finally {
                isLoading = false
                isRefreshing = false
            }
        }
    }

    LaunchedEffect(sessionToken) {
        fetchMarks(isPullRefresh = false)
    }

    val activeKey = if (selectedTermKey.isNotEmpty() && examDataMap.containsKey(selectedTermKey)) {
        selectedTermKey
    } else {
        examDataMap.keys.firstOrNull() ?: ""
    }

    val currentExam = examDataMap[activeKey]
    val subjects = currentExam?.subjects ?: emptyList()

    val filteredSubjects = remember(subjects, searchQuery) {
        if (searchQuery.isBlank()) subjects
        else subjects.filter {
            (it.subject?.contains(searchQuery, ignoreCase = true) == true) ||
            (it.code?.contains(searchQuery, ignoreCase = true) == true) ||
            (it.teacher?.contains(searchQuery, ignoreCase = true) == true)
        }
    }

    // Calculations
    val totalScore = subjects.sumOf { (it.score ?: 0f).toDouble() }.toFloat()
    val totalMax = subjects.sumOf { (it.maxScore ?: 100f).toDouble() }.toFloat()
    val avgPct = if (totalMax > 0) (totalScore / totalMax) * 100f else 0f
    val classAvgTotal = subjects.sumOf { (it.classAverage ?: 0f).toDouble() }.toFloat()
    val classAvgPct = if (totalMax > 0) (classAvgTotal / totalMax) * 100f else 0f

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(bgColor)
            .statusBarsPadding()
    ) {
        // ── Standard Header matching other app screens ───────────────────────
        Row(
            modifier = Modifier
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
                    onClick = onBack,
                    modifier = Modifier
                        .size(36.dp)
                        .background(cardBg, CircleShape)
                        .border(
                            1.dp,
                            cardBorder,
                            shape = CircleShape
                        )
                        .clip(CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        modifier = Modifier.size(18.dp),
                        tint = primaryText
                    )
                }

                Column {
                    Text(
                        text = "Academic Marks",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = primaryText
                    )
                    Text(
                        text = "Performance & Examination Analytics",
                        fontSize = 12.sp,
                        color = secondaryText
                    )
                }
            }

            IconButton(
                onClick = { showSearchBar = !showSearchBar },
                modifier = Modifier
                    .size(36.dp)
                    .background(cardBg, CircleShape)
                    .border(
                        1.dp,
                        cardBorder,
                        shape = CircleShape
                    )
                    .clip(CircleShape)
            ) {
                Icon(
                    imageVector = if (showSearchBar) Icons.Default.Close else Icons.Default.Search,
                    contentDescription = "Search",
                    modifier = Modifier.size(18.dp),
                    tint = primaryText
                )
            }
        }

        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { fetchMarks(isPullRefresh = true) },
            modifier = Modifier.fillMaxSize()
        ) {
            if (isLoading && examDataMap.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    AcademicMarksSkeleton(isDark = isDark)
                }
            } else if (examDataMap.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "No Examination Marks Recorded",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = primaryText
                        )
                        Text(
                            text = "Your teacher has not uploaded any evaluation marks for your class yet.",
                            fontSize = 13.sp,
                            color = secondaryText,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                        Button(
                            onClick = { fetchMarks() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = accentBlackWhite,
                                contentColor = if (isDark) Color(0xFF09090B) else Color(0xFFFFFFFF)
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Check Again")
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 24.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Search bar if open
                    if (showSearchBar) {
                        item {
                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                placeholder = { Text("Filter subject or code...", fontSize = 13.sp, color = secondaryText) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = cardBg,
                                    unfocusedContainerColor = cardBg,
                                    focusedBorderColor = accentBlackWhite,
                                    unfocusedBorderColor = cardBorder,
                                    focusedTextColor = primaryText,
                                    unfocusedTextColor = primaryText
                                )
                            )
                        }
                    }

                    // ── Term Selector Chips ──────────────────────────────────────
                    item {
                        val termKeys = examDataMap.keys.toList()
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            termKeys.forEach { key ->
                                val termResult = examDataMap[key]
                                val label = termResult?.termName ?: key.replace("_", " ").uppercase()
                                val isSelected = key == activeKey

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(if (isSelected) accentBlackWhite else chipUnselectedBg)
                                        .border(
                                            width = 1.dp,
                                            color = if (isSelected) accentBlackWhite else chipUnselectedBorder,
                                            shape = RoundedCornerShape(20.dp)
                                        )
                                        .clickable { selectedTermKey = key }
                                        .padding(horizontal = 16.dp, vertical = 8.dp)
                                ) {
                                    Text(
                                        text = label,
                                        fontSize = 13.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        color = if (isSelected) (if (isDark) Color(0xFF09090B) else Color(0xFFFFFFFF)) else primaryText
                                    )
                                }
                            }
                        }
                    }

                    // ── KPI Summary Cards (Optimized Contrast) ───────────────────
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Overall Percentage Card
                            Card(
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = cardBg),
                                border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "OVERALL SCORE",
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = secondaryText,
                                        letterSpacing = 0.6.sp
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = String.format("%.1f%%", avgPct),
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Black,
                                        color = primaryText
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "${totalScore.toInt()} / ${totalMax.toInt()} Marks",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = secondaryText
                                    )
                                }
                            }

                            // Class Comparison Card
                            Card(
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = cardBg),
                                border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "CLASS AVERAGE",
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = secondaryText,
                                        letterSpacing = 0.6.sp
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = String.format("%.1f%%", classAvgPct),
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Black,
                                        color = primaryText
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    val diff = avgPct - classAvgPct
                                    val diffStr = if (diff >= 0) "+${String.format("%.1f%%", diff)} above" else "${String.format("%.1f%%", diff)} below"
                                    Text(
                                        text = diffStr,
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (diff >= 0) (if (isDark) Color(0xFF4ADE80) else Color(0xFF16A34A)) else secondaryText
                                    )
                                }
                            }
                        }
                    }

                    // ── Graph 1: Multi-Term Trend Curve ──────────────────────────
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = cardBg),
                            border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = "Exam Trend Curve",
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = primaryText
                                        )
                                        Text(
                                            text = "Your Score vs Class Average across terms",
                                            fontSize = 11.5.sp,
                                            color = secondaryText
                                        )
                                    }

                                    // Legend
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(accentBlackWhite))
                                            Text("You", fontSize = 10.5.sp, fontWeight = FontWeight.Bold, color = primaryText)
                                        }
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(contrastMuted))
                                            Text("Avg", fontSize = 10.5.sp, fontWeight = FontWeight.Medium, color = secondaryText)
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Extract term data points
                                val termsList = examDataMap.values.toList()
                                val yourScorePoints = termsList.map { term ->
                                    val sList = term.subjects ?: emptyList()
                                    val sScore = sList.sumOf { (it.score ?: 0f).toDouble() }.toFloat()
                                    val sMax = sList.sumOf { (it.maxScore ?: 100f).toDouble() }.toFloat()
                                    if (sMax > 0) (sScore / sMax) * 100f else 0f
                                }
                                val avgScorePoints = termsList.map { term ->
                                    val sList = term.subjects ?: emptyList()
                                    val aScore = sList.sumOf { (it.classAverage ?: 0f).toDouble() }.toFloat()
                                    val sMax = sList.sumOf { (it.maxScore ?: 100f).toDouble() }.toFloat()
                                    if (sMax > 0) (aScore / sMax) * 100f else 0f
                                }
                                val termLabels = termsList.map { it.termName ?: "Exam" }

                                val minTrendWidth = maxOf(340.dp, (termLabels.size * 130).dp)
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState())
                                ) {
                                    BlackWhiteTrendChart(
                                        yourScores = yourScorePoints,
                                        avgScores = avgScorePoints,
                                        labels = termLabels,
                                        isDark = isDark,
                                        modifier = Modifier
                                            .width(minTrendWidth)
                                            .height(210.dp)
                                    )
                                }
                            }
                        }
                    }

                    // ── Graph 2: Subject-wise Marks Comparison Bar Chart ─────────
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = cardBg),
                            border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = "Subject Marks Breakdown",
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = primaryText
                                        )
                                        Text(
                                            text = "Direct subject comparison for ${currentExam?.termName ?: "Selected Term"}",
                                            fontSize = 11.5.sp,
                                            color = secondaryText
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                if (filteredSubjects.isNotEmpty()) {
                                    val minBarWidth = maxOf(340.dp, (filteredSubjects.size * 85).dp)
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .horizontalScroll(rememberScrollState())
                                    ) {
                                        BlackWhiteSubjectBarChart(
                                            subjects = filteredSubjects,
                                            isDark = isDark,
                                            modifier = Modifier
                                                .width(minBarWidth)
                                                .height(220.dp)
                                        )
                                    }
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(150.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("No matching subject marks found", fontSize = 12.sp, color = secondaryText)
                                    }
                                }
                            }
                        }
                    }

                    // ── Detailed Subject Cards List ──────────────────────────────
                    item {
                        Text(
                            text = "Subject Breakdown (${filteredSubjects.size})",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = primaryText
                        )
                    }

                    items(filteredSubjects) { mark ->
                        SubjectMarkDetailCard(
                            mark = mark,
                            isDark = isDark,
                            cardBg = cardBg,
                            cardBorder = cardBorder,
                            primaryText = primaryText,
                            secondaryText = secondaryText,
                            accentColor = accentBlackWhite
                        )
                    }

                    item {
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Black & White Multi-Term Line Trend Chart (Optimized for Light/Dark Mode)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun BlackWhiteTrendChart(
    yourScores: List<Float>,
    avgScores: List<Float>,
    labels: List<String>,
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    val primaryStroke = if (isDark) Color(0xFFFFFFFF) else Color(0xFF0F172A)
    val avgStroke = if (isDark) Color(0xFF71717A) else Color(0xFF94A3B8)
    val gridLineColor = if (isDark) Color(0xFF27272A) else Color(0xFFE2E8F0)
    val textColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF64748B)

    val density = androidx.compose.ui.platform.LocalDensity.current
    val yTextPx = with(density) { 9.5.sp.toPx() }
    val valTextPx = with(density) { 10.sp.toPx() }
    val xLabelTextPx = with(density) { 10.5.sp.toPx() }

    val paintY = remember(textColor, yTextPx) {
        Paint().apply {
            color = textColor.toArgb()
            textSize = yTextPx
            textAlign = Paint.Align.RIGHT
            typeface = Typeface.DEFAULT_BOLD
        }
    }
    val valPaint = remember(primaryStroke, valTextPx) {
        Paint().apply {
            color = primaryStroke.toArgb()
            textSize = valTextPx
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
    }
    val xLabelPaint = remember(textColor, xLabelTextPx) {
        Paint().apply {
            color = textColor.toArgb()
            textSize = xLabelTextPx
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
    }

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val pL = 36f; val pR = 24f; val pT = 24f; val pB = 32f
        val cW = w - pL - pR
        val cH = h - pT - pB

        // Grid lines & Y-axis labels
        val yGridCount = 4

        for (i in 0..yGridCount) {
            val ratio = i.toFloat() / yGridCount
            val y = pT + cH * ratio
            val pctLabel = "${((1f - ratio) * 100).toInt()}%"

            drawLine(
                color = gridLineColor,
                start = Offset(pL, y),
                end = Offset(w - pR, y),
                strokeWidth = 1f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f), 0f)
            )

            drawIntoCanvas { canvas ->
                canvas.nativeCanvas.drawText(pctLabel, pL - 6f, y + 3.sp.toPx(), paintY)
            }
        }

        val pointCount = maxOf(yourScores.size, avgScores.size)
        if (pointCount > 0) {
            // Compute coordinate points
            fun computePoints(data: List<Float>): List<Offset> {
                return data.indices.map { i ->
                    val x = if (data.size > 1) pL + cW * (i.toFloat() / (data.size - 1)) else pL + cW / 2f
                    val clamped = data[i].coerceIn(0f, 100f)
                    val y = pT + cH * (1f - clamped / 100f)
                    Offset(x, y)
                }
            }

            val yourPoints = computePoints(yourScores)
            val avgPoints = computePoints(avgScores)

            // Draw Area Gradient for Your Score
            if (yourPoints.size > 1) {
                val fillPath = Path().apply {
                    moveTo(yourPoints.first().x, yourPoints.first().y)
                    for (i in 1 until yourPoints.size) {
                        val p = yourPoints[i - 1]; val c = yourPoints[i]
                        val cx1 = p.x + (c.x - p.x) / 2f
                        cubicTo(cx1, p.y, cx1, c.y, c.x, c.y)
                    }
                    lineTo(yourPoints.last().x, pT + cH)
                    lineTo(yourPoints.first().x, pT + cH)
                    close()
                }

                drawPath(
                    path = fillPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            primaryStroke.copy(alpha = if (isDark) 0.18f else 0.10f),
                            Color.Transparent
                        ),
                        startY = yourPoints.minOf { it.y },
                        endY = pT + cH
                    )
                )
            }

            // Draw Average Line (Dashed Muted Line)
            if (avgPoints.size > 1) {
                val avgPath = Path().apply {
                    moveTo(avgPoints.first().x, avgPoints.first().y)
                    for (i in 1 until avgPoints.size) {
                        val p = avgPoints[i - 1]; val c = avgPoints[i]
                        val cx1 = p.x + (c.x - p.x) / 2f
                        cubicTo(cx1, p.y, cx1, c.y, c.x, c.y)
                    }
                }
                drawPath(
                    path = avgPath,
                    color = avgStroke,
                    style = Stroke(
                        width = 2f,
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f), 0f)
                    )
                )
            }

            // Draw Your Score Line (Solid Bold Line)
            if (yourPoints.size > 1) {
                val yourPath = Path().apply {
                    moveTo(yourPoints.first().x, yourPoints.first().y)
                    for (i in 1 until yourPoints.size) {
                        val p = yourPoints[i - 1]; val c = yourPoints[i]
                        val cx1 = p.x + (c.x - p.x) / 2f
                        cubicTo(cx1, p.y, cx1, c.y, c.x, c.y)
                    }
                }
                drawPath(
                    path = yourPath,
                    color = primaryStroke,
                    style = Stroke(width = 3.5f)
                )
            }

            yourPoints.forEachIndexed { i, pt ->
                // Outer ring
                drawCircle(color = primaryStroke, radius = 5.5f, center = pt)
                drawCircle(color = if (isDark) Color(0xFF18181B) else Color(0xFFFFFFFF), radius = 3f, center = pt)

                // Value label on top
                val score = yourScores.getOrNull(i) ?: 0f
                drawIntoCanvas { canvas ->
                    canvas.nativeCanvas.drawText("${score.toInt()}%", pt.x, pt.y - 10f, valPaint)
                }
            }

            labels.forEachIndexed { i, label ->
                val x = if (labels.size > 1) pL + cW * (i.toFloat() / (labels.size - 1)) else pL + cW / 2f
                drawIntoCanvas { canvas ->
                    canvas.nativeCanvas.drawText(label, x, h - 8f, xLabelPaint)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Black & White Grouped Bar Chart (Subject vs Class Avg - Light/Dark Optimized)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun BlackWhiteSubjectBarChart(
    subjects: List<StudentSubjectMark>,
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    val barYouColor = if (isDark) Color(0xFFFAFAFA) else Color(0xFF0F172A)
    val barAvgColor = if (isDark) Color(0xFF52525B) else Color(0xFFCBD5E1)
    val gridColor = if (isDark) Color(0xFF27272A) else Color(0xFFE2E8F0)
    val textColor = if (isDark) Color(0xFFA1A1AA) else Color(0xFF64748B)

    val density = androidx.compose.ui.platform.LocalDensity.current
    val labelTextPx = with(density) { 10.sp.toPx() }
    val scoreTextPx = with(density) { 9.5.sp.toPx() }

    val labelPaint = remember(textColor, labelTextPx) {
        Paint().apply {
            color = textColor.toArgb()
            textSize = labelTextPx
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
    }

    val scorePaint = remember(barYouColor, scoreTextPx) {
        Paint().apply {
            color = barYouColor.toArgb()
            textSize = scoreTextPx
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
    }

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val pL = 16f; val pR = 16f; val pT = 24f; val pB = 36f
        val cW = w - pL - pR
        val cH = h - pT - pB

        // Horizontal gridlines
        for (i in 0..4) {
            val y = pT + cH * (i.toFloat() / 4)
            drawLine(gridColor, Offset(pL, y), Offset(w - pR, y), strokeWidth = 1f)
        }

        if (subjects.isNotEmpty()) {
            val slotW = cW / subjects.size
            val barW = (slotW * 0.30f).coerceIn(16f, 30f)
            val gap = 6f

            subjects.forEachIndexed { i, sub ->
                val youPct = ((sub.score ?: 0f) / (sub.maxScore ?: 100f)).coerceIn(0f, 1f)
                val avgPct = ((sub.classAverage ?: 0f) / (sub.maxScore ?: 100f)).coerceIn(0f, 1f)

                val slotCenterX = pL + i * slotW + slotW / 2f
                val youLeft = slotCenterX - barW - gap / 2f
                val avgLeft = slotCenterX + gap / 2f

                val youH = cH * youPct
                val avgH = cH * avgPct

                val youTop = pT + cH - youH
                val avgTop = pT + cH - avgH
                val r = 4f

                // You Bar
                drawRoundRect(
                    color = barYouColor,
                    topLeft = Offset(youLeft, youTop),
                    size = Size(barW, youH),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(r)
                )

                // Avg Bar
                drawRoundRect(
                    color = barAvgColor,
                    topLeft = Offset(avgLeft, avgTop),
                    size = Size(barW, avgH),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(r)
                )

                // Score text above you bar
                drawIntoCanvas { canvas ->
                    canvas.nativeCanvas.drawText("${(sub.score ?: 0f).toInt()}", youLeft + barW / 2f, youTop - 6f, scorePaint)
                }

                // X-axis subject code/abbreviation
                val shortName = sub.subject?.take(4)?.uppercase() ?: (sub.code ?: "SUB")
                drawIntoCanvas { canvas ->
                    canvas.nativeCanvas.drawText(shortName, slotCenterX, h - 10f, labelPaint)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Detailed Subject Card Item (Light/Dark Optimized)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SubjectMarkDetailCard(
    mark: StudentSubjectMark,
    isDark: Boolean,
    cardBg: Color,
    cardBorder: Color,
    primaryText: Color,
    secondaryText: Color,
    accentColor: Color
) {
    val score = mark.score ?: 0f
    val maxScore = if ((mark.maxScore ?: 100f) > 0f) mark.maxScore!! else 100f
    val classAvg = mark.classAverage ?: 0f
    val pct = (score / maxScore) * 100f
    val isPassed = (mark.status ?: "Pass").equals("Pass", ignoreCase = true)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBg),
        border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = mark.subject ?: "Subject",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = primaryText
                        )
                        if (!mark.code.isNullOrEmpty()) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (isDark) Color(0xFF27272A) else Color(0xFFF1F5F9))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = mark.code,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = secondaryText
                                )
                            }
                        }
                    }
                    if (!mark.teacher.isNullOrEmpty()) {
                        Text(
                            text = "Teacher: ${mark.teacher}",
                            fontSize = 12.sp,
                            color = secondaryText
                        )
                    }
                }

                // Grade / Score Badge (Monochrome High-Contrast)
                Column(horizontalAlignment = Alignment.End) {
                    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = "${score.toInt()}",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = primaryText
                        )
                        Text(
                            text = "/${maxScore.toInt()}",
                            fontSize = 12.sp,
                            color = secondaryText,
                            modifier = Modifier.padding(bottom = 2.dp)
                        )
                    }
                    val gradeText = mark.grade ?: (if (pct >= 90) "A+" else if (pct >= 80) "A" else if (pct >= 70) "B" else "C")
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isPassed) accentColor else (if (isDark) Color(0xFF3F3F46) else Color(0xFFE2E8F0)))
                            .padding(horizontal = 8.dp, vertical = 2.5.dp)
                    ) {
                        Text(
                            text = "Grade $gradeText",
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isPassed) (if (isDark) Color(0xFF09090B) else Color(0xFFFFFFFF)) else primaryText
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Progress bar showing Score & Marker for Class Average
            val fillRatio = (score / maxScore).coerceIn(0f, 1f)
            val avgRatio = (classAvg / maxScore).coerceIn(0f, 1f)

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(if (isDark) Color(0xFF27272A) else Color(0xFFF1F5F9))
            ) {
                // Score filled bar
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(fillRatio)
                        .clip(RoundedCornerShape(4.dp))
                        .background(accentColor)
                )

                // Class average indicator line
                if (avgRatio > 0f) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(avgRatio)
                    ) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.CenterEnd)
                                .width(2.5.dp)
                                .fillMaxHeight()
                                .background(if (isDark) Color(0xFFFAFAFA) else Color(0xFF0F172A))
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${String.format("%.1f%%", pct)} scored",
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = primaryText
                )
                Text(
                    text = "Class Avg: ${classAvg.toInt()}%",
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Medium,
                    color = secondaryText
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Shimmer for Academic Marks Screen
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun AcademicMarksSkeleton(isDark: Boolean) {
    val transition = rememberInfiniteTransition(label = "academic_marks_shimmer")
    val shimmerX by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerX"
    )
    val shimmerBrush = Brush.linearGradient(
        colors = if (isDark) listOf(Color(0xFF27272A), Color(0xFF3F3F46), Color(0xFF27272A))
                 else listOf(Color(0xFFF1F5F9), Color(0xFFE2E8F0), Color(0xFFF1F5F9)),
        start = Offset(shimmerX - 300f, 0f),
        end = Offset(shimmerX, 0f)
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(3) {
                Box(modifier = Modifier.width(90.dp).height(36.dp).clip(RoundedCornerShape(18.dp)).background(shimmerBrush))
            }
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(modifier = Modifier.weight(1f).height(85.dp).clip(RoundedCornerShape(16.dp)).background(shimmerBrush))
            Box(modifier = Modifier.weight(1f).height(85.dp).clip(RoundedCornerShape(16.dp)).background(shimmerBrush))
        }
        Box(modifier = Modifier.fillMaxWidth().height(220.dp).clip(RoundedCornerShape(20.dp)).background(shimmerBrush))
        Box(modifier = Modifier.fillMaxWidth().height(220.dp).clip(RoundedCornerShape(20.dp)).background(shimmerBrush))
    }
}
