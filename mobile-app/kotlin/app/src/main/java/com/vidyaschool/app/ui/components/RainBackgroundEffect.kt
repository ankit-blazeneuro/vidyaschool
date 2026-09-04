package com.vidyaschool.app.ui.components

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.zIndex
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import java.util.Random

enum class RainIntensity(
    val dropCount: Int,
    val speedMin: Float,
    val speedMax: Float,
    val lengthMin: Float,
    val lengthMax: Float,
    val thicknessMin: Float,
    val thicknessMax: Float,
    val alphaMin: Float,
    val alphaMax: Float,
    val windDrift: Float
) {
    LIGHT(
        dropCount = 35,
        speedMin = 0.009f,
        speedMax = 0.016f,
        lengthMin = 18f,
        lengthMax = 32f,
        thicknessMin = 1.0f,
        thicknessMax = 1.4f,
        alphaMin = 0.12f,
        alphaMax = 0.32f,
        windDrift = -0.0008f
    ),
    MODERATE(
        dropCount = 75,
        speedMin = 0.014f,
        speedMax = 0.024f,
        lengthMin = 25f,
        lengthMax = 48f,
        thicknessMin = 1.2f,
        thicknessMax = 1.9f,
        alphaMin = 0.18f,
        alphaMax = 0.48f,
        windDrift = -0.0016f
    ),
    HEAVY(
        dropCount = 140,
        speedMin = 0.020f,
        speedMax = 0.038f,
        lengthMin = 35f,
        lengthMax = 65f,
        thicknessMin = 1.5f,
        thicknessMax = 2.4f,
        alphaMin = 0.25f,
        alphaMax = 0.65f,
        windDrift = -0.0028f
    );

    companion object {
        fun fromWeatherCondition(condition: String?): RainIntensity {
            if (condition.isNullOrBlank()) return MODERATE
            val lower = condition.lowercase()
            return when {
                lower.contains("heavy") || lower.contains("thunder") || lower.contains("storm") ||
                lower.contains("torrential") || lower.contains("violent") || lower.contains("downpour") ||
                lower.contains("monsoon") -> HEAVY
                lower.contains("drizzle") || lower.contains("light") || lower.contains("mist") ||
                lower.contains("fog") || lower.contains("haze") || lower.contains("sprinkle") -> LIGHT
                else -> MODERATE
            }
        }
    }
}

private class RainDrop(
    var x: Float,
    var y: Float,
    var length: Float,
    var speed: Float,
    var alpha: Float,
    var thickness: Float,
    var driftX: Float,
    var isBright: Boolean = false,
    var splashRadius: Float = 0f,
    var splashAlpha: Float = 0f,
    var splashX: Float = 0f,
    var splashY: Float = 0f
)

private data class LightningSegment(
    val start: Offset,
    val end: Offset,
    val isBranch: Boolean = false
)

private fun generateLightningBolt(width: Float, height: Float, random: Random): List<LightningSegment> {
    val segments = mutableListOf<LightningSegment>()
    var currentX = width * (0.20f + random.nextFloat() * 0.60f)
    var currentY = 0f
    val targetY = height * (0.60f + random.nextFloat() * 0.35f)
    val stepCount = 7 + random.nextInt(5)
    val dy = (targetY - currentY) / stepCount

    for (i in 0 until stepCount) {
        val nextY = currentY + dy
        val nextX = currentX + (random.nextFloat() * 48f - 24f)
        segments.add(LightningSegment(Offset(currentX, currentY), Offset(nextX, nextY)))

        // Occasional branching fork
        if (random.nextFloat() < 0.40f && i < stepCount - 2) {
            val branchDir = if (random.nextBoolean()) 1f else -1f
            val branchEndX = nextX + branchDir * (30f + random.nextFloat() * 40f)
            val branchEndY = nextY + (dy * 0.80f)
            segments.add(LightningSegment(Offset(nextX, nextY), Offset(branchEndX, branchEndY), isBranch = true))
        }

        currentX = nextX
        currentY = nextY
    }
    return segments
}

