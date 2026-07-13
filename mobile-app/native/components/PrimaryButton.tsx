import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useThemeColors } from "../theme/ThemeContext";
import { FONT_FAMILY } from "../theme/colors";

interface PrimaryButtonProps {
  text: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text,
  onPress,
  loading = false,
  disabled = false,
  style,
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
          backgroundColor: colors.primary,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.onPrimary} />
      ) : (
        <Text style={[styles.text, { color: colors.onPrimary }]}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",

      fontFamily: FONT_FAMILY,

    },
});
