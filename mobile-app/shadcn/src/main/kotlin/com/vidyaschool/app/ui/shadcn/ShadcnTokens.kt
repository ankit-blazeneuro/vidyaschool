package com.vidyaschool.app.ui.shadcn

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.MaterialTheme

/**
 * Design tokens aligned with the web shadcn/ui theme (zinc palette).
 */
object ShadcnTokens {
    val InputHeight: Dp = 42.dp
    val InputRadius: Dp = 8.dp
    val InputHorizontalPadding: Dp = 10.dp
    val InputFontSize = 14.sp
    val InputBorderWidth: Dp = 1.dp
    val FocusRingWidth: Dp = 3.dp
    val FocusRingRadius: Dp = 10.dp

    @Composable
    fun inputBackground(isDark: Boolean): Color {
        return if (isDark) {
            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)
        } else {
            Color.Transparent
        }
    }

    @Composable
    fun mutedForeground(): Color = MaterialTheme.colorScheme.secondary

    @Composable
    fun ringColor(): Color = MaterialTheme.colorScheme.primary

    @Composable
    fun borderColor(focused: Boolean, enabled: Boolean): Color {
        if (!enabled) {
            return MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
        }
        return if (focused) {
            ringColor()
        } else {
            MaterialTheme.colorScheme.outline
        }
    }
}
