import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, View } from "react-native";
import { lightColors, darkColors, ThemeColors, ThemeMode } from "./colors";
import { SessionManager } from "../services/session";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    // Load persisted theme mode
    SessionManager.getThemeMode().then((mode) => {
      if (mode) {
        setThemeModeState(mode as ThemeMode);
      }
      setIsThemeLoaded(true);
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await SessionManager.setThemeMode(mode);
  };

  const isDark =
    themeMode === "system"
      ? systemColorScheme === "dark"
      : themeMode === "dark";

  const colors = isDark ? darkColors : lightColors;

  if (!isThemeLoaded) {
    const initialIsDark = systemColorScheme === "dark";
    const initialBgColor = initialIsDark ? "#09090B" : "#FAFAFA";
    return <View style={{ flex: 1, backgroundColor: initialBgColor }} />;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const useThemeColors = () => {
  const { colors } = useTheme();
  return colors;
};
