import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { useThemeColors } from "../../store/themeStore";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: object;
}

export function Skeleton({ width = "100%", height = 16, radius = 8, style }: SkeletonProps) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.border, opacity }, style]}
    />
  );
}

export function SkeletonAnimalCard() {
  return (
    <View className="w-[47%] mb-4">
      <Skeleton height={130} radius={16} />
      <View className="mt-2">
        <Skeleton height={14} width="70%" />
        <View style={{ height: 6 }} />
        <Skeleton height={11} width="50%" />
        <View style={{ height: 6 }} />
        <Skeleton height={11} width="40%" />
      </View>
    </View>
  );
}

export function SkeletonAnimalGrid({ count = 4 }: { count?: number }) {
  return (
    <View className="flex-row flex-wrap justify-between">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAnimalCard key={i} />
      ))}
    </View>
  );
}
