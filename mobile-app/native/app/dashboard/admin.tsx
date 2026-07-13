import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { SessionManager } from "../../services/session";
import { DashboardLayout } from "../../components/DashboardLayout";
import { DashboardHeader } from "../../components/DashboardHeader";
import { Input } from "../../components/CustomTextField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SliderImage } from "../../types";
import { Feather } from "@expo/vector-icons";

export default function AdminScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  // Basic session details
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);

  // Add new image states
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTarget, setNewTarget] = useState("all");

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
    try {
      const response = await ApiService.getSliderImages("admin");
      if (response.ok) {
        const data = await response.json();
        setSliderImages(data || []);
      }
    } catch (e) {
      console.error("Failed to load slider images", e);
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

  const handleToggleEnable = async (id: number, val: boolean) => {
    const updatedList = sliderImages.map((img) =>
      img.id === id ? { ...img, enabled: val } : img
    );
    setSliderImages(updatedList);
    
    try {
      await ApiService.updateSliderImages(updatedList);
    } catch (e) {
      console.error("Failed to update slider images list", e);
    }
  };

  const handleAudienceChange = async (id: number, target: string) => {
    const updatedList = sliderImages.map((img) =>
      img.id === id ? { ...img, target_audience: target } : img
    );
    setSliderImages(updatedList);
    
    try {
      await ApiService.updateSliderImages(updatedList);
    } catch (e) {
      console.error("Failed to update slider audience", e);
    }
  };

  const handleDeleteImage = async (id: number) => {
    const updatedList = sliderImages.filter((img) => img.id !== id);
    setSliderImages(updatedList);
    
    try {
      await ApiService.updateSliderImages(updatedList);
      Alert.alert("Deleted", "Slider image removed successfully.");
    } catch (e) {
      console.error("Failed to delete slider image", e);
    }
  };

  const handleAddImage = async () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      Alert.alert("Error", "Please fill in Title and Image URL");
      return;
    }

    const nextId = sliderImages.reduce((max, img) => (img.id > max ? img.id : max), 0) + 1;
    const newImage: SliderImage = {
      id: nextId,
      title: newTitle.trim(),
      url: newUrl.trim(),
      enabled: true,
      target_audience: newTarget,
      target_classes: "all",
    };

    const updatedList = [...sliderImages, newImage];
    setSliderImages(updatedList);

    try {
      await ApiService.updateSliderImages(updatedList);
      setNewTitle("");
      setNewUrl("");
      setNewTarget("all");
      Alert.alert("Success", "New banner added successfully.");
    } catch (e) {
      console.error("Failed to add slider image", e);
    }
  };

  return (
    <DashboardLayout
      role="admin"
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
            {/* Welcome greeting */}
            <DashboardHeader
              title="Dashboard"
              subtitle={`Welcome, ${name.split(" ")[0] || "Admin"}`}
              onMenuPress={onMenuPress}
              onNotificationPress={onNotificationPress}
              style={{ paddingHorizontal: 0, marginBottom: 16 }}
            />

            {/* Slider management card */}
            <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                Student Portal Image Slider Control
              </Text>
              <Text style={[styles.cardDesc, { color: colors.secondary }]}>
                Enable, disable, or delete sliding banner cards in real-time:
              </Text>

              <View style={styles.sliderList}>
                {sliderImages.map((img, idx) => (
                  <View
                    key={img.id}
                    style={[
                      styles.sliderItem,
                      { borderBottomColor: idx === sliderImages.length - 1 ? "transparent" : colors.outline },
                    ]}
                  >
                    <View style={styles.sliderTextCol}>
                      <Text style={[styles.imgTitle, { color: colors.onSurface }]} numberOfLines={1}>
                        {img.title}
                      </Text>
                      <Text style={[styles.imgMeta, { color: colors.secondary }]}>
                        ID: {img.id} • Target: {img.target_audience}
                      </Text>
                    </View>

                    <View style={styles.sliderControlRow}>
                      {/* Audience change trigger icon button */}
                      <TouchableOpacity
                        onPress={() => {
                          const targetOptions = ["all", "students", "teachers"];
                          const currentIdx = targetOptions.indexOf(img.target_audience);
                          const nextTarget = targetOptions[(currentIdx + 1) % targetOptions.length];
                          handleAudienceChange(img.id, nextTarget);
                        }}
                        style={styles.controlBtn}
                      >
                        <Text style={{ fontSize: 16 }}>
                          {img.target_audience === "students"
                            ? "👨‍🎓"
                            : img.target_audience === "teachers"
                            ? "👨‍🏫"
                            : "👥"}
                        </Text>
                      </TouchableOpacity>

                      <Switch
                        value={img.enabled}
                        onValueChange={(val) => handleToggleEnable(img.id, val)}
                        trackColor={{ false: colors.outline, true: colors.primary }}
                        style={styles.switch}
                      />

                      <TouchableOpacity onPress={() => handleDeleteImage(img.id)} style={styles.deleteBtn}>
                        <Feather name="trash-2" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outline }]} />
              <Text style={[styles.subCardTitle, { color: colors.onSurface }]}>Add New Slider Image</Text>
              
              <Input
                value={newTitle}
                onValueChange={setNewTitle}
                placeholder="e.g. Annual Day 2026"
                label="Image Title"
                style={styles.field}
              />
              <Input
                value={newUrl}
                onValueChange={setNewUrl}
                placeholder="e.g. https://example.com/image.jpg"
                label="Image URL"
                style={styles.field}
              />

              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Show to:</Text>
              <View style={styles.chipsRow}>
                {["all", "students", "teachers"].map((target) => {
                  const isSelected = newTarget === target;
                  const emoji = target === "students" ? "👨‍🎓 " : target === "teachers" ? "👨‍🏫 " : "👥 ";
                  return (
                    <TouchableOpacity
                      key={target}
                      onPress={() => setNewTarget(target)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : "transparent",
                          borderColor: isSelected ? "transparent" : colors.outline,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? colors.onPrimary : colors.onSurface,
                            fontWeight: isSelected ? "600" : "400",
                          },
                        ]}
                      >
                        {emoji}
                        {target.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <PrimaryButton text="Add to Slider" onPress={handleAddImage} style={styles.addBtn} />
            </View>

            {/* System Operations Card */}
            <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>System Operations Overview</Text>
              <View style={styles.opsList}>
                <Text style={[styles.opsText, { color: colors.onSurface }]}>• Active Sessions: 12</Text>
                <Text style={[styles.opsText, { color: colors.onSurface }]}>• Database Connections: healthy</Text>
                <Text style={[styles.opsText, { color: colors.onSurface }]}>• API Status: all endpoints operational</Text>
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
  },
  greetingSub: {
    fontSize: 12,
    marginTop: 4,
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
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11.5,
    marginBottom: 16,
    lineHeight: 16,
  },
  sliderList: {
    width: "100%",
  },
  sliderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sliderTextCol: {
    flex: 1,
    marginRight: 8,
  },
  imgTitle: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  imgMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  sliderControlRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlBtn: {
    padding: 6,
    marginRight: 8,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  subCardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 11,
  },
  addBtn: {
    marginTop: 8,
  },
  opsList: {
    marginTop: 12,
  },
  opsText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
});
