import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { BottomDrawer } from "../components/BottomDrawer";
import { CustomTextField } from "../components/CustomTextField";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { GlobeBackdrop } from "../components/GlobeBackdrop";
import { AntDesign } from "@expo/vector-icons";
import { ApiService } from "../services/api";
import { SessionManager } from "../services/session";
import { FONT_FAMILY } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeContext";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.login({ email, password });
      const data = await response.json();

      if (response.ok) {
        const token = data.session?.token || data.token;
        const user = data.user;

        if (!user) {
          Alert.alert("Error", data.message || "User data not found in response.");
          setIsLoading(false);
          return;
        }

        // Fetch complete user details to get role and student class
        let role = user.role || "student";
        let studentClass: string | null = null;
        let name = user.name;
        let avatarUrl = user.image;

        try {
          const roleResponse = await ApiService.getUserRole(user.email);
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            role = roleData.role || role;
            name = roleData.name || name;
            avatarUrl = roleData.image || avatarUrl;
            studentClass = roleData.student_class;
          }
        } catch (roleError) {
          console.error("Failed to fetch user role:", roleError);
        }

        await SessionManager.saveSession(
          "email",
          user.email,
          name,
          role,
          avatarUrl,
          token,
          studentClass,
          null
        );

        let destRole = role.toLowerCase();
        if (destRole === "account") {
          destRole = "accounts";
        }
        router.replace(`/dashboard/${destRole}`);
      } else {
        const errMsg = data.error?.message || data.message || "Invalid credentials.";
        Alert.alert("Login Failed", errMsg);
      }
    } catch (e: any) {
      console.error("Login catch error:", e);
      Alert.alert("Network Error", e.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert("Social Auth", `${provider} login is not configured on this device yet.`);
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
          <Text style={styles.title}>Welcome back</Text>

          <CustomTextField
            value={email}
            onValueChange={setEmail}
            placeholder="e.g. you@school.edu"
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomTextField
            value={password}
            onValueChange={setPassword}
            placeholder="Enter your password"
            label="Password"
            isPassword={true}
          />

          <PrimaryButton
            text="Sign In"
            onPress={handleLogin}
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
            onPress={() => router.push("/signup")}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.underline}>Create Account</Text>
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
    fontFamily: FONT_FAMILY,
    fontWeight: "600",
    letterSpacing: 0.5,
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
  signupLink: {
    alignItems: "center",
    marginTop: 10,
  },
  signupText: {
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
