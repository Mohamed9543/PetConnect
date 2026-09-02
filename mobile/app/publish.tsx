import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../src/store/themeStore";
import { useTranslation } from "../src/i18n";

function useOptions() {
  const { t } = useTranslation();
  return [
    {
      emoji: "🚨",
      label: t("home.reportLost"),
      description: t("publish.lostDescription"),
      route: "/report/lost",
    },
    {
      emoji: "🐾",
      label: t("home.reportFound"),
      description: t("publish.foundDescription"),
      route: "/report/found",
    },
    {
      emoji: "🏠",
      label: t("publish.adoptLabel"),
      description: t("publish.adoptDescription"),
      route: "/report/adopt",
    },
  ] as const;
}

export default function Publish() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const options = useOptions();
  return (
    <View className="flex-1 bg-surface px-5 pt-6">
      <Text className="text-[19px] font-bold text-ink mb-1">{t("publish.heading")}</Text>
      <Text className="text-ink-secondary text-[13px] mb-6">{t("publish.subheading")}</Text>

      {options.map((option) => (
        <Pressable
          key={option.label}
          onPress={() => router.replace(option.route)}
          accessibilityRole="button"
          className="flex-row items-center bg-background rounded-lg p-4 mb-3"
        >
          <View className="w-12 h-12 rounded-full bg-surface items-center justify-center border border-border">
            <Text style={{ fontSize: 22 }}>{option.emoji}</Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-[15px] font-semibold text-ink">{option.label}</Text>
            <Text className="text-[12px] text-ink-secondary mt-0.5">{option.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}

      <Pressable onPress={() => router.back()} className="items-center mt-2 py-3" accessibilityRole="button">
        <Text style={{ color: colors.textMuted }} className="text-[14px] font-medium">
          {t("common.cancel")}
        </Text>
      </Pressable>
    </View>
  );
}
