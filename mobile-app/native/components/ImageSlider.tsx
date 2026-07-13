import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from "react-native";
import { useThemeColors } from "../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { FONT_FAMILY } from "../theme/colors";

interface SliderImage {
  id: number;
  url: string;
  title: string;
}

interface ImageSliderProps {
  images: SliderImage[];
  style?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Container width is SCREEN_WIDTH - 48 (24dp padding on each side)
const SLIDER_WIDTH = SCREEN_WIDTH - 48;

export const ImageSlider: React.FC<ImageSliderProps> = ({ images, style }) => {
  const colors = useThemeColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<SliderImage>>(null);
  const timerRef = useRef<any | null>(null);

  // Auto-play interval
  useEffect(() => {
    if (images.length <= 1) return;

    timerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % images.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, images.length]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SLIDER_WIDTH);
    if (index >= 0 && index < images.length) {
      setActiveIndex(index);
    }
  };

  const renderItem = ({ item }: { item: SliderImage }) => {
    return (
      <View style={styles.slide}>
        <Image
          source={{ uri: item.url }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Dark bottom gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        snapToInterval={SLIDER_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item) => item.id.toString()}
        style={styles.flatList}
      />
      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: active ? colors.primary : "rgba(255,255,255,0.5)",
                    width: active ? 12 : 6,
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SLIDER_WIDTH,
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90, // starts gradient halfway up
  },
  textContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 70, // leave space for dots on bottom end
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  dotsContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});

export default ImageSlider;
