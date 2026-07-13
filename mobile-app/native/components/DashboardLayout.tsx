import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors, useTheme } from "../theme/ThemeContext";
import { BlurView } from "expo-blur";
import { SessionManager } from "../services/session";
import { ApiService } from "../services/api";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
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
    if (y > 100) {
      if (!headerCollapsed) setHeaderCollapsed(true);
    } else {
      if (headerCollapsed) setHeaderCollapsed(false);
    }
  };

  // Modals visibility
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [complaintVisible, setComplaintVisible] = useState(false);

  // Animated left drawer offset & backdrop opacity
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Drawer slide action
  useEffect(() => {
    if (drawerVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -280,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [drawerVisible, slideAnim, backdropAnim]);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerVisible(false));
  };

  const handleDrawerItemPress = (tabKey: string) => {
    setSelectedTab(tabKey);
    closeDrawer();
  };

  const handleDocSelect = (path: string, fallback: string) => {
    setActiveDocPath(path);
    setActiveDocFallback(fallback);
  };

  const handleNotificationClick = () => {
    setNotificationsVisible(true);
  };

  // Open notification drawer when user taps a push notification from the system tray
  useEffect(() => {
    const unsubscribe = NotificationEvent.onTap(() => {
      setNotificationsVisible(true);
    });
    return unsubscribe;
  }, []);

  const isStudent = role.toLowerCase() === "student";

  // Tab Header render helper
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

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* 1. Top Bar Navigation (when doc viewer is not active and on search tab) */}
      {activeDocPath === null && selectedTab === "search" && (
        <View style={[styles.topBar, { borderBottomColor: colors.outline }]}>
          <TouchableOpacity
            onPress={() => setDrawerVisible(true)}
            style={[styles.circleBtn, { borderColor: colors.outline }]}
          >
            <CustomMenuIcon size={16} color={colors.onSurface} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            {getHeaderTitle()}
          </Text>

          <TouchableOpacity
            onPress={handleNotificationClick}
            style={[styles.circleBtn, { borderColor: colors.outline }]}
          >
            <CustomNotificationIcon size={16} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      )}

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
              () => setDrawerVisible(true),
              handleScroll
            )}
            {selectedTab === "notice" && (
              <NoticeTabContent
                onMenuPress={() => setDrawerVisible(true)}
                onNotificationPress={handleNotificationClick}
              />
            )}
            {selectedTab === "fees" && isStudent && (
              <FeesTabContent
                onMenuPress={() => setDrawerVisible(true)}
                onNotificationPress={handleNotificationClick}
              />
            )}
            {selectedTab === "community" && !isStudent && (
              <CommunityTabContent
                onMenuPress={() => setDrawerVisible(true)}
                onNotificationPress={handleNotificationClick}
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
                onMenuPress={() => setDrawerVisible(true)}
                onNotificationPress={handleNotificationClick}
              />
            )}
            {selectedTab === "sessions" && (
              <SessionsTabContent
                onMenuPress={() => setDrawerVisible(true)}
                onNotificationPress={handleNotificationClick}
              />
            )}
          </>
        )}
      </View>

      {/* Animated Sticky Header (matches Kotlin DashboardStickyHeader) */}
      {activeDocPath === null && selectedTab === "home" && (
        <Animated.View
          style={[
            styles.stickyTopBar,
            {
              borderBottomColor: colors.outline,
              paddingTop: insets.top,
              height: 54 + insets.top,
              opacity: headerAlpha,
              transform: [{ translateY: headerSlide }],
              backgroundColor: colors.background,
            }
          ]}
        >
          <View style={styles.stickyHeaderRow}>
            <TouchableOpacity
              onPress={() => setDrawerVisible(true)}
              style={[
                styles.circleBtn,
                { borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(24, 24, 27, 0.15)" },
              ]}
            >
              <CustomMenuIcon size={16} color={colors.onSurface} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              Dashboard
            </Text>

            <TouchableOpacity
              onPress={handleNotificationClick}
              style={[
                styles.circleBtn,
                { borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(24, 24, 27, 0.15)" },
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
              backgroundColor: Platform.OS === "android" ? (isDark ? "rgba(9,9,11,0.92)" : "rgba(255,255,255,0.92)") : "transparent",
              paddingBottom: Platform.OS === "ios" ? insets.bottom : (insets.bottom > 0 ? insets.bottom : 8),
              height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
            }
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

      {/* 4. Left Animated Side Drawer Modal */}
      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.drawerOverlay}>
          {/* Animated Backdrop Overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "rgba(0,0,0,0.4)",
                opacity: backdropAnim,
              },
            ]}
          />
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeDrawer}
            style={styles.drawerDismiss}
          />
          <Animated.View
            style={[
              styles.drawerContent,
              {
                backgroundColor: colors.surface,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* Profile card in drawer */}
              <View style={styles.drawerHeader}>
                <View style={[styles.drawerAvatarCircle, { backgroundColor: colors.outline }]}>
                  <Text style={[styles.drawerAvatarText, { color: colors.onSurface }]}>
                    {name.substring(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.drawerHeaderText}>
                  <Text style={[styles.drawerName, { color: colors.onSurface }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[styles.drawerEmail, { color: colors.secondary }]} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

              <View style={[styles.drawerDivider, { backgroundColor: colors.outline }]} />

              {/* Drawer Menu Items */}
              <View style={styles.drawerMenu}>
                <TouchableOpacity
                  onPress={() => {
                    closeDrawer();
                    setComplaintVisible(true);
                  }}
                  style={styles.drawerItem}
                >
                  <Feather name="edit-2" size={16} color={colors.onSurface} style={styles.drawerItemIcon} />
                  <Text style={[styles.drawerItemText, { color: colors.onSurface }]}>
                    File a Complaint
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDrawerItemPress("sessions")}
                  style={[
                    styles.drawerItem,
                    selectedTab === "sessions" && { backgroundColor: colors.outline },
                  ]}
                >
                  <Feather name="shield" size={16} color={colors.onSurface} style={styles.drawerItemIcon} />
                  <Text style={[styles.drawerItemText, { color: colors.onSurface }]}>
                    Manage Sessions
                  </Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                  onPress={() => {
                    closeDrawer();
                    onLogout();
                  }}
                  style={[styles.drawerItem, styles.logoutItem]}
                >
                  <Feather name="log-out" size={16} color="#DC2626" style={styles.drawerItemIcon} />
                  <Text style={[styles.drawerItemText, { color: "#DC2626", fontWeight: "600" }]}>
                    Log Out
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      {/* 5. Standing Modals */}
      <NotificationDrawer
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />

      <ComplaintDialog
        visible={complaintVisible}
        onClose={() => setComplaintVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  stickyTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
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
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawerDismiss: {
    flex: 1,
  },
  drawerContent: {
    width: 280,
    height: "100%",
    position: "absolute",
    left: 0,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
    paddingHorizontal: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  drawerAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  drawerAvatarText: {
    fontSize: 20,
    fontWeight: "700",
  },
  drawerHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  drawerName: {
    fontSize: 15,
    fontWeight: "700",
  },
  drawerEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  drawerDivider: {
    height: 1,
    width: "100%",
    marginVertical: 12,
  },
  drawerMenu: {
    flex: 1,
    paddingTop: 16,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  drawerItemIcon: {
    marginRight: 12,
  },
  drawerItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  logoutItem: {
    marginBottom: Platform.OS === "ios" ? 24 : 20,
  },
});
export default DashboardLayout;
