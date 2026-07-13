import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { NotificationHistoryItem } from "../../types";
import { Feather } from "@expo/vector-icons";
import { BottomDrawer } from "../BottomDrawer";

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  visible,
  onClose,
}) => {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap backdrop to close */}
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        {/* Use the exact same BottomDrawer component as the login page */}
        <BottomDrawer scrollEnabled={true} style={styles.drawerStyle}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.outline }]}>
            <Text style={[styles.title, { color: colors.onSurface }]}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.outline }]}>
              <Feather name="x" size={16} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.center}>
              <Feather name="bell-off" size={32} color={colors.secondary} />
              <Text style={[styles.emptyText, { color: colors.secondary }]}>
                No notifications yet
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {notifications.map((item, index) => (
                <React.Fragment key={item.id}>
                  <View style={styles.notificationItem}>
                    <View style={[styles.iconWrapper, { backgroundColor: colors.outline }]}>
                      <Feather name="bell" size={14} color={colors.onSurface} />
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemTitle, { color: colors.onSurface }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.itemTime, { color: colors.secondary }]}>
                          {formatIsoDate(item.created_at)}
                        </Text>
                      </View>
                      <Text style={[styles.itemBody, { color: colors.secondary }]}>
                        {item.body}
                      </Text>
                    </View>
                  </View>
                  {index < notifications.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: colors.outline }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}
        </BottomDrawer>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dismissArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawerStyle: {
    maxHeight: "75%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  },
  listContainer: {
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
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
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 11,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
});

export default NotificationDrawer;
export const NotificationHistoryDrawer = NotificationDrawer;
