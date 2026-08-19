package com.vidyaschool.app.ui.shadcn

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class BadgeVariant {
    DEFAULT,
    SECONDARY,
    OUTLINE,
    DESTRUCTIVE,
    SUCCESS
}

/**
 * shadcn/ui-inspired Badge component for Jetpack Compose
 */
@Composable
fun Badge(
    text: String,
    modifier: Modifier = Modifier,
    variant: BadgeVariant = BadgeVariant.DEFAULT,
    leadingIcon: (@Composable () -> Unit)? = null
) {
    val isDark = isSystemInDarkTheme()

    val (bgColor, textColor, borderColor) = when (variant) {
        BadgeVariant.DEFAULT -> Triple(
            if (isDark) Color(0xFFFAFAFA) else Color(0xFF09090B),
            if (isDark) Color(0xFF09090B) else Color(0xFFFAFAFA),
            Color.Transparent
        )
        BadgeVariant.SECONDARY -> Triple(
            if (isDark) Color(0xFF27272A) else Color(0xFFF4F4F5),
            if (isDark) Color(0xFFFAFAFA) else Color(0xFF18181B),
            Color.Transparent
        )
        BadgeVariant.OUTLINE -> Triple(
            Color.Transparent,
            if (isDark) Color(0xFFFAFAFA) else Color(0xFF09090B),
            if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
        )
        BadgeVariant.DESTRUCTIVE -> Triple(
            if (isDark) Color(0xFF7F1D1D).copy(alpha = 0.4f) else Color(0xFFFEE2E2),
            if (isDark) Color(0xFFFCA5A5) else Color(0xFF991B1B),
            if (isDark) Color(0xFF991B1B).copy(alpha = 0.5f) else Color(0xFFFECACA)
        )
        BadgeVariant.SUCCESS -> Triple(
            if (isDark) Color(0xFF064E3B).copy(alpha = 0.4f) else Color(0xFFDCFCE7),
            if (isDark) Color(0xFF6EE7B7) else Color(0xFF166534),
            if (isDark) Color(0xFF059669).copy(alpha = 0.5f) else Color(0xFFBBF7D0)
        )
    }

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .then(
                if (borderColor != Color.Transparent)
                    Modifier.border(1.dp, borderColor, RoundedCornerShape(6.dp))
                else Modifier
            )
            .padding(horizontal = 8.dp, vertical = 2.5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        leadingIcon?.invoke()
        Text(
            text = text,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = textColor,
            letterSpacing = 0.2.sp
        )
    }
}
