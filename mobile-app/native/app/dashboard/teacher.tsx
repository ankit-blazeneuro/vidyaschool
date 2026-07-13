import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { SessionManager } from "../../services/session";
import { DashboardLayout } from "../../components/DashboardLayout";
import { ImageSlider } from "../../components/ImageSlider";
import { SliderSkeleton } from "../../components/SliderSkeleton";
import { DashboardHeader } from "../../components/DashboardHeader";
import { SliderImage } from "../../types";
import { FONT_FAMILY } from "../../theme/colors";

export default function TeacherScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  // Basic session details
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [isLoadingSlider, setIsLoadingSlider] = useState(true);

  const initSession = async () => {
    const prov = await SessionManager.getProvider();
    const mail = await SessionManager.getEmail();
    const nm = await SessionManager.getName();
    const avatar = await SessionManager.getAvatarUrl();

    setProvider(prov || "");
    setEmail(mail || "");
    setName(nm || "");
    setAvatarUrl(avatar);
  };

  const loadSliderImages = async () => {
    setIsLoadingSlider(true);
    try {
      const response = await ApiService.getSliderImages("teacher");
      if (response.ok) {
        const data = await response.json();
        setSliderImages(data || []);
      }
    } catch (e) {
      console.error("Failed to load slider images", e);
    } finally {
      setIsLoadingSlider(false);
    }
  };

  useEffect(() => {
    initSession();
    loadSliderImages();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await initSession();
    await loadSliderImages();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await SessionManager.clearSession();
    router.replace("/");
  };

  const enabledImages = sliderImages.filter((img) => img.enabled);

  return (
    <DashboardLayout
      role="teacher"
      provider={provider}
      email={email}
      name={name}
      avatarUrl={avatarUrl}
      onThemeChange={async (mode) => {
        await SessionManager.setThemeMode(mode);
        Alert.alert("Success", "Theme setting saved. Please restart app to apply theme change.");
      }}
      onLogout={handleLogout}
      homeContent={(onNotificationPress, onMenuPress, onScroll) => {
        return (
          <ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            contentContainerStyle={styles.scrollContent}
          >
            {/* Welcome Greeting */}
            <DashboardHeader
              title="Dashboard"
              subtitle={`Welcome, ${name.split(" ")[0] || "Teacher"}`}
              onMenuPress={onMenuPress}
              onNotificationPress={onNotificationPress}
              style={{ paddingHorizontal: 0, marginBottom: 16 }}
            />

            {/* Slider images */}
            {isLoadingSlider ? (
              <SliderSkeleton style={styles.slider} />
            ) : enabledImages.length > 0 ? (
              <ImageSlider images={enabledImages} style={styles.slider} />
            ) : null}

            {/* Today's Schedule Card */}
            <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Today's Schedule</Text>
              
              <View style={styles.scheduleList}>
                {[
                  { time: "09:00 AM", title: "Grade 10 Math", room: "Room 102" },
                  { time: "11:00 AM", title: "Grade 12 Calculus", room: "Room 204" },
                  { time: "02:00 PM", title: "Staff Meeting", room: "Conference Hall" },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.scheduleItem,
                      { borderLeftColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.itemTime, { color: colors.secondary }]}>{item.time}</Text>
                    <Text style={[styles.itemTitle, { color: colors.onSurface }]}>{item.title}</Text>
                    <Text style={[styles.itemRoom, { color: colors.secondary }]}>{item.room}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  welcomeRow: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  greetingSub: {
    fontSize: 12,
    marginTop: 4,

      fontFamily: FONT_FAMILY,

    },
  slider: {
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,

      fontFamily: FONT_FAMILY,

    },
  scheduleList: {
    width: "100%",
  },
  scheduleItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 16,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginVertical: 2,

      fontFamily: FONT_FAMILY,

    },
  itemRoom: {
    fontSize: 12,

      fontFamily: FONT_FAMILY,

    },
});
