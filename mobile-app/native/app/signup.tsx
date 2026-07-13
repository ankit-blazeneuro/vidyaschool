import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { BottomDrawer } from "../components/BottomDrawer";
import { CustomTextField } from "../components/CustomTextField";
import { Select, SelectOption } from "../components/Select";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { GlobeBackdrop } from "../components/GlobeBackdrop";
import { ApiService } from "../services/api";
import { FONT_FAMILY } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeContext";
import { AntDesign } from "@expo/vector-icons";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "accounts", label: "Accounts" },
  { value: "admin", label: "Admin" },
];

export default function SignupScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.signup({
        name,
        email,
        password,
        role,
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Account created! Please log in.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);
      } else {
        console.error("Signup response error:", data);
        const errMsg = data.error?.message || data.message || "Unable to create account.";
        Alert.alert("Signup Failed", errMsg);
      }
    } catch (e: any) {
      console.error("Signup catch error:", e);
      Alert.alert("Network Error", e.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert("Social Auth", `${provider} registration is not configured on this device yet.`);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
        
        {/* Background SVG outlines */}
        <GlobeBackdrop width={350} height={347} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={2.0} style={styles.bgTopLeft} />
        <GlobeBackdrop width={220} height={218} stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={2.0} style={styles.bgBottomRight} anticlockwise={true} />

        <View style={styles.headerSection}>
          <Text style={styles.appName}>Vidya School</Text>
        </View>

        <BottomDrawer style={styles.drawer}>
          <Text style={styles.title}>Create account</Text>

          <CustomTextField
            value={name}
            onValueChange={setName}
            placeholder="e.g. Ravi Kumar"
            label="Full Name"
            autoCapitalize="words"
          />

          <CustomTextField
            value={email}
            onValueChange={setEmail}
            placeholder="e.g. you@school.edu"
            label="Email"
            keyboardType="email-address"
          />

          <CustomTextField
            value={password}
            onValueChange={setPassword}
            placeholder="Min. 8 characters"
            label="Password"
            isPassword={true}
          />

          <CustomTextField
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            placeholder="Re-enter your password"
            label="Confirm Password"
            isPassword={true}
          />

          <Select
            selectedValue={role}
            onValueChange={setRole}
            options={ROLE_OPTIONS}
            label="Preferred Role"
            placeholder="Select role"
          />

          <PrimaryButton
            text="Create Account"
            onPress={handleSignup}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
            <Text style={[styles.dividerText, { color: colors.secondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
          </View>

          <SecondaryButton
            text="Continue with Google"
            onPress={() => handleSocialLogin("Google")}
            style={styles.socialButton}
            icon={<AntDesign name="google" size={18} color={colors.onSurface} />}
          />

          <SecondaryButton
            text="Continue with GitHub"
            onPress={() => handleSocialLogin("GitHub")}
            style={styles.socialButton}
            icon={<AntDesign name="github" size={18} color={colors.onSurface} />}
          />

          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.underline}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </BottomDrawer>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  bgTopLeft: {
    position: "absolute",
    top: -60,
    left: -60,
  },
  bgBottomRight: {
    position: "absolute",
    bottom: 270,
    right: -30,
  },
  headerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 280,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
    fontFamily: FONT_FAMILY,
  },
  drawer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#18181B",
    fontFamily: FONT_FAMILY,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    marginHorizontal: 12,
    fontFamily: FONT_FAMILY,
  },
  socialButton: {
    marginBottom: 10,
  },
  loginLink: {
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    fontSize: 12,
    color: "#71717A",
    fontFamily: FONT_FAMILY,
  },
  underline: {
    textDecorationLine: "underline",
    fontWeight: "500",
    fontFamily: FONT_FAMILY,
  },
});
