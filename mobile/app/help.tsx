import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../src/i18n";
import { useThemeColors } from "../src/store/themeStore";

export default function Help() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`help.faq${n}Q`),
    a: t(`help.faq${n}A`),
  }));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-ink-secondary text-[13px] font-semibold mb-2">{t("help.faqTitle")}</Text>
      <View className="bg-surface rounded-lg border border-border overflow-hidden mb-6">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <View key={i} className={i !== faqs.length - 1 ? "border-b border-border" : ""}>
              <Pressable
                onPress={() => setOpenIndex(isOpen ? null : i)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                className="flex-row items-center px-4 h-14"
              >
                <Text className="text-ink text-[14px] font-medium flex-1 mr-2">{item.q}</Text>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
              </Pressable>
              {isOpen && (
                <Text className="text-ink-secondary text-[13px] leading-5 px-4 pb-4">{item.a}</Text>
              )}
            </View>
          );
        })}
      </View>

      <Text className="text-ink-secondary text-[13px] font-semibold mb-2">{t("help.contactTitle")}</Text>
      <View className="bg-surface rounded-lg border border-border p-4">
        <Text className="text-ink-secondary text-[13px] mb-3">{t("help.contactText")}</Text>
        <Pressable
          onPress={() => Linking.openURL(`mailto:${t("help.contactEmail")}`)}
          accessibilityRole="button"
          className="flex-row items-center"
        >
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <Text className="ml-2 text-primary text-[14px] font-semibold">{t("help.contactEmail")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
