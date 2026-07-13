import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { NoticeResponse } from "../../types";
import { DashboardHeader } from "../DashboardHeader";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../../theme/colors";

interface NoticeTabContentProps {
  onMenuPress: () => void;
  onNotificationPress: () => void;
  onScroll?: (event: any) => void;
}

export const NoticeTabContent: React.FC<NoticeTabContentProps> = ({
  onMenuPress,
  onNotificationPress,
  onScroll,
}) => {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotices = async () => {
    try {
      const response = await ApiService.getNotices();
      if (response.ok) {
        const data = await response.json();
        setNotices(data || []);
      }
    } catch (e) {
      console.error("Failed to load notices", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotices();
  };

  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const renderNoticeItem = ({ item }: { item: NoticeResponse }) => {
    return (
      <View
        style={[
          styles.card,
          {
            borderColor: colors.outline,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleWrapper}>
            <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.isUrgent && (
              <View style={[styles.urgentBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.categoryBadge,
              {
                borderColor: colors.outline,
                backgroundColor: colors.outline,
              },
            ]}
          >
            <Text style={[styles.categoryText, { color: colors.onSurface }]}>
              {item.category.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.content, { color: colors.mutedText }]}>
          {item.content}
        </Text>

        <View style={[styles.footer, { borderTopColor: colors.outline }]}>
          <Text style={[styles.footerText, { color: colors.secondary }]}>
            By: {item.senderName || "School Administration"}
          </Text>
          <Text style={[styles.footerText, { color: colors.secondary }]}>
            {formatTimestamp(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        renderItem={renderNoticeItem}
        contentContainerStyle={styles.list}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <DashboardHeader
            title="Notice Board"
            subtitle="Official notices & announcements"
            onMenuPress={onMenuPress}
            onNotificationPress={onNotificationPress}
            style={{ paddingHorizontal: 0, marginBottom: 16 }}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="info" size={32} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              No notices published
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,

      fontFamily: FONT_FAMILY,

    },
  urgentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  urgentBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",

      fontFamily: FONT_FAMILY,

    },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  content: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,

      fontFamily: FONT_FAMILY,

    },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 11,

      fontFamily: FONT_FAMILY,

    },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,

      fontFamily: FONT_FAMILY,

    },
});
export default NoticeTabContent;
