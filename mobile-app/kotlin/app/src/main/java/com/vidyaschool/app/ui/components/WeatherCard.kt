package com.vidyaschool.app.ui.components

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import androidx.core.content.ContextCompat
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.api.WeatherResponse
import kotlinx.coroutines.launch

@Composable
fun WeatherCard(
    modifier: Modifier = Modifier,
    city: String? = null,
    onCardClick: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var weatherData by remember { mutableStateOf<WeatherResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isRefreshing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun fetchWeather(showRefreshAnimation: Boolean = false) {
        if (showRefreshAnimation) {
            isRefreshing = true
        } else {
            isLoading = true
        }
        errorMessage = null

        coroutineScope.launch {
            try {
                // Determine user's coordinates if location permission is granted
                var lat: Double? = null
                var lon: Double? = null

                val hasFineLocation = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                val hasCoarseLocation = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (hasFineLocation || hasCoarseLocation) {
                    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                    val lastKnownGps = try { locationManager?.getLastKnownLocation(LocationManager.GPS_PROVIDER) } catch (e: Exception) { null }
                    val lastKnownNetwork = try { locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER) } catch (e: Exception) { null }
                    val bestLocation: Location? = lastKnownGps ?: lastKnownNetwork

                    if (bestLocation != null) {
                        lat = bestLocation.latitude
                        lon = bestLocation.longitude
                    }
                }

                // Query API with coordinates or city
                val response = RetrofitClient.authApi.getCurrentWeather(
                    lat = lat,
                    lon = lon,
                    city = if (lat == null) city?.takeIf { it.isNotBlank() } else null
                )

                if (response.isSuccessful && response.body() != null) {
                    weatherData = response.body()
                } else {
                    errorMessage = "Unable to load weather"
                }
            } catch (e: Exception) {
                android.util.Log.e("WeatherCard", "Failed to fetch weather: ${e.message}")
                errorMessage = "Weather offline"
            } finally {
                isLoading = false
                isRefreshing = false
            }
        }
    }

    LaunchedEffect(city) {
        fetchWeather()
    }

    val isDark = MaterialTheme.colorScheme.surface.luminance() < 0.5f
    val borderColor = MaterialTheme.colorScheme.outline.copy(alpha = if (isDark) 0.2f else 0.15f)
    val onSurface = MaterialTheme.colorScheme.onSurface

    // Continuous rotation for refresh icon when refreshing
    val infiniteTransition = rememberInfiniteTransition(label = "weatherRefresh")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "refreshSpin"
    )

    if (isLoading && weatherData == null) {
        WeatherCardSkeleton(modifier = modifier, isDark = isDark, borderColor = borderColor)
        return
    }

    val weather = weatherData
    val current = weather?.current
    val location = weather?.location

    val temp = current?.temperature?.let { Math.round(it) } ?: 28
    val feelsLike = current?.feelsLike?.let { Math.round(it) } ?: temp
    val description = current?.weatherDescriptions?.firstOrNull() ?: "Clear & Sunny"
    val iconUrl = current?.weatherIcons?.firstOrNull()
    val locationName = location?.name?.takeIf { it.isNotBlank() } ?: (city ?: "Campus Weather")
    val regionName = location?.region?.takeIf { it.isNotBlank() && it != locationName }

    val fullLocationText = if (regionName != null) "$locationName, $regionName" else locationName
    val isCached = weather?.cached == true || weather?.costSaved == true

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(
                brush = Brush.verticalGradient(
                    colors = if (isDark) {
                        listOf(
                            Color(0xFF1E2430),
                            Color(0xFF161922)
                        )
                    } else {
                        listOf(
                            Color(0xFFF0F5FF),
                            Color(0xFFE8EEFC)
                        )
                    }
                )
            )
            .border(1.dp, borderColor, RoundedCornerShape(16.dp))
            .then(
                if (onCardClick != null) Modifier.clickable { onCardClick() } else Modifier
            )
            .padding(16.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // ── Top Bar: Location & Refresh ──────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .clip(CircleShape)
                            .background(
                                if (isDark) Color(0xFF38BDF8).copy(alpha = 0.2f)
                                else Color(0xFF0284C7).copy(alpha = 0.15f)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.LocationOn,
                            contentDescription = "Location",
                            tint = if (isDark) Color(0xFF38BDF8) else Color(0xFF0284C7),
                            modifier = Modifier.size(14.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = fullLocationText,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Smart Caching / Cost Minimization Indicator
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(
                                if (isCached) {
                                    if (isDark) Color(0xFF10B981).copy(alpha = 0.18f)
                                    else Color(0xFF059669).copy(alpha = 0.12f)
                                } else {
                                    if (isDark) Color(0xFF6366F1).copy(alpha = 0.18f)
                                    else Color(0xFF4F46E5).copy(alpha = 0.12f)
                                }
                            )
                            .padding(horizontal = 7.dp, vertical = 2.5.dp)
                    ) {
                        Text(
                            text = if (isCached) "⚡ Optimized" else "🟢 Live",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isCached) {
                                if (isDark) Color(0xFF34D399) else Color(0xFF059669)
                            } else {
                                if (isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                            }
                        )
                    }

                    // Refresh Button
                    IconButton(
                        onClick = { fetchWeather(showRefreshAnimation = true) },
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh Weather",
                            tint = onSurface.copy(alpha = 0.5f),
                            modifier = Modifier
                                .size(15.dp)
                                .rotate(if (isRefreshing) rotation else 0f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // ── Main Temp & Weather Condition Row ────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Row(verticalAlignment = Alignment.Top) {
                        Text(
                            text = "$temp",
                            fontSize = 36.sp,
                            fontWeight = FontWeight.Bold,
                            color = onSurface,
                            letterSpacing = (-1).sp
                        )
                        Text(
                            text = "°C",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Medium,
                            color = onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.padding(top = 4.dp, start = 2.dp)
                        )
                    }
                    Text(
                        text = description,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = onSurface
                    )
                    Text(
                        text = "Feels like $feelsLike°C",
                        fontSize = 11.sp,
                        color = onSurface.copy(alpha = 0.5f)
                    )
                }

                // Weather Icon / Image
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            if (isDark) Color.White.copy(alpha = 0.08f)
                            else Color.White.copy(alpha = 0.6f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (!iconUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = iconUrl,
                            contentDescription = description,
                            modifier = Modifier.size(42.dp)
                        )
                    } else {
                        // Vector icon fallback based on condition
                        val fallbackIcon = getWeatherFallbackIcon(description)
                        Icon(
                            imageVector = fallbackIcon,
                            contentDescription = description,
                            tint = if (isDark) Color(0xFFFBBF24) else Color(0xFFD97706),
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ── Metrics Grid Row ─────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(
                        if (isDark) Color.Black.copy(alpha = 0.25f)
                        else Color.White.copy(alpha = 0.45f)
                    )
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                WeatherMetricItem(
                    icon = Icons.Outlined.WaterDrop,
                    label = "Humidity",
                    value = "${current?.humidity ?: 48}%",
                    tint = if (isDark) Color(0xFF38BDF8) else Color(0xFF0284C7)
                )

                WeatherMetricDivider(isDark)

                WeatherMetricItem(
                    icon = Icons.Outlined.Air,
                    label = "Wind",
                    value = "${current?.windSpeed?.let { Math.round(it) } ?: 10} km/h",
                    tint = if (isDark) Color(0xFFA78BFA) else Color(0xFF7C3AED)
                )

                WeatherMetricDivider(isDark)

                WeatherMetricItem(
                    icon = Icons.Outlined.WbSunny,
                    label = "UV Index",
                    value = "${current?.uvIndex ?: 5}",
                    tint = if (isDark) Color(0xFFFBBF24) else Color(0xFFD97706)
                )

                WeatherMetricDivider(isDark)

                WeatherMetricItem(
                    icon = Icons.Outlined.Visibility,
                    label = "Visibility",
                    value = "${current?.visibility?.let { Math.round(it) } ?: 8} km",
                    tint = if (isDark) Color(0xFF34D399) else Color(0xFF059669)
                )
            }
        }
    }
}

