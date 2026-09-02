import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { locales, useLocaleStore, useTranslation } from "../src/i18n";
import { useThemeColors } from "../src/store/themeStore";

export default function Language() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const [saving, setSaving] = useState(false);

  const onSelect = async (value: (typeof locales)[number]["value"]) => {
    if (value === locale) return;
    const isRTLTarget = locales.find((l) => l.value === value)?.isRTL ?? false;
    const currentlyRTL = locales.find((l) => l.value === locale)?.isRTL ?? false;

    setSaving(true);
    await setLocale(value);
    setSaving(false);

    if (isRTLTarget !== currentlyRTL) {
      Alert.alert(
        t("settings.restartTitle"),
        t("settings.restartMessage")
      );
    }
  };

  return (
    <View className="flex-1 bg-background p-4">
      <View className="bg-surface rounded-lg border border-border overflow-hidden">
        {locales.map((item, i) => (
          <Pressable
            key={item.value}
            onPress={() => onSelect(item.value)}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ selected: locale === item.value }}
            className={`flex-row items-center px-4 h-14 ${
              i !== locales.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <Text className="text-ink text-[15px] flex-1">{item.label}</Text>
            {locale === item.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
