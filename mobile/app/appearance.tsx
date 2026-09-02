import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../src/i18n";
import { useThemeColors, useThemeStore, type ThemeMode } from "../src/store/themeStore";

const options: { value: ThemeMode; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { value: "light", icon: "sunny-outline", labelKey: "settings.appearanceLight" },
  { value: "dark", icon: "moon-outline", labelKey: "settings.appearanceDark" },
  { value: "system", icon: "phone-portrait-outline", labelKey: "settings.appearanceSystem" },
];

export default function Appearance() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <View className="flex-1 bg-background p-4">
      <View className="bg-surface rounded-lg border border-border overflow-hidden">
        {options.map((option, i) => (
          <Pressable
            key={option.value}
            onPress={() => setMode(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === option.value }}
            className={`flex-row items-center px-4 h-14 ${
              i !== options.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <Ionicons name={option.icon} size={20} color={colors.text} />
            <Text className="ml-3 text-ink text-[15px] flex-1">{t(option.labelKey)}</Text>
            {mode === option.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
