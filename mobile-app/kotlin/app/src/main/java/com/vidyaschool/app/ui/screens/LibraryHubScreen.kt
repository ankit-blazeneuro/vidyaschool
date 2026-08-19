package com.vidyaschool.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import com.vidyaschool.app.auth.SessionManager
import com.vidyaschool.app.api.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryHubScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    val sessionToken = sessionManager.getSessionToken()

    val books = remember { mutableStateListOf<com.vidyaschool.app.api.StudentBorrowingResponse>() }
    var isLoading by remember { mutableStateOf(false) }

    fun loadBooks() {
        if (!sessionToken.isNullOrEmpty()) {
            isLoading = true
            scope.launch(Dispatchers.IO) {
                try {
                    val res = RetrofitClient.authApi.getStudentBorrowings("Bearer $sessionToken")
                    if (res.isSuccessful) {
                        books.clear()
                        res.body()?.let { books.addAll(it) }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("LibraryHubScreen", "Error loading borrowings: ${e.message}")
                } finally {
                    isLoading = false
                }
            }
        }
    }

    LaunchedEffect(sessionToken) {
        loadBooks()
    }

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

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Library Hub", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("${books.size} books issued", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        if (isLoading && books.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (books.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No books currently issued", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                itemsIndexed(books) { idx, book ->
                    val renewalsLeft = 3 - book.renewalsCount
                    val border = MaterialTheme.colorScheme.outline
                    val onSurface = MaterialTheme.colorScheme.onSurface
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, border, RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.surface)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Monochrome initial avatar (Shadcn style)
                            Box(
                                modifier = Modifier
                                    .size(52.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(onSurface.copy(alpha = 0.06f))
                                    .border(1.dp, border, RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = book.title.firstOrNull()?.toString() ?: "",
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = onSurface
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(book.title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = onSurface)
                                Text(book.author, fontSize = 11.sp, color = onSurface.copy(alpha = 0.45f))
                                Spacer(modifier = Modifier.height(6.dp))
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    val isOverdue = book.status == "overdue"
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(
                                                if (isOverdue) Color(0xFFFEE2E2)
                                                else onSurface.copy(alpha = 0.07f)
                                            )
                                            .padding(horizontal = 7.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = if (isOverdue) "Overdue - Due ${formatIsoDate(book.dueDate)}" else "Due ${formatIsoDate(book.dueDate)}",
                                            fontSize = 10.sp,
                                            color = if (isOverdue) Color(0xFFDC2626) else onSurface.copy(alpha = 0.55f),
                                            fontWeight = if (isOverdue) FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                    // Pip track (Monochrome/Shadcn style)
                                    Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                        repeat(3) { i ->
                                            Box(
                                                modifier = Modifier
                                                    .size(width = 10.dp, height = 4.dp)
                                                    .clip(RoundedCornerShape(2.dp))
                                                    .background(
                                                        if (i < book.renewalsCount) onSurface.copy(alpha = 0.15f)
                                                        else onSurface.copy(alpha = 0.7f)
                                                    )
                                            )
                                        }
                                    }
                                    Text(
                                        text = "$renewalsLeft left",
                                        fontSize = 10.sp,
                                        color = onSurface.copy(alpha = 0.4f)
                                    )
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
                                        ) {
                                            scope.launch {
                                                try {
                                                    val res = RetrofitClient.authApi.renewBook("Bearer $sessionToken", com.vidyaschool.app.api.StudentRenewRequest(id = book.id))
                                                    if (res.isSuccessful) {
                                                        android.widget.Toast.makeText(context, "Book renewed successfully", android.widget.Toast.LENGTH_SHORT).show()
                                                        loadBooks()
                                                    } else {
                                                        android.widget.Toast.makeText(context, "Failed to renew book", android.widget.Toast.LENGTH_SHORT).show()
                                                    }
                                                } catch (e: Exception) {
                                                    android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        }
                                        .padding(horizontal = 14.dp, vertical = 8.dp)
                                ) {
                                    Text("Renew", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = onSurface)
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(onSurface.copy(alpha = 0.06f))
                                        .padding(horizontal = 14.dp, vertical = 8.dp)
                                ) {
                                    Text("Max", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = onSurface.copy(alpha = 0.35f))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
