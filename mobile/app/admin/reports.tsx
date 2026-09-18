import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Badge, EmptyState, Skeleton } from "../../src/components/ui";
import { confirmAsync } from "../../src/store/actionSheetStore";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import type { Paginated, Report } from "../../src/types";
import { useTranslation } from "../../src/i18n";

export default function AdminReports() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (targetPage: number, search: string, append: boolean) => {
      try {
        const { data } = await api.get<Paginated<Report>>("/admin/reports", {
          params: { page: targetPage, limit: 20, search: search || undefined },
        });
        setReports((prev) => (append && prev ? [...prev, ...data.data] : data.data));
        setPage(data.page);
        setPages(data.pages);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
        if (!append) setReports([]);
      }
    },
    [showToast]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(1, query, false), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  const onResolve = async (report: Report) => {
    const confirmed = await confirmAsync(
      t("admin.resolveReportTitle"),
      t("admin.resolveReportConfirm"),
      t("admin.resolve")
    );
    if (!confirmed) return;
    try {
      const { data } = await api.put<Report>(`/admin/reports/${report._id}/resolve`);
      setReports((prev) => (prev ?? []).map((r) => (r._id === data._id ? data : r)));
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const isLoading = reports === null;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center bg-surface rounded-md px-3.5 h-11 mx-4 mt-4 border border-border">
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t("admin.searchReports")}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          className="ml-2 flex-1 text-[14px] text-ink"
        />
      </View>

      <FlatList
        data={isLoading ? [] : reports}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loadingMore && page < pages) {
            setLoadingMore(true);
            load(page + 1, query, true).finally(() => setLoadingMore(false));
          }
        }}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} /> : null}
        ListHeaderComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={72} />
              <Skeleton height={72} />
              <Skeleton height={72} />
            </View>
          ) : null
        }
        ListEmptyComponent={isLoading ? null : <EmptyState emoji="🚨" title={t("admin.noReports")} />}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-surface rounded-lg border border-border p-3 mb-3">
            <View className="flex-1">
              <Text className="font-semibold text-ink text-[15px]" numberOfLines={1}>
                {item.animalName || item.reference}
              </Text>
              <Text className="text-ink-muted text-[12px] mt-0.5" numberOfLines={1}>
                {item.user?.firstName} {item.user?.lastName} · {item.reference}
              </Text>
              <View className="flex-row mt-1.5" style={{ gap: 6 }}>
                <Badge label={item.type === "lost" ? t("common.lostBadge") : t("common.foundBadge")} variant={item.type === "lost" ? "warning" : "info"} />
                <Badge label={item.status} variant={item.status === "resolved" ? "success" : "neutral"} />
              </View>
            </View>
            {item.status !== "resolved" && (
              <Pressable onPress={() => onResolve(item)} hitSlop={8} accessibilityRole="button">
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}
