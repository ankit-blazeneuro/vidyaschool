import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { useThemeColors, useTheme } from "../theme/ThemeContext";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationEvent from "../services/notificationEvent";
import {
  CustomHomeIcon,
  CustomNoticeIcon,
  CustomPayFeesIcon,
  CustomCommunityIcon,
  CustomSearchIcon,
  CustomProfileIcon,
  CustomMenuIcon,
  CustomNotificationIcon,
} from "./icons/CustomIcons";

// Subcomponents
import { NoticeTabContent } from "./dashboard/NoticeTabContent";
import { CommunityTabContent } from "./dashboard/CommunityTabContent";
import { FeesTabContent } from "./dashboard/FeesTabContent";
import { SearchTabContent } from "./dashboard/SearchTabContent";
import { ProfileTabContent } from "./dashboard/ProfileTabContent";
import { SessionsTabContent } from "./dashboard/SessionsTabContent";
import { DocViewerScreen } from "./dashboard/DocViewerScreen";
import { NotificationDrawer } from "./dashboard/NotificationDrawer";
import { ComplaintDialog } from "./dashboard/ComplaintDialog";
import { AppMenu } from "./AppMenu";
import { FONT_FAMILY } from "../theme/colors";

interface DashboardLayoutProps {
  role: string;
  provider: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  themeMode?: string;
  onThemeChange: (mode: string) => void;
  onLogout: () => void;
  onShowLibrary?: (() => void) | null;
  homeContent: (
    onNotificationClick: () => void,
    onMenuClick: () => void,
    onScroll: (event: any) => void
  ) => React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  provider,
  email,
  name,
  avatarUrl,
  themeMode = "system",
  onThemeChange,
  onLogout,
  onShowLibrary = null,
  homeContent,
}) => {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedTab, setSelectedTab] = useState("home");
  const [activeDocPath, setActiveDocPath] = useState<string | null>(null);
  const [activeDocFallback, setActiveDocFallback] = useState<string | null>(null);

  // Sticky Header animation states & refs matching Kotlin tween(220)
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const headerAlpha = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAlpha, {
        toValue: headerCollapsed ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: headerCollapsed ? 0 : -24,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerCollapsed]);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const shouldCollapse = y > 60;
    if (shouldCollapse && !headerCollapsed) setHeaderCollapsed(true);
    if (!shouldCollapse && headerCollapsed) setHeaderCollapsed(false);
  };

  // Modals visibility
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [complaintVisible, setComplaintVisible] = useState(false);

  const handleDocSelect = (path: string, fallback: string) => {
    setActiveDocPath(path);
    setActiveDocFallback(fallback);
  };

  const getHeaderTitle = () => {
    switch (selectedTab) {
      case "home":
        return "Dashboard";
      case "notice":
        return "Notices";
      case "fees":
        return "School Fees";
      case "community":
        return "Community Chat";
      case "search":
        return "Directory & Docs";
      case "profile":
        return "Settings";
      case "sessions":
        return "Active Sessions";
      default:
        return "Vidya School";
    }
  };

  const handleNotificationClick = () => {
    setNotificationsVisible(true);
  };

  const handleMenuClick = () => {
    setMenuVisible(true);
  };

  // Open notification drawer when user taps a push notification from the system tray
  useEffect(() => {
    const unsubscribe = NotificationEvent.onTap(() => {
      setNotificationsVisible(true);
    });
    return unsubscribe;
  }, []);

  const isStudent = role.toLowerCase() === "student";

  // Menu items for AppMenu
  const menuItems = [
    {
      icon: "edit-2",
      label: "File a Complaint",
      sublabel: "Submit a formal school complaint",
      onPress: () => setComplaintVisible(true),
    },
    {
      icon: "shield",
      label: "Manage Sessions",
      sublabel: "View & revoke active sessions",
      onPress: () => setSelectedTab("sessions"),
    },
    {
      icon: "log-out",
      label: "Log Out",
      sublabel: "Sign out of your account",
      onPress: onLogout,
      danger: true,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />



      {/* 2. Main Tab Body */}
      <View style={styles.body}>
        {activeDocPath !== null ? (
          <DocViewerScreen
            path={activeDocPath}
            fallbackContent={activeDocFallback}
            onBack={() => {
              setActiveDocPath(null);
              setActiveDocFallback(null);
            }}
          />
        ) : (
          <>
            {selectedTab === "home" && homeContent(
              handleNotificationClick,
              handleMenuClick,
              handleScroll
            )}
            {selectedTab === "notice" && (
              <NoticeTabContent
                onMenuPress={handleMenuClick}
                onNotificationPress={handleNotificationClick}
                onScroll={handleScroll}
              />
            )}
            {selectedTab === "fees" && isStudent && (
              <FeesTabContent
                onMenuPress={handleMenuClick}
                onNotificationPress={handleNotificationClick}
                onScroll={handleScroll}
              />
            )}
            {selectedTab === "community" && !isStudent && (
              <CommunityTabContent
                onMenuPress={handleMenuClick}
                onNotificationPress={handleNotificationClick}
                onScroll={handleScroll}
              />
            )}
            {selectedTab === "search" && (
              <SearchTabContent
                onTabSelect={setSelectedTab}
                onDocSelect={handleDocSelect}
                onShowLibrary={onShowLibrary || undefined}
              />
            )}
            {selectedTab === "profile" && (
              <ProfileTabContent
                onThemeChange={onThemeChange}
                onLogout={onLogout}
                onMenuPress={handleMenuClick}
                onNotificationPress={handleNotificationClick}
                onScroll={handleScroll}
              />
            )}
            {selectedTab === "sessions" && (
              <SessionsTabContent
                onMenuPress={handleMenuClick}
                onNotificationPress={handleNotificationClick}
                onScroll={handleScroll}
              />
            )}
          </>
        )}
      </View>

      {/* Animated Sticky Floating Header */}
      {activeDocPath === null && selectedTab !== "search" && (
        <Animated.View
          pointerEvents={headerCollapsed ? "auto" : "none"}
          style={[
            styles.stickyTopBar,
            {
              borderBottomColor: colors.outline,
              paddingTop: insets.top,
              height: 54 + insets.top,
              opacity: headerAlpha,
              transform: [{ translateY: headerSlide }],
              backgroundColor: isDark
                ? "rgba(9,9,11,0.95)"
                : "rgba(255,255,255,0.95)",
            },
          ]}
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 80 : 90}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.stickyHeaderRow}>
            <TouchableOpacity
              onPress={handleMenuClick}
              style={[
                styles.circleBtn,
                {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(24,24,27,0.15)",
                },
              ]}
            >
              <CustomMenuIcon size={16} color={colors.onSurface} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              {getHeaderTitle()}
            </Text>

            <TouchableOpacity
              onPress={handleNotificationClick}
              style={[
                styles.circleBtn,
                {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(24,24,27,0.15)",
                },
              ]}
            >
              <CustomNotificationIcon size={16} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* 3. Bottom Navigation Bar */}
      {activeDocPath === null && (
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 95}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.tabBar,
            {
              borderTopColor: colors.outline,
              backgroundColor:
                Platform.OS === "android"
                  ? isDark
                    ? "rgba(9,9,11,0.92)"
                    : "rgba(255,255,255,0.92)"
                  : "transparent",
              paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === "ios" ? 12 : 8),
              height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setSelectedTab("home")}
            style={styles.tabItem}
          >
            <CustomHomeIcon
              size={20}
              color={selectedTab === "home" ? colors.primary : colors.secondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === "home" ? colors.primary : colors.secondary },
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab("notice")}
            style={styles.tabItem}
          >
            <CustomNoticeIcon
              size={20}
              color={selectedTab === "notice" ? colors.primary : colors.secondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === "notice" ? colors.primary : colors.secondary },
              ]}
            >
              Notice
            </Text>
          </TouchableOpacity>

          {isStudent ? (
            <TouchableOpacity
              onPress={() => setSelectedTab("fees")}
              style={styles.tabItem}
            >
              <CustomPayFeesIcon
                size={20}
                color={selectedTab === "fees" ? colors.primary : colors.secondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === "fees" ? colors.primary : colors.secondary },
                ]}
              >
                Pay Fees
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setSelectedTab("community")}
              style={styles.tabItem}
            >
              <CustomCommunityIcon
                size={20}
                color={selectedTab === "community" ? colors.primary : colors.secondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === "community" ? colors.primary : colors.secondary },
                ]}
              >
                Chat
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setSelectedTab("search")}
            style={styles.tabItem}
          >
            <CustomSearchIcon
              size={20}
              color={selectedTab === "search" ? colors.primary : colors.secondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === "search" ? colors.primary : colors.secondary },
              ]}
            >
              Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab("profile")}
            style={styles.tabItem}
          >
            <CustomProfileIcon
              size={20}
              color={selectedTab === "profile" ? colors.primary : colors.secondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === "profile" ? colors.primary : colors.secondary },
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </BlurView>
      )}

      {/* 4. AppMenu bottom sheet */}
      <AppMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        name={name}
        email={email}
        role={role}
        items={menuItems}
      />

      {/* 5. Standing Modals */}
      <NotificationDrawer
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />

      <ComplaintDialog
        visible={complaintVisible}
        onClose={() => setComplaintVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  stickyTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    flex: 1,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 12 : 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
    fontFamily: FONT_FAMILY,
  },
});
export default DashboardLayout;
