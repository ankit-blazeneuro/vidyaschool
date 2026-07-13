import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeColors } from "../theme/ThemeContext";
import { Feather } from "@expo/vector-icons";

interface SearchResultRowProps {
  title: string;
  subtitle: string;
  iconName: string;
  category: string;
  onPress: () => void;
  style?: any;
}

export const SearchResultRow: React.FC<SearchResultRowProps> = ({
  title,
  subtitle,
  iconName,
  category,
  onPress,
  style,
}) => {
  const colors = useThemeColors();

  // Helper to map feather icons from input names
  const getIconName = (name: string): any => {
    switch (name.toLowerCase()) {
      case "home":
        return "home";
      case "info":
        return "info";
      case "share":
        return "share-2";
      case "person":
        return "user";
      case "search":
        return "search";
      default:
        return "file-text";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          borderColor: colors.outline,
          backgroundColor: colors.surface,
        },
        style,
      ]}
    >
      <View style={styles.leftContainer}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.outline },
          ]}
        >
          <Feather name={getIconName(iconName)} size={16} color={colors.onSurface} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      
      <View style={styles.rightContainer}>
        <View
          style={[
            styles.badge,
            {
              borderColor: colors.outline,
              backgroundColor: colors.outline,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: colors.onSurface }]}>
            {category.toUpperCase()}
          </Text>
        </View>
        <Feather name="arrow-right" size={14} color={colors.secondary} style={styles.arrow} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: "700",
  },
  arrow: {
    marginLeft: 6,
  },
});
export default SearchResultRow;
export const SearchResultRowView = SearchResultRow;
