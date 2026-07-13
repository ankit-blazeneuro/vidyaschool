import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useThemeColors, useTheme } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { SessionManager } from "../../services/session";
import { DashboardHeader } from "../DashboardHeader";
import { UserProfileData } from "../../types";
import { Input } from "../CustomTextField";
import { PrimaryButton } from "../PrimaryButton";
import { SecondaryButton } from "../SecondaryButton";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../../theme/colors";

interface ProfileTabContentProps {
  onThemeChange: (mode: string) => void;
  onLogout: () => void;
  onMenuPress: () => void;
  onNotificationPress: () => void;
  onScroll?: (event: any) => void;
}

export const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  onThemeChange,
  onLogout,
  onMenuPress,
  onNotificationPress,
  onScroll,
}) => {
  const colors = useThemeColors();
  const { themeMode } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile data state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [provider, setProvider] = useState("");
  const [username, setUsername] = useState("");

  // Editable profile details
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  
  // Non-editable or restricted
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [section, setSection] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const pName = await SessionManager.getName();
      const pEmail = await SessionManager.getEmail();
      const pRole = await SessionManager.getRole();
      const pProvider = await SessionManager.getProvider();
      const pUser = await SessionManager.getUsername();

      setName(pName || "User");
      setEmail(pEmail || "");
      setRole(pRole || "student");
      setProvider(pProvider || "Email");
      setUsername(pUser || "");

      const response = await ApiService.getProfile();
      if (response.ok) {
        const data = await response.json();
        const profile: UserProfileData = data.profile;
        if (profile) {
          setPhoneNumber(profile.phoneNumber || "");
          setAddress(profile.address || "");
          setCity(profile.city || "");
          setState(profile.state || "");
          setPincode(profile.pincode || "");
          setParentName(profile.parentName || "");
          setParentPhone(profile.parentPhone || "");
          setParentEmail(profile.parentEmail || "");
          setAdmissionNumber(profile.admissionNumber || "—");
          setStudentClass(profile.class || "—");
          setSection(profile.section || "—");
          if (profile.username) setUsername(profile.username);
        }
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await ApiService.updateProfile({
        phoneNumber,
        address,
        city,
        state,
        pincode,
        parentName,
        parentPhone,
        parentEmail,
      });

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully.");
        setIsEditing(false);
      } else {
        throw new Error("Unable to save updates.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  const renderDetailRow = (label: string, value: string) => {
    return (
      <View style={[styles.detailRow, { borderBottomColor: colors.outline }]}>
        <Text style={[styles.detailLabel, { color: colors.secondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.onSurface }]}>{value || "—"}</Text>
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
    <ScrollView
      contentContainerStyle={styles.container}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <DashboardHeader
        title="My Profile"
        subtitle="Account settings & preferences"
        onMenuPress={onMenuPress}
        onNotificationPress={onNotificationPress}
        style={{ paddingHorizontal: 0, marginBottom: 16 }}
      />
      {/* 1. Header Info */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.outline }]}>
          <Text style={[styles.avatarText, { color: colors.onSurface }]}>
            {name.substring(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.profileName, { color: colors.onSurface }]}>{name}</Text>
        <Text style={[styles.profileEmail, { color: colors.secondary }]}>{email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.outline }]}>
          <Text style={[styles.roleText, { color: colors.onSurface }]}>{role.toUpperCase()}</Text>
        </View>
      </View>

      {/* 2. Theme Mode Selector */}
      <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Appearance</Text>
        <View style={styles.themeRow}>
          {["system", "light", "dark"].map((mode) => {
            const isSelected = themeMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => onThemeChange(mode)}
                style={[
                  styles.themePill,
                  {
                    backgroundColor: isSelected ? colors.primary : "transparent",
                    borderColor: isSelected ? "transparent" : colors.outline,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themePillText,
                    {
                      color: isSelected ? colors.onPrimary : colors.onSurface,
                      fontWeight: isSelected ? "600" : "400",
                    },
                  ]}
                >
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Detailed Profile Form / Card */}
      <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Profile Details</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
            <Feather name={isEditing ? "x" : "edit-2"} size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <Input
              value={phoneNumber}
              onValueChange={setPhoneNumber}
              placeholder="e.g. 9876543210"
              label="Phone Number"
              keyboardType="phone-pad"
            />
            <Input
              value={address}
              onValueChange={setAddress}
              placeholder="Street details..."
              label="Address"
            />
            <Input
              value={city}
              onValueChange={setCity}
              placeholder="Delhi"
              label="City"
            />
            <Input
              value={state}
              onValueChange={setState}
              placeholder="Delhi"
              label="State"
            />
            <Input
              value={pincode}
              onValueChange={setPincode}
              placeholder="110001"
              label="Pincode"
              keyboardType="numeric"
            />

            <View style={[styles.sectionDivider, { backgroundColor: colors.outline }]} />
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>PARENT CONTACT</Text>

            <Input
              value={parentName}
              onValueChange={setParentName}
              placeholder="Guardian Name"
              label="Parent/Guardian Name"
            />
            <Input
              value={parentPhone}
              onValueChange={setParentPhone}
              placeholder="Guardian Phone"
              label="Parent/Guardian Phone"
              keyboardType="phone-pad"
            />
            <Input
              value={parentEmail}
              onValueChange={setParentEmail}
              placeholder="parent@email.com"
              label="Parent/Guardian Email"
              keyboardType="email-address"
            />

            <PrimaryButton
              text="Save Details"
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
            />
          </View>
        ) : (
          <View style={styles.detailsList}>
            {renderDetailRow("Username", `@${username}`)}
            {renderDetailRow("Admission Number", admissionNumber)}
            {renderDetailRow("Class / Section", `${studentClass} - ${section}`)}
            {renderDetailRow("Phone Number", phoneNumber)}
            {renderDetailRow("Street Address", address)}
            {renderDetailRow("City / State", `${city}, ${state}`)}
            {renderDetailRow("Pincode", pincode)}
            
            <Text style={[styles.sectionTitleText, { color: colors.secondary }]}>Parent/Guardian Contact</Text>
            {renderDetailRow("Name", parentName)}
            {renderDetailRow("Phone", parentPhone)}
            {renderDetailRow("Email", parentEmail)}
          </View>
        )}
      </View>

      {/* 4. Credentials Provider */}
      <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Security</Text>
        <Text style={[styles.providerText, { color: colors.secondary }]}>
          Logged in via: <Text style={{ color: colors.onSurface, fontWeight: "600" }}>{provider}</Text>
        </Text>
      </View>

      {/* 5. Logout Button */}
      <SecondaryButton
        text="Log Out"
        onPress={onLogout}
        style={styles.logoutBtn}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  profileName: {
    fontSize: 20,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  profileEmail: {
    fontSize: 13,
    marginTop: 4,

      fontFamily: FONT_FAMILY,

    },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  roleText: {
    fontSize: 9,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,

      fontFamily: FONT_FAMILY,

    },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  themePillText: {
    fontSize: 11,

      fontFamily: FONT_FAMILY,

    },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  editBtn: {
    padding: 6,
  },
  editForm: {
    width: "100%",
  },
  sectionDivider: {
    height: 1,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.5,

      fontFamily: FONT_FAMILY,

    },
  saveBtn: {
    marginTop: 12,
  },
  detailsList: {
    width: "100%",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12.5,

      fontFamily: FONT_FAMILY,

    },
  detailValue: {
    fontSize: 12.5,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  sectionTitleText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.5,

      fontFamily: FONT_FAMILY,

    },
  providerText: {
    fontSize: 13,

      fontFamily: FONT_FAMILY,

    },
  logoutBtn: {
    marginTop: 8,
    borderColor: "#DC2626", // Red border for danger action
    backgroundColor: "transparent",
  },
});
export default ProfileTabContent;