@Composable
private fun WeatherMetricItem(
    icon: ImageVector,
    label: String,
    value: String,
    tint: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = tint,
                modifier = Modifier.size(11.dp)
            )
            Spacer(modifier = Modifier.width(3.dp))
            Text(
                text = label,
                fontSize = 9.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = value,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun WeatherMetricDivider(isDark: Boolean) {
    Box(
        modifier = Modifier
            .width(1.dp)
            .height(22.dp)
            .background(
                if (isDark) Color.White.copy(alpha = 0.1f)
                else Color.Black.copy(alpha = 0.08f)
            )
    )
}

@Composable
private fun WeatherCardSkeleton(
    modifier: Modifier = Modifier,
    isDark: Boolean,
    borderColor: Color
) {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shimmerAlpha"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(145.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
                if (isDark) Color(0xFF1E2430).copy(alpha = alpha)
                else Color(0xFFF0F5FF).copy(alpha = alpha)
            )
            .border(1.dp, borderColor, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Box(
                    modifier = Modifier
                        .size(width = 120.dp, height = 16.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                )
                Box(
                    modifier = Modifier
                        .size(width = 60.dp, height = 16.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Box(
                        modifier = Modifier
                            .size(width = 70.dp, height = 30.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .size(width = 100.dp, height = 12.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                    )
                }
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(30.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
            )
        }
    }
}

private fun getWeatherFallbackIcon(description: String): ImageVector {
    val lower = description.lowercase()
    return when {
        lower.contains("rain") || lower.contains("shower") || lower.contains("drizzle") -> Icons.Outlined.WaterDrop
        lower.contains("cloud") || lower.contains("overcast") -> Icons.Outlined.Cloud
        lower.contains("thunder") || lower.contains("storm") || lower.contains("lightning") -> Icons.Outlined.Bolt
        lower.contains("snow") || lower.contains("ice") || lower.contains("sleet") -> Icons.Outlined.AcUnit
        lower.contains("fog") || lower.contains("mist") || lower.contains("haze") -> Icons.Outlined.Air
        else -> Icons.Outlined.WbSunny
    }
}
