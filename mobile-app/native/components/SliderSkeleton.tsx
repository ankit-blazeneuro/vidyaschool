import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useThemeColors } from "../theme/ThemeContext";

export const SliderSkeleton: React.FC<{ style?: any }> = ({ style }) => {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          backgroundColor: colors.outline,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 16,
    width: "100%",
    height: 180,
  },
});
