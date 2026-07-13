import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { useThemeColors } from "../theme/ThemeContext";
import { FONT_FAMILY } from "../theme/colors";

interface SecondaryButtonProps {
  text: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  icon?: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  text,
  onPress,
  loading = false,
  disabled = false,
  style,
  icon,
}) => {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          borderColor: colors.outline,
          backgroundColor: colors.surface,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.onSurface} />
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: colors.onSurface }]}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: FONT_FAMILY,
  },
});

