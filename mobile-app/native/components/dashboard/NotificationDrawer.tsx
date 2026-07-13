import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { NotificationHistoryItem } from "../../types";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONT_FAMILY } from "../../theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // B&W Contrast Theme logic for dark/light mode
  const sheetBg = isDark ? "#09090B" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#0a0a0a";
  const subtextColor = isDark ? "#a1a1aa" : "#71717a";
  const itemBg = isDark ? "#18181B" : "#fafafa";
  const itemBorder = isDark ? "#27272A" : "#f4f4f5";
  const iconWrapBg = isDark ? "#27272A" : "#f4f4f5";
  const dividerBg = isDark ? "#27272A" : "#e4e4e7";
  const closeBtnBg = isDark ? "#27272A" : "#f4f4f5";
  const handleBg = isDark ? "#3f3f46" : "#d4d4d8";

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getNotificationHistory();
      if (response.ok) {
        const data = await response.json();
        setNotifications(data || []);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const formatIsoDate = (isoStr: string): string => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <BlurView intensity={18} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <TouchableOpacity
        style={styles.dismissArea}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: sheetBg,
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 16,
            height: SHEET_HEIGHT,
          },
        ]}
      >
        {/* Pill handle */}
        <View style={[styles.handle, { backgroundColor: handleBg }]} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: dividerBg }]}>
          <Text style={[styles.title, { color: textColor }]}>Notifications</Text>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeBtn, { backgroundColor: closeBtnBg }]}
          >
            <Feather name="x" size={16} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Body content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={textColor} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIconCircle, { backgroundColor: iconWrapBg }]}>
              <Feather name="bell-off" size={28} color={textColor} />
            </View>
            <Text style={[styles.emptyText, { color: textColor }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtext, { color: subtextColor }]}>
              We'll let you know when something important arrives.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {notifications.map((item, index) => (
              <React.Fragment key={item.id}>
                <View style={[styles.notificationItem, { backgroundColor: itemBg, borderColor: itemBorder }]}>
                  <View style={[styles.iconWrapper, { backgroundColor: iconWrapBg }]}>
                    <Feather name="bell" size={14} color={textColor} />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { color: textColor }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.itemTime, { color: subtextColor }]}>
                        {formatIsoDate(item.created_at)}
                      </Text>
                    </View>
                    <Text style={[styles.itemBody, { color: subtextColor }]}>
                      {item.body}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
    fontFamily: FONT_FAMILY,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FONT_FAMILY,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
    fontFamily: FONT_FAMILY,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
  itemTime: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: FONT_FAMILY,
  },
});

export default NotificationDrawer;
export const NotificationHistoryDrawer = NotificationDrawer;