@Composable
fun RainBackgroundEffect(
    modifier: Modifier = Modifier,
    weatherCondition: String? = null,
    intensity: RainIntensity = RainIntensity.fromWeatherCondition(weatherCondition),
    enableSplashes: Boolean = true,
    enableLightning: Boolean = true,
    enableClouds: Boolean = false
) {
    val isDark = MaterialTheme.colorScheme.surface.luminance() < 0.5f

    // Theme-adaptive Background & Raindrop Colors:
    // Dark mode: Pure #000000 black background with gray raindrops
    // Light mode: Pure #FFFFFF white background with #235BBF blue raindrops
    val rainBgColor = MaterialTheme.colorScheme.background

    val dropColorGrayBright = Color(0xFFE4E4E7) // Zinc-200 (crisp foreground gray)
    val dropColorGrayMedium = Color(0xFFA1A1AA) // Zinc-400 (mid-layer gray)
    val dropColorGrayDim = Color(0xFF71717A)    // Zinc-500 (distant background gray)
    val splashColorGray = Color(0xFFD4D4D8)     // Zinc-300 (splash ripple gray)

    val rainBlueColor = Color(0xFF235BBF)       // User requested #235BBF for light mode

    val context = LocalContext.current
    val cloudBitmap1 = remember(context) {
        try {
            context.assets.open("cloud_1.png").use { stream ->
                BitmapFactory.decodeStream(stream)?.asImageBitmap()
            }
        } catch (e: Exception) {
            null
        }
    }
    val cloudBitmap2 = remember(context) {
        try {
            context.assets.open("cloud_2.png").use { stream ->
                BitmapFactory.decodeStream(stream)?.asImageBitmap()
            }
        } catch (e: Exception) {
            null
        }
    }

    val random = remember { Random() }
    val drops = remember(intensity) {
        Array(intensity.dropCount) {
            val isBright = random.nextFloat() < 0.35f
            RainDrop(
                x = random.nextFloat(),
                y = random.nextFloat(),
                length = intensity.lengthMin + random.nextFloat() * (intensity.lengthMax - intensity.lengthMin),
                speed = intensity.speedMin + random.nextFloat() * (intensity.speedMax - intensity.speedMin),
                alpha = intensity.alphaMin + random.nextFloat() * (intensity.alphaMax - intensity.alphaMin),
                thickness = intensity.thicknessMin + random.nextFloat() * (intensity.thicknessMax - intensity.thicknessMin),
                driftX = intensity.windDrift + (random.nextFloat() * 0.0006f - 0.0003f),
                isBright = isBright
            )
        }
    }

    // Lightning flash state
    var lightningFlashAlpha by remember { mutableStateOf(0f) }
    var activeLightningBolt by remember { mutableStateOf<List<LightningSegment>>(emptyList()) }
    var canvasWidth by remember { mutableStateOf(0f) }
    var canvasHeight by remember { mutableStateOf(0f) }

    // Random Lightning Strike Loop (fires every 4 to 8.5 seconds)
    LaunchedEffect(enableLightning) {
        if (!enableLightning) return@LaunchedEffect
        while (isActive) {
            val nextDelay = 4000L + random.nextInt(4500).toLong()
            delay(nextDelay)

            if (canvasWidth > 50f && canvasHeight > 50f) {
                // Generate bolt path
                val bolt = generateLightningBolt(canvasWidth, canvasHeight, random)
                activeLightningBolt = bolt

                // Strike 1 (pre-flash)
                lightningFlashAlpha = 0.55f
                delay(40L)
                lightningFlashAlpha = 0.15f
                delay(30L)

                // Strike 2 (main intense burst)
                lightningFlashAlpha = 0.85f
                delay(65L)

                // Decay fade out
                val startFade = System.currentTimeMillis()
                val duration = 200L
                while (isActive && System.currentTimeMillis() - startFade < duration) {
                    val progress = (System.currentTimeMillis() - startFade).toFloat() / duration
                    lightningFlashAlpha = (1f - progress) * 0.85f
                    delay(16L)
                }

                lightningFlashAlpha = 0f
                activeLightningBolt = emptyList()
            }
        }
    }

    // High performance frame clock animation
    var frameTick by remember { mutableStateOf(0L) }
    LaunchedEffect(intensity) {
        var lastTime = 0L
        while (isActive) {
            withFrameNanos { time ->
                if (lastTime == 0L) lastTime = time
                val delta = (time - lastTime) / 1_000_000_000f
                lastTime = time

                // Update drop positions in-place
                val timeScale = (delta * 60f).coerceIn(0.5f, 2.0f)
                for (drop in drops) {
                    drop.y += drop.speed * timeScale
                    drop.x += drop.driftX * timeScale

                    // Splash decay
                    if (drop.splashAlpha > 0f) {
                        drop.splashRadius += 2.0f * timeScale
                        drop.splashAlpha -= 0.05f * timeScale
                        if (drop.splashAlpha < 0f) drop.splashAlpha = 0f
                    }

                    // Reset drop when reaching the bottom
                    if (drop.y > 1.05f) {
                        if (enableSplashes && random.nextFloat() < 0.65f) {
                            drop.splashX = drop.x
                            drop.splashY = 0.98f
                            drop.splashRadius = 2f
                            drop.splashAlpha = drop.alpha * 0.85f
                        }
                        drop.y = -0.08f
                        drop.x = random.nextFloat()
                        drop.speed = intensity.speedMin + random.nextFloat() * (intensity.speedMax - intensity.speedMin)
                        drop.length = intensity.lengthMin + random.nextFloat() * (intensity.lengthMax - intensity.lengthMin)
                        drop.alpha = intensity.alphaMin + random.nextFloat() * (intensity.alphaMax - intensity.alphaMin)
                        drop.isBright = random.nextFloat() < 0.35f
                    }

                    // Wrap x coordinate
                    if (drop.x < 0f) drop.x += 1f
                    if (drop.x > 1f) drop.x -= 1f
                }
                frameTick = time
            }
        }
    }

    Box(
        modifier = modifier
            .zIndex(-1f)
            .clipToBounds()
            .background(rainBgColor)
    ) {
        // Balanced Optimum Clouds Canopy (toggleable via enableClouds)
        if (enableClouds && (cloudBitmap1 != null || cloudBitmap2 != null)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(115.dp)
                    .align(Alignment.TopCenter)
                    .alpha(0.75f)
            ) {
                if (cloudBitmap2 != null) {
                    Image(
                        bitmap = cloudBitmap2,
                        contentDescription = "Rain Cloud 2",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .width(200.dp)
                            .height(82.dp)
                            .align(Alignment.TopStart)
                            .offset(x = (-10).dp, y = 16.dp)
                    )
                }
                if (cloudBitmap1 != null) {
                    Image(
                        bitmap = cloudBitmap1,
                        contentDescription = "Rain Cloud 1",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .width(210.dp)
                            .height(88.dp)
                            .align(Alignment.TopEnd)
                            .offset(x = 10.dp, y = 14.dp)
                    )
                }
            }
        }

        // Raindrop and Lightning Canvas
        Canvas(modifier = Modifier.fillMaxSize()) {
            @Suppress("UNUSED_VARIABLE")
            val tick = frameTick
            val width = size.width
            val height = size.height

            // Update canvas dimensions for lightning generator
            if (canvasWidth != width || canvasHeight != height) {
                canvasWidth = width
                canvasHeight = height
            }

            // 1. Ambient Sky Flash with Vertical Gradient Fade (seamlessly dissolves toward the bottom)
            if (lightningFlashAlpha > 0.01f) {
                val flashBaseColor = if (isDark) Color(0xFFE0F2FE) else Color(0xFF93C5FD)
                val flashGradient = Brush.verticalGradient(
                    listOf(
                        flashBaseColor.copy(alpha = (lightningFlashAlpha * 0.32f).coerceAtMost(0.38f)),
                        flashBaseColor.copy(alpha = (lightningFlashAlpha * 0.22f).coerceAtMost(0.28f)),
                        flashBaseColor.copy(alpha = (lightningFlashAlpha * 0.08f).coerceAtMost(0.12f)),
                        Color.Transparent
                    )
                )
                drawRect(
                    brush = flashGradient,
                    size = size
                )
            }

            // 2. Realistic Jagged Lightning Bolt with Bottom Gradient Fade & Seam Bloom
            if (activeLightningBolt.isNotEmpty() && lightningFlashAlpha > 0.05f) {
                val boltCoreColor = if (isDark) Color.White else Color(0xFF235BBF)
                val boltGlowColor = if (isDark) Color(0xFF93C5FD) else Color(0xFF60A5FA)

                for (seg in activeLightningBolt) {
                    val branchScale = if (seg.isBranch) 0.65f else 1.0f

                    // Calculate smooth gradient fade factor as the bolt approaches the bottom boundary
                    val avgY = (seg.start.y + seg.end.y) / 2f
                    val yRatio = (avgY / height.coerceAtLeast(1f)).coerceIn(0f, 1f)
                    val bottomFade = if (yRatio > 0.60f) {
                        ((1.0f - yRatio) / 0.40f).coerceIn(0f, 1f)
                    } else {
                        1.0f
                    }
                    val effectiveAlpha = lightningFlashAlpha * bottomFade

                    if (effectiveAlpha > 0.01f) {
                        // Outer electric glow
                        drawLine(
                            color = boltGlowColor.copy(alpha = effectiveAlpha * 0.60f),
                            start = seg.start,
                            end = seg.end,
                            strokeWidth = 5.5f * branchScale,
                            cap = StrokeCap.Round
                        )

                        // Core bright electric bolt
                        drawLine(
                            color = boltCoreColor.copy(alpha = effectiveAlpha),
                            start = seg.start,
                            end = seg.end,
                            strokeWidth = 2.2f * branchScale,
                            cap = StrokeCap.Round
                        )
                    }
                }

                // Atmospheric Seam Bloom: Smooth radiant glow between the raining part and below that
                val lastSeg = activeLightningBolt.lastOrNull()
                if (lastSeg != null) {
                    val bloomCenter = Offset(lastSeg.end.x, height)
                    val bloomColor = if (isDark) Color(0xFF93C5FD) else Color(0xFF60A5FA)
                    drawCircle(
                        brush = Brush.radialGradient(
                            listOf(
                                bloomColor.copy(alpha = lightningFlashAlpha * 0.28f),
                                bloomColor.copy(alpha = lightningFlashAlpha * 0.10f),
                                Color.Transparent
                            ),
                            center = bloomCenter,
                            radius = 180f
                        ),
                        radius = 180f,
                        center = bloomCenter
                    )
                }
            }

            // 3. Falling Raindrop Streaks
            for (drop in drops) {
                val startX = drop.x * width
                val startY = drop.y * height
                val endX = startX + (drop.driftX * 2200f)
                val endY = startY + drop.length

                val baseColor = if (isDark) {
                    when {
                        drop.isBright -> dropColorGrayBright
                        drop.alpha > 0.35f -> dropColorGrayMedium
                        else -> dropColorGrayDim
                    }
                } else {
                    when {
                        drop.isBright -> rainBlueColor
                        drop.alpha > 0.35f -> rainBlueColor.copy(alpha = 0.85f)
                        else -> rainBlueColor.copy(alpha = 0.65f)
                    }
                }

                // Draw raindrop streak
                drawLine(
                    color = baseColor.copy(alpha = drop.alpha),
                    start = Offset(startX, startY),
                    end = Offset(endX, endY),
                    strokeWidth = drop.thickness,
                    cap = StrokeCap.Round
                )

                // Draw splash ripple at bottom
                if (enableSplashes && drop.splashAlpha > 0f) {
                    val splashCenterX = drop.splashX * width
                    val splashCenterY = drop.splashY * height
                    val activeSplashColor = if (isDark) splashColorGray else rainBlueColor

                    // Ripple ring
                    drawCircle(
                        color = activeSplashColor.copy(alpha = drop.splashAlpha * 0.70f),
                        radius = drop.splashRadius,
                        center = Offset(splashCenterX, splashCenterY),
                        style = Stroke(width = 1.2f)
                    )

                    // Inner splash droplet
                    drawCircle(
                        color = activeSplashColor.copy(alpha = drop.splashAlpha),
                        radius = (drop.splashRadius * 0.4f).coerceAtLeast(1f),
                        center = Offset(splashCenterX, splashCenterY)
                    )
                }
            }
        }
    }
}
