import { Platform } from "react-native";

export const lightColors = {
  primary: "#18181B",
  onPrimary: "#FFFFFF",
  background: "#FAFAFA",
  onBackground: "#18181B",
  surface: "#FFFFFF",
  onSurface: "#18181B",
  outline: "#E4E4E7",
  surfaceVariant: "#FAFAFA",
  secondary: "#A1A1AA",
  onSecondary: "#18181B",
  error: "#DC2626",
  onError: "#FFFFFF",
  success: "#10B981",
  border: "#E4E4E7",
  mutedText: "#71717A",
};

export const darkColors = {
  primary: "#FFFFFF",
  onPrimary: "#18181B",
  background: "#09090B",
  onBackground: "#FFFFFF",
  surface: "#18181B",
  onSurface: "#FFFFFF",
  outline: "#27272A",
  surfaceVariant: "#09090B",
  secondary: "#71717A",
  onSecondary: "#FFFFFF",
  error: "#EF4444",
  onError: "#FFFFFF",
  success: "#10B981",
  border: "#27272A",
  mutedText: "#71717A",
};

export type ThemeColors = typeof lightColors;
export type ThemeMode = "light" | "dark" | "system";

export const FONT_FAMILY = Platform.select({
  ios: "Helvetica Neue",
  android: "sans-serif-medium",
  default: "System",
});
