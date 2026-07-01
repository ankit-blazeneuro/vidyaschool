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

data class IssuedBook(
    val title: String,
    val author: String,
    val dueDate: String,
    val renewalsUsed: Int,
    val coverColor: Color
)

val sampleBooks = listOf(
    IssuedBook("The Alchemist", "Paulo Coelho", "Jul 10, 2026", 0, Color(0xFF6366F1)),
    IssuedBook("Clean Code", "Robert C. Martin", "Jul 05, 2026", 2, Color(0xFF06B6D4)),
    IssuedBook("Atomic Habits", "James Clear", "Jul 15, 2026", 3, Color(0xFFF59E0B)),
    IssuedBook("Deep Work", "Cal Newport", "Jul 20, 2026", 1, Color(0xFF10B981)),
    IssuedBook("Sapiens", "Yuval Noah Harari", "Jul 25, 2026", 0, Color(0xFFEF4444)),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryHubScreen(onBack: () -> Unit) {
    val books = remember { mutableStateListOf(*sampleBooks.toTypedArray()) }

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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(vertical = 12.dp)
        ) {
            itemsIndexed(books) { idx, book ->
                val renewalsLeft = 3 - book.renewalsUsed
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
                                text = book.title.first().toString(),
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
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(onSurface.copy(alpha = 0.07f))
                                        .padding(horizontal = 7.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = "Due ${book.dueDate}",
                                        fontSize = 10.sp,
                                        color = onSurface.copy(alpha = 0.55f)
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
                                                    if (i < book.renewalsUsed) onSurface.copy(alpha = 0.15f)
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
                                    ) { books[idx] = book.copy(renewalsUsed = book.renewalsUsed + 1) }
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
