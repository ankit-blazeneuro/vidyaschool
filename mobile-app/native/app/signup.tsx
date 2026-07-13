import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { BottomDrawer } from "../components/BottomDrawer";
import { CustomTextField } from "../components/CustomTextField";
import { Select, SelectOption } from "../components/Select";
import { PrimaryButton } from "../components/PrimaryButton";
import { ApiService } from "../services/api";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "accounts", label: "Accounts" },
  { value: "admin", label: "Admin" },
];

export default function SignupScreen() {
  const router = useRouter();
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "space-between",
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
  },
  drawer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#18181B",
  },
  button: {
    marginTop: 8,
    marginBottom: 12,
  },
  loginLink: {
    alignItems: "center",
    marginTop: 4,
  },
  loginText: {
    fontSize: 12,
    color: "#71717A",
  },
  underline: {
    textDecorationLine: "underline",
    fontWeight: "500",
  },
});
