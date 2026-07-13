import { View, Text, TextInput, Pressable, StyleSheet, useColorScheme, Alert, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { useState } from "react";

const API_URL = "https://vidyaschool.vercel.app";

export default function Login() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Login successful!");
        // Navigate to home or dashboard
      } else {
        Alert.alert("Error", data.message || "Login failed");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#09090b" : "#fafafa" }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? "#ffffff" : "#18181b" }]}>
          Vidya School
        </Text>
      </View>
      
      <View style={[styles.drawer, { 
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        borderTopColor: isDark ? "#27272a" : "#e4e4e7"
      }]}>
        <View style={styles.handle} />
        
        <Text style={[styles.heading, { color: isDark ? "#ffffff" : "#18181b" }]}>
          Welcome back
        </Text>

        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? "#09090b" : "#fafafa",
            borderColor: isDark ? "#27272a" : "#e4e4e7",
            color: isDark ? "#ffffff" : "#18181b"
          }]}
          placeholder="Email"
          placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? "#09090b" : "#fafafa",
            borderColor: isDark ? "#27272a" : "#e4e4e7",
            color: isDark ? "#ffffff" : "#18181b"
          }]}
          placeholder="Password"
          placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.forgotPassword}>
          <Text style={[styles.link, { color: isDark ? "#ffffff" : "#18181b" }]}>
            Forgot password?
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.button, { 
            backgroundColor: isDark ? "#ffffff" : "#18181b",
            opacity: loading ? 0.6 : 1 
          }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={isDark ? "#18181b" : "#ffffff"} />
          ) : (
            <Text style={[styles.buttonText, { color: isDark ? "#18181b" : "#ffffff" }]}>
              Login
            </Text>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: isDark ? "#27272a" : "#e4e4e7" }]} />
          <Text style={[styles.dividerText, { color: isDark ? "#71717a" : "#a1a1aa" }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: isDark ? "#27272a" : "#e4e4e7" }]} />
        </View>

        <Pressable 
          style={[styles.button, styles.socialButton, { 
            borderColor: isDark ? "#3f3f46" : "#d4d4d8"
          }]}
        >
          <Text style={[styles.buttonText, { color: isDark ? "#ffffff" : "#18181b" }]}>
            Continue with Google
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.button, styles.socialButton, { 
            borderColor: isDark ? "#3f3f46" : "#d4d4d8"
          }]}
        >
          <Text style={[styles.buttonText, { color: isDark ? "#ffffff" : "#18181b" }]}>
            Continue with GitHub
          </Text>
        </Pressable>

        <Text style={[styles.footerText, { color: isDark ? "#a1a1aa" : "#71717a" }]}>
          Don't have an account?{" "}
          <Text style={styles.link}>Create Account</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
  },
  drawer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#d4d4d8",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 14,
    height: 40,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  button: {
    borderRadius: 6,
    paddingVertical: 10,
    marginBottom: 12,
  },
  socialButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  buttonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    marginHorizontal: 12,
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});
