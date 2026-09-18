import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Skeleton } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import type { AdminStats } from "../../src/types";
import { useTranslation } from "../../src/i18n";

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: keyof typeof Ionicons.glyphMap }) {
  const colors = useThemeColors();
  return (
    <View className="w-[48%] bg-surface rounded-lg border border-border p-4 mb-3">
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text className="text-ink text-[22px] font-bold mt-2">{value}</Text>
      <Text className="text-ink-muted text-[12px] mt-0.5">{label}</Text>
    </View>
  );
}

function ShortcutRow({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center bg-surface rounded-lg border border-border px-4 h-14 mb-3"
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text className="ml-3 text-ink text-[15px] flex-1">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const isLoading = stats === null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      {isLoading ? (
        <View className="flex-row flex-wrap justify-between">
          <Skeleton height={90} width="48%" radius={12} />
          <Skeleton height={90} width="48%" radius={12} />
          <Skeleton height={90} width="48%" radius={12} />
          <Skeleton height={90} width="48%" radius={12} />
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between">
          <StatCard label={t("admin.statUsers")} value={stats.users} icon="people-outline" />
          <StatCard label={t("admin.statAssociations")} value={stats.associations} icon="business-outline" />
          <StatCard label={t("admin.statAnimals")} value={stats.animals} icon="paw-outline" />
          <StatCard label={t("admin.statAdoptionRate")} value={`${stats.adoptionRate}%`} icon="heart-outline" />
          <StatCard label={t("admin.statOpenReports")} value={stats.openReports} icon="flag-outline" />
          <StatCard label={t("admin.statFoundRate")} value={`${stats.foundRate}%`} icon="checkmark-circle-outline" />
          <StatCard label={t("admin.statPendingFlags")} value={stats.pendingFlags} icon="alert-circle-outline" />
        </View>
      )}

      <Text className="text-ink-muted text-[12px] font-semibold mt-3 mb-2 uppercase">{t("admin.manage")}</Text>
      <ShortcutRow label={t("admin.users")} icon="people-outline" onPress={() => router.push("/admin/users")} />
      <ShortcutRow label={t("admin.animals")} icon="paw-outline" onPress={() => router.push("/admin/animals")} />
      <ShortcutRow label={t("admin.reports")} icon="flag-outline" onPress={() => router.push("/admin/reports")} />
      <ShortcutRow label={t("admin.flags")} icon="alert-circle-outline" onPress={() => router.push("/admin/flags")} />
    </ScrollView>
  );
}
