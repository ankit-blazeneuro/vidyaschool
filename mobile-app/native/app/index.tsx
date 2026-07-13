import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { BottomDrawer } from "../components/BottomDrawer";
import { PrimaryButton } from "../components/PrimaryButton";
import { SessionManager } from "../services/session";
import { useTheme } from "../theme/ThemeContext";
import { GlobeBackdrop } from "../components/GlobeBackdrop";
import { FONT_FAMILY } from "../theme/colors";

export default function Welcome() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await SessionManager.isLoggedIn();
        if (loggedIn) {
          const role = await SessionManager.getRole();
          if (role) {
            let destRole = role.toLowerCase();
            if (destRole === "account") {
              destRole = "accounts";
            }
            router.replace(`/dashboard/${destRole}`);
            return;
          }
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  if (checkingAuth) {
    return (
      <View style={[styles.container, { backgroundColor: "#000000", justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      
      {/* Background SVG outlines */}
      <GlobeBackdrop width={350} height={347} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={2.0} style={styles.bgTopLeft} />
      <GlobeBackdrop width={220} height={218} stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={2.0} style={styles.bgBottomRight} anticlockwise={true} />

      <View style={styles.headerSection}>
        <Text style={styles.appName}>Vidya School</Text>
      </View>

      <BottomDrawer style={styles.drawer}>
        <PrimaryButton
          text="Login"
          onPress={() => router.push("/login")}
          style={styles.loginButton}
        />

        <TouchableOpacity 
          style={[styles.signupButton, { borderColor: isDark ? "#3f3f46" : "#E4E4E7" }]}
          onPress={() => router.push("/signup")}
          activeOpacity={0.8}
        >
          <Text style={[styles.signupButtonText, { color: isDark ? "#FFFFFF" : "#18181B" }]}>Create Account</Text>
        </TouchableOpacity>

        <Text style={[styles.termsText, { color: isDark ? "#a1a1aa" : "#71717A" }]}>
          By continuing, you agree to our{" "}
          <Text style={[styles.link, { color: isDark ? "#FFFFFF" : "#18181B" }]}>Terms & Conditions</Text> and{" "}
          <Text style={[styles.link, { color: isDark ? "#FFFFFF" : "#18181B" }]}>Privacy Policy</Text>.
        </Text>
      </BottomDrawer>
    </View>
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
  loginButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  signupButton: {
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  signupButtonText: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  termsText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY,
    color: "#71717A",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "500",
    color: "#A1A1AA",
    fontFamily: FONT_FAMILY,
  },
});
