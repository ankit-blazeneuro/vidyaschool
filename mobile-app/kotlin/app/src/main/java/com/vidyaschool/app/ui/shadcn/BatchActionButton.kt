package com.vidyaschool.app.ui.shadcn

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class BatchActionItem(
    val label: String,
    val icon: ImageVector? = null,
    val onClick: () -> Unit,
    val isDestructive: Boolean = false,
    val enabled: Boolean = true
)

/**
 * shadcn/ui-inspired Batch Action Button & Selection Toolbar Component
 */
@Composable
fun BatchActionButton(
    modifier: Modifier = Modifier,
    selectedCount: Int = 0,
    label: String = "Batch Actions",
    isLoading: Boolean = false,
    disabled: Boolean = false,
    onEditSelected: (() -> Unit)? = null,
    onDeleteSelected: (() -> Unit)? = null,
    onExportSelected: (() -> Unit)? = null,
    onArchiveSelected: (() -> Unit)? = null,
    customActions: List<BatchActionItem> = emptyList(),
    onClearSelection: (() -> Unit)? = null,
    isToolbarVariant: Boolean = false
) {
    val isDark = isSystemInDarkTheme()
    var expanded by remember { mutableStateOf(false) }

    // shadcn neutral color palette
    val bgColor = if (isDark) Color(0xFF09090B) else Color(0xFFFFFFFF)
    val mutedBg = if (isDark) Color(0xFF27272A) else Color(0xFFF4F4F5)
    val borderColor = if (isDark) Color(0xFF27272A) else Color(0xFFE4E4E7)
    val activeBorderColor = if (isDark) Color(0xFF71717A) else Color(0xFFA1A1AA)
    val textPrimary = if (isDark) Color(0xFFFAFAFA) else Color(0xFF09090B)
    val textMuted = if (isDark) Color(0xFFA1A1AA) else Color(0xFF71717A)
    val destructiveColor = if (isDark) Color(0xFFEF4444) else Color(0xFFDC2626)

    val isButtonDisabled = disabled || (selectedCount == 0 && customActions.isEmpty())
    val rotationState by animateFloatAsState(targetValue = if (expanded) 180f else 0f, label = "chevron_rotate")

    Box(modifier = modifier) {
        if (isToolbarVariant && selectedCount > 0) {
            // Selection Toolbar Format: "5 selected | Batch Actions ▾"
            Row(
                modifier = Modifier
                    .height(38.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(bgColor)
                    .border(1.dp, borderColor, RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "Selected",
                    tint = textPrimary,
                    modifier = Modifier.size(15.dp)
                )
                Text(
                    text = "$selectedCount selected",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = textPrimary
                )

                if (onClearSelection != null) {
                    Text(
                        text = "Clear",
                        fontSize = 11.sp,
                        color = textMuted,
                        modifier = Modifier
                            .clickable { onClearSelection() }
                            .padding(horizontal = 4.dp)
                    )
                }

                // Divider
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(16.dp)
                        .background(borderColor)
                )

                // Trigger
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .clickable(enabled = !isButtonDisabled && !isLoading) { expanded = true }
                        .padding(horizontal = 6.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp, color = textMuted)
                    } else {
                        Icon(imageVector = Icons.Default.Layers, contentDescription = "Batch Actions", tint = textMuted, modifier = Modifier.size(15.dp))
                    }
                    Text(text = label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                    Icon(imageVector = Icons.Default.KeyboardArrowDown, contentDescription = "Dropdown", tint = textMuted, modifier = Modifier.size(15.dp).rotate(rotationState))
                }
            }
        } else {
            // Standard Batch Action Button
            Row(
                modifier = Modifier
                    .height(38.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (expanded) mutedBg else bgColor)
                    .border(
                        width = 1.dp,
                        color = if (expanded) activeBorderColor else borderColor,
                        shape = RoundedCornerShape(8.dp)
                    )
                    .clickable(enabled = !isButtonDisabled && !isLoading) { expanded = true }
                    .padding(horizontal = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = textMuted)
                } else {
                    Icon(
                        imageVector = Icons.Default.Layers,
                        contentDescription = "Batch",
                        tint = if (isButtonDisabled) textMuted.copy(alpha = 0.5f) else textMuted,
                        modifier = Modifier.size(16.dp)
                    )
                }

                val buttonText = if (selectedCount > 0) "$label ($selectedCount)" else label
                Text(
                    text = buttonText,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isButtonDisabled) textMuted.copy(alpha = 0.5f) else textPrimary
                )

                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = "Expand",
                    tint = if (isButtonDisabled) textMuted.copy(alpha = 0.5f) else textMuted,
                    modifier = Modifier.size(16.dp).rotate(rotationState)
                )
            }
        }

        // shadcn/ui-styled DropdownMenu
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier
                .width(200.dp)
                .background(bgColor)
                .border(1.dp, borderColor, RoundedCornerShape(10.dp))
        ) {
            if (selectedCount > 0) {
                Text(
                    text = "BULK ACTIONS ($selectedCount)",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = textMuted,
                    letterSpacing = 0.5.sp,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
                HorizontalDivider(color = borderColor)
            }

            if (onEditSelected != null) {
                DropdownMenuItem(
                    text = { Text("Edit selected", fontSize = 13.sp, color = textPrimary) },
                    leadingIcon = { Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(16.dp), tint = textMuted) },
                    onClick = {
                        expanded = false
                        onEditSelected()
                    }
                )
            }

            if (onExportSelected != null) {
                DropdownMenuItem(
                    text = { Text("Export selected", fontSize = 13.sp, color = textPrimary) },
                    leadingIcon = { Icon(Icons.Default.Download, contentDescription = "Export", modifier = Modifier.size(16.dp), tint = textMuted) },
                    onClick = {
                        expanded = false
                        onExportSelected()
                    }
                )
            }

            if (onArchiveSelected != null) {
                DropdownMenuItem(
                    text = { Text("Archive selected", fontSize = 13.sp, color = textPrimary) },
                    leadingIcon = { Icon(Icons.Default.Archive, contentDescription = "Archive", modifier = Modifier.size(16.dp), tint = textMuted) },
                    onClick = {
                        expanded = false
                        onArchiveSelected()
                    }
                )
            }

            customActions.forEach { action ->
                DropdownMenuItem(
                    text = { Text(action.label, fontSize = 13.sp, color = if (action.isDestructive) destructiveColor else textPrimary) },
                    leadingIcon = action.icon?.let { icon ->
                        { Icon(icon, contentDescription = action.label, modifier = Modifier.size(16.dp), tint = if (action.isDestructive) destructiveColor else textMuted) }
                    },
                    enabled = action.enabled,
                    onClick = {
                        expanded = false
                        action.onClick()
                    }
                )
            }

            if (onDeleteSelected != null) {
                HorizontalDivider(color = borderColor)
                DropdownMenuItem(
                    text = { Text("Delete selected", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = destructiveColor) },
                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(16.dp), tint = destructiveColor) },
                    onClick = {
                        expanded = false
                        onDeleteSelected()
                    }
                )
            }
        }
    }
}
