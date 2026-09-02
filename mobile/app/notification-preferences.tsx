import { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { api } from "../src/api/client";
import { Skeleton } from "../src/components/ui";
import { useThemeColors } from "../src/store/themeStore";
import { useToastStore } from "../src/store/toastStore";
import { useTranslation } from "../src/i18n";

interface Preferences {
  messages: boolean;
  matches: boolean;
  nearbyReports: boolean;
  adoptionUpdates: boolean;
}

function useItems(): { key: keyof Preferences; label: string; description: string }[] {
  const { t } = useTranslation();
  return [
    { key: "messages", label: t("notificationPreferences.messagesLabel"), description: t("notificationPreferences.messagesDescription") },
    { key: "matches", label: t("notificationPreferences.matchesLabel"), description: t("notificationPreferences.matchesDescription") },
    { key: "nearbyReports", label: t("notificationPreferences.nearbyLabel"), description: t("notificationPreferences.nearbyDescription") },
    { key: "adoptionUpdates", label: t("notificationPreferences.adoptionLabel"), description: t("notificationPreferences.adoptionDescription") },
  ];
}

export default function NotificationPreferences() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const items = useItems();
  const showToast = useToastStore((state) => state.show);
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  useEffect(() => {
    api
      .get("/notifications/preferences")
      .then(({ data }) => setPrefs(data))
      .catch(() => setPrefs({ messages: true, matches: true, nearbyReports: true, adoptionUpdates: true }));
  }, []);

  const update = async (key: keyof Preferences, value: boolean) => {
    setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev));
    try {
      await api.put("/notifications/preferences", { [key]: value });
    } catch {
      showToast(t("notificationPreferences.saveError"), "error");
      setPrefs((prev) => (prev ? { ...prev, [key]: !value } : prev));
    }
  };

  if (!prefs) {
    return (
      <View className="flex-1 bg-surface p-5" style={{ gap: 12 }}>
        <Skeleton height={60} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="bg-surface rounded-lg border border-border overflow-hidden">
        {items.map((item, i) => (
          <View
            key={item.key}
            className={`flex-row items-center px-4 py-4 ${i !== items.length - 1 ? "border-b border-border" : ""}`}
          >
            <View className="flex-1 mr-3">
              <Text className="text-ink text-[15px] font-medium">{item.label}</Text>
              <Text className="text-ink-secondary text-[12px] mt-0.5">{item.description}</Text>
            </View>
            <Switch
              value={prefs[item.key]}
              onValueChange={(value) => update(item.key, value)}
              trackColor={{ true: colors.primary }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
