import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { FONT_FAMILY } from "../theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.52;

interface MenuItem {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}

interface AppMenuProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  email: string;
  role: string;
  items: MenuItem[];
}

export const AppMenu: React.FC<AppMenuProps> = ({
  visible,
  onClose,
  name,
  email,
  role,
  items,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // B&W contrast theme logic for dark/light mode
  const sheetBg = isDark ? "#09090B" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#0a0a0a";
  const subtextColor = isDark ? "#a1a1aa" : "#71717a";
  const itemBg = isDark ? "#18181B" : "#fafafa";
  const itemBorder = isDark ? "#27272A" : "#f4f4f5";
  const iconWrapBg = isDark ? "#27272A" : "#f4f4f5";
  const dividerBg = isDark ? "#27272A" : "#e4e4e7";
  const avatarBg = isDark ? "#ffffff" : "#0a0a0a";
  const avatarTextColor = isDark ? "#0a0a0a" : "#ffffff";
  const pillBg = isDark ? "#18181B" : "#f4f4f5";
  const pillBorder = isDark ? "#27272A" : "#e4e4e7";
  const pillText = isDark ? "#e4e4e7" : "#3f3f46";
  const handleBg = isDark ? "#3f3f46" : "#d4d4d8";

  useEffect(() => {
    if (visible) {
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
      slideAnim.setValue(SHEET_HEIGHT);
      backdropAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = (callback?: () => void) => {
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
      if (callback) {
        callback();
      }
    });
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => handleClose()}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <BlurView intensity={18} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <TouchableOpacity
        style={styles.dismissArea}
        activeOpacity={1}
        onPress={() => handleClose()}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: sheetBg,
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Pill handle */}
        <View style={[styles.handle, { backgroundColor: handleBg }]} />

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={[styles.avatarText, { color: avatarTextColor }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textColor }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.profileEmail, { color: subtextColor }]} numberOfLines={1}>
              {email}
            </Text>
            <View style={[styles.rolePill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
              <Text style={[styles.roleText, { color: pillText }]}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: dividerBg }]} />

        {/* Menu items */}
        <View style={styles.menuList}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { backgroundColor: itemBg, borderColor: itemBorder },
                item.danger && styles.menuItemDanger,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                handleClose(item.onPress);
              }}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  { backgroundColor: iconWrapBg },
                  item.danger && styles.menuIconWrapDanger,
                ]}
              >
                <Feather
                  name={item.icon as any}
                  size={16}
                  color={item.danger ? "#EF4444" : textColor}
                />
              </View>
              <View style={styles.menuTextWrap}>
                <Text
                  style={[
                    styles.menuLabel,
                    { color: textColor },
                    item.danger && { color: "#EF4444" },
                  ]}
                >
                  {item.label}
                </Text>
                {item.sublabel ? (
                  <Text style={[styles.menuSublabel, { color: subtextColor }]}>{item.sublabel}</Text>
                ) : null}
              </View>
              {!item.danger && (
                <Feather name="chevron-right" size={14} color={subtextColor} />
              )}
            </TouchableOpacity>
          ))}
        </View>
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
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  rolePill: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  menuItemDanger: {
    backgroundColor: "#fff5f5",
    borderColor: "#fee2e2",
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconWrapDanger: {
    backgroundColor: "#fee2e2",
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FONT_FAMILY,
  },
  menuSublabel: {
    fontSize: 11,
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
});

export default AppMenu;
