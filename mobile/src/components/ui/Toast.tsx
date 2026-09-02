import { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "../../store/themeStore";
import { useToastStore, type ToastVariant } from "../../store/toastStore";

const iconByVariant: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};

// Toasts intentionally stay dark-on-white-text regardless of the active app
// theme (like a Material snackbar) — an "inverse surface", not the regular
// `ink` background token, which would flip to near-white in dark mode.
const INVERSE_SURFACE = "#1F241D";

export function ToastHost() {
  const colors = useThemeColors();
  const { message, variant, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colorByVariant: Record<ToastVariant, string> = {
    success: colors.success,
    error: colors.error,
    info: colors.info,
  };

  useEffect(() => {
    if (!message) return;

    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9 }).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }).start(() => hide());
    }, 2600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, hide, translateY]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 16,
        right: 16,
        transform: [{ translateY }],
        zIndex: 999,
        backgroundColor: INVERSE_SURFACE,
      }}
      className="rounded-md px-4 py-3 flex-row items-center"
    >
      <Ionicons name={iconByVariant[variant]} size={18} color={colorByVariant[variant]} />
      <Text className="text-white text-[14px] font-medium ml-2 flex-1" numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}
