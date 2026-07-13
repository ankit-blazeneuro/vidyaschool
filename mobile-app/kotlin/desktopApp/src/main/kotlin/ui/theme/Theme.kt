package ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFFFFFFF),
    onPrimary = Color(0xFF18181B),
    background = Color(0xFF09090B),
    surface = Color(0xFF18181B),
    onSurface = Color(0xFFFFFFFF),
    onBackground = Color(0xFFFFFFFF),
    outline = Color(0xFF27272A),
    surfaceVariant = Color(0xFF09090B),
    secondary = Color(0xFF71717A),
    onSecondary = Color(0xFFFFFFFF)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF18181B),
    onPrimary = Color(0xFFFFFFFF),
    background = Color(0xFFFAFAFA),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF18181B),
    onBackground = Color(0xFF18181B),
    outline = Color(0xFFE4E4E7),
    surfaceVariant = Color(0xFFFAFAFA),
    secondary = Color(0xFFA1A1AA),
    onSecondary = Color(0xFF18181B)
)

@Composable
fun VidyaSchoolTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
