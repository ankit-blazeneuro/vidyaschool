import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../../theme/colors";

interface UpdateBannerProps {
  version: string;
  isDownloading: boolean;
  progress: number;
  isDownloaded: boolean;
  onUpdatePress: () => void;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  version,
  isDownloading,
  progress,
  isDownloaded,
  onUpdatePress,
  onDismiss,
}) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.outline,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Update Available ({version})
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {isDownloading
              ? `Downloading update: ${Math.round(progress * 100)}%`
              : isDownloaded
              ? "Update downloaded. Ready to install."
              : "A new version of Vidya School is available."}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onUpdatePress}
            disabled={isDownloading}
            style={[
              styles.updateBtn,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={[styles.updateBtnText, { color: colors.onPrimary }]}>
                {isDownloaded ? "Install" : "Update"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <Feather name="x" size={16} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 13.5,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  subtitle: {
    fontSize: 11.5,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  updateBtnText: {
    fontSize: 12,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  closeBtn: {
    marginLeft: 12,
    padding: 4,
  },
});
export default UpdateBanner;
