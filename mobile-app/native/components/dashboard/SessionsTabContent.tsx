import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { SessionManager } from "../../services/session";
import { DashboardHeader } from "../DashboardHeader";
import { PrimaryButton } from "../PrimaryButton";
import { FONT_FAMILY } from "../../theme/colors";

interface SessionsTabContentProps {
  onMenuPress: () => void;
  onNotificationPress: () => void;
  onScroll?: (event: any) => void;
}

export const SessionsTabContent: React.FC<SessionsTabContentProps> = ({
  onMenuPress,
  onNotificationPress,
  onScroll,
}) => {
  const colors = useThemeColors();
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    SessionManager.getProvider().then((val) => setProvider(val || "Email Login"));
    SessionManager.getEmail().then((val) => setEmail(val || ""));
    SessionManager.getUsername().then((val) => setUsername(val || ""));
  }, []);

  const handleRevoke = () => {
    Alert.alert("Success", "All other sessions revoked successfully!");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <DashboardHeader
        title="Manage Sessions"
        subtitle="Active account session instances"
        onMenuPress={onMenuPress}
        onNotificationPress={onNotificationPress}
        style={{ paddingHorizontal: 0, marginBottom: 16 }}
      />
      <Text style={[styles.desc, { color: colors.secondary }]}>
        Active session instances connected to your school account.
      </Text>

      {/* Current Device Session Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.deviceTitle, { color: colors.onSurface }]}>
            Current Device (Android App)
          </Text>
        </View>
        <View style={styles.details}>
          <Text style={[styles.text, { color: colors.onSurface }]}>
            Provider: {provider}
          </Text>
          <Text style={[styles.text, { color: colors.onSurface }]}>
            User: {email} {username ? `(@${username})` : ""}
          </Text>
        </View>
      </View>

      {/* Mock Session Card 1 */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text style={[styles.mockDeviceTitle, { color: colors.onSurface }]}>
          Chrome / Windows 11
        </Text>
        <View style={styles.details}>
          <Text style={[styles.mockText, { color: colors.secondary }]}>
            Location: New Delhi, India
          </Text>
          <Text style={[styles.mockText, { color: colors.secondary }]}>
            Last active: 2 hours ago
          </Text>
        </View>
      </View>

      {/* Mock Session Card 2 */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text style={[styles.mockDeviceTitle, { color: colors.onSurface }]}>
          Safari / iPhone 15
        </Text>
        <View style={styles.details}>
          <Text style={[styles.mockText, { color: colors.secondary }]}>
            Location: Mumbai, India
          </Text>
          <Text style={[styles.mockText, { color: colors.secondary }]}>
            Last active: 1 day ago
          </Text>
        </View>
      </View>

      <PrimaryButton
        text="Revoke All Other Sessions"
        onPress={handleRevoke}
        style={styles.revokeBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,

      fontFamily: FONT_FAMILY,

    },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceTitle: {
    fontSize: 14,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  mockDeviceTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,

      fontFamily: FONT_FAMILY,

    },
  details: {
    paddingLeft: 16,
  },
  text: {
    fontSize: 13,
    lineHeight: 20,

      fontFamily: FONT_FAMILY,

    },
  mockText: {
    fontSize: 12,
    lineHeight: 18,

      fontFamily: FONT_FAMILY,

    },
  revokeBtn: {
    marginTop: 8,
  },
});
export default SessionsTabContent;
