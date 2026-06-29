import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link } from "expo-router";

export default function Welcome() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
        
        <Link href="/login" asChild>
          <Pressable 
            style={StyleSheet.flatten([styles.button, { 
              backgroundColor: isDark ? "#ffffff" : "#18181b" 
            }])}
          >
            <Text style={StyleSheet.flatten([styles.buttonText, { color: isDark ? "#18181b" : "#ffffff" }])}>
              Login
            </Text>
          </Pressable>
        </Link>

        <Pressable 
          style={StyleSheet.flatten([styles.button, styles.secondaryButton, { 
            borderColor: isDark ? "#3f3f46" : "#d4d4d8"
          }])}
        >
          <Text style={StyleSheet.flatten([styles.buttonText, { color: isDark ? "#ffffff" : "#18181b" }])}>
            Create Account
          </Text>
        </Pressable>

        <Text style={[styles.termsText, { color: isDark ? "#a1a1aa" : "#71717a" }]}>
          By continuing, you agree to our{" "}
          <Text style={styles.link}>Terms & Conditions</Text> and{" "}
          <Text style={styles.link}>Privacy Policy</Text>.
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
    marginBottom: 24,
  },
  button: {
    borderRadius: 6,
    paddingVertical: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "500",
  },
});
