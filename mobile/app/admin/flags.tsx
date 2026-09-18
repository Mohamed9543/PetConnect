import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Badge, EmptyState, Skeleton } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import type { Flag } from "../../src/types";
import { useTranslation } from "../../src/i18n";

type StatusFilter = "pending" | "reviewed" | "dismissed" | "all";

export default function AdminFlags() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [flags, setFlags] = useState<Flag[] | null>(null);

  const load = useCallback(async (status: StatusFilter) => {
    try {
      const { data } = await api.get<Flag[]>("/flags", {
        params: status === "all" ? undefined : { status },
      });
      setFlags(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
      setFlags([]);
    }
  }, [showToast]);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const updateStatus = async (flag: Flag, status: Flag["status"]) => {
    try {
      const { data } = await api.put<Flag>(`/flags/${flag._id}`, { status });
      setFlags((prev) => (prev ?? []).map((f) => (f._id === data._id ? data : f)));
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "pending", label: t("admin.flagPending") },
    { key: "reviewed", label: t("admin.flagReviewed") },
    { key: "dismissed", label: t("admin.flagDismissed") },
    { key: "all", label: t("common.all") },
  ];

  const isLoading = flags === null;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row px-4 mt-4" style={{ gap: 8 }}>
        {filters.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setFilter(item.key)}
            className={`px-3 py-1.5 rounded-full border ${
              filter === item.key ? "bg-primary border-primary" : "border-border"
            }`}
          >
            <Text className={`text-[12px] font-medium ${filter === item.key ? "text-white" : "text-ink-secondary"}`}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={isLoading ? [] : flags}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListHeaderComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={80} />
              <Skeleton height={80} />
            </View>
          ) : null
        }
        ListEmptyComponent={isLoading ? null : <EmptyState emoji="✅" title={t("admin.noFlags")} />}
        renderItem={({ item }) => (
          <View className="bg-surface rounded-lg border border-border p-3 mb-3">
            <View className="flex-row items-center justify-between">
              <Badge label={item.targetType} variant="info" />
              <Badge
                label={item.status}
                variant={item.status === "pending" ? "warning" : item.status === "reviewed" ? "success" : "neutral"}
              />
            </View>
            <Text className="text-ink text-[14px] mt-2">{item.reason}</Text>
            <Text className="text-ink-muted text-[12px] mt-1">
              {t("admin.reportedBy")} {item.reporter?.firstName} {item.reporter?.lastName}
            </Text>
            {item.status === "pending" && (
              <View className="flex-row mt-3" style={{ gap: 16 }}>
                <Pressable onPress={() => updateStatus(item, "reviewed")} className="flex-row items-center">
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                  <Text className="text-success text-[13px] ml-1 font-medium">{t("admin.markReviewed")}</Text>
                </Pressable>
                <Pressable onPress={() => updateStatus(item, "dismissed")} className="flex-row items-center">
                  <Ionicons name="close-circle-outline" size={16} color={colors.textMuted} />
                  <Text className="text-ink-muted text-[13px] ml-1 font-medium">{t("admin.dismiss")}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
