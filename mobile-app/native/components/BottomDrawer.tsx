import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { useThemeColors } from "../theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useTheme } from "../theme/ThemeContext";

interface BottomDrawerProps {
  children: React.ReactNode;
  style?: any;
  scrollEnabled?: boolean;
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  children,
  style,
  scrollEnabled = true,
}) => {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 8 : 24;

  const content = (
    <>
      {/* iOS pill handle */}
      <View style={styles.handleWrap}>
        <View style={[styles.handle, { backgroundColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)" }]} />
      </View>
      {scrollEnabled ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === "android"}
        >
          {children}
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={[styles.nonScrollContent, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === "android"}
        >
          {children}
        </ScrollView>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
      style={styles.keyboardContainer}
      pointerEvents="box-none"
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={85}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.drawer,
            {
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            },
            isKeyboardVisible && { height: "76%" },
            style,
          ]}
        >
          {content}
        </BlurView>
      ) : (
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
            isKeyboardVisible && { height: "76%" },
            style,
          ]}
        >
          {content}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
  },
  drawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    maxHeight: "92%",
    // iOS card shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  nonScrollContent: {
    paddingBottom: 8,
  },
});
