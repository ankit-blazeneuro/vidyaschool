import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useThemeColors, useTheme } from "../theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomMenuIcon, CustomNotificationIcon } from "./icons/CustomIcons";
import { FONT_FAMILY } from "../theme/colors";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onMenuPress: () => void;
  onNotificationPress: () => void;
  style?: any;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onMenuPress,
  onNotificationPress,
  style,
}) => {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const buttonBorderColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(24, 24, 27, 0.15)";
  const subtitleColor = isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(24, 24, 27, 0.6)";

  const topOffset = insets.top > 16 ? insets.top - 16 : 0;

  return (
    <View style={[styles.container, { marginTop: topOffset }, style]}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={onMenuPress}
          activeOpacity={0.7}
          style={[
            styles.iconButton,
            {
              borderColor: buttonBorderColor,
            },
          ]}
        >
          <CustomMenuIcon size={18} color={colors.onBackground} />
        </TouchableOpacity>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.onBackground }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onNotificationPress}
        activeOpacity={0.7}
        style={[
          styles.iconButton,
          {
            borderColor: buttonBorderColor,
          },
        ]}
      >
        <CustomNotificationIcon size={18} color={colors.onBackground} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  subtitle: {
    fontSize: 12,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
});
export default DashboardHeader;
