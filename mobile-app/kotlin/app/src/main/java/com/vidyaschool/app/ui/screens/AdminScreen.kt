package com.vidyaschool.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
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
import com.vidyaschool.app.api.SliderImage
import kotlinx.coroutines.launch

@Composable
fun AdminScreen(
    provider: String = "",
    email: String = "",
    name: String = "",
    avatarUrl: String = "",
    themeMode: String = "system",
    onThemeChange: (String) -> Unit = {},
    onLogout: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var sliderImages by remember { mutableStateOf<List<SliderImage>>(emptyList()) }
    
    var newTitle by remember { mutableStateOf("") }
    var newUrl by remember { mutableStateOf("") }
    
    LaunchedEffect(Unit) {
        try {
            val response = RetrofitClient.authApi.getSliderImages()
            if (response.isSuccessful) {
                sliderImages = response.body() ?: emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("AdminScreen", "Failed to fetch slider images: ${e.message}")
        }
    }
    
    DashboardLayout(
        role = "admin",
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
                Text(
                    text = "Welcome, ${name.ifEmpty { "Admin" }}",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Administration Console",
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
                            text = "Student Portal Image Slider Control",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Enable, disable, or delete sliding banner cards in real-time:",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        sliderImages.forEachIndexed { index, img ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = img.title,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "ID: ${img.id}",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                }
                                
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Switch(
                                        checked = img.enabled,
                                        onCheckedChange = { checked ->
                                            val updatedList = sliderImages.map {
                                                if (it.id == img.id) it.copy(enabled = checked) else it
                                            }
                                            sliderImages = updatedList
                                            
                                            scope.launch {
                                                try {
                                                    RetrofitClient.authApi.updateSliderImages(updatedList)
                                                } catch (e: Exception) {
                                                    android.util.Log.e("AdminScreen", "Failed to update slider images: ${e.message}")
                                                }
                                            }
                                        }
                                    )
                                    IconButton(
                                        onClick = {
                                            val updatedList = sliderImages.filter { it.id != img.id }
                                            sliderImages = updatedList
                                            scope.launch {
                                                try {
                                                    RetrofitClient.authApi.updateSliderImages(updatedList)
                                                } catch (e: Exception) {
                                                    android.util.Log.e("AdminScreen", "Failed to delete slider image: ${e.message}")
                                                }
                                            }
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Delete,
                                            contentDescription = "Delete Image",
                                            tint = MaterialTheme.colorScheme.error
                                        )
                                    }
                                }
                            }
                            if (index < sliderImages.size - 1) {
                                HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        HorizontalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.15f))
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(
                            text = "Add New Slider Image",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        OutlinedTextField(
                            value = newTitle,
                            onValueChange = { newTitle = it },
                            label = { Text("Image Title") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = newUrl,
                            onValueChange = { newUrl = it },
                            label = { Text("Image URL") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = {
                                if (newTitle.isNotEmpty() && newUrl.isNotEmpty()) {
                                    val nextId = (sliderImages.maxOfOrNull { it.id } ?: 0) + 1
                                    val newImg = SliderImage(
                                        id = nextId,
                                        url = newUrl,
                                        title = newTitle,
                                        enabled = true
                                    )
                                    val updatedList = sliderImages + newImg
                                    sliderImages = updatedList
                                    scope.launch {
                                        try {
                                            RetrofitClient.authApi.updateSliderImages(updatedList)
                                            newTitle = ""
                                            newUrl = ""
                                        } catch (e: Exception) {
                                            android.util.Log.e("AdminScreen", "Failed to add slider image: ${e.message}")
                                        }
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Add to Slider")
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    )
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = "System Operations Overview",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "• Active Sessions: 12\n• Database Connections: healthy\n• API Status: all endpoints operational",
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
