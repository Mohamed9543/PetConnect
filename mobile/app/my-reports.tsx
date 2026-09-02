import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/api/client";
import { Badge, EmptyState, Skeleton } from "../src/components/ui";
import { confirmAsync } from "../src/store/actionSheetStore";
import { useThemeColors } from "../src/store/themeStore";
import { useToastStore } from "../src/store/toastStore";
import { getErrorMessage } from "../src/utils/getErrorMessage";
import { shareReport } from "../src/utils/share";
import type { Report, ReportStatus } from "../src/types";
import { useTranslation } from "../src/i18n";

function useStatusMeta(): Record<ReportStatus, { label: string; variant: "info" | "warning" | "success" | "neutral" }> {
  const { t } = useTranslation();
  return {
    active: { label: t("myReports.statusActive"), variant: "info" },
    in_progress: { label: t("myReports.statusInProgress"), variant: "warning" },
    found: { label: t("myReports.statusFound"), variant: "success" },
    resolved: { label: t("myReports.statusResolved"), variant: "neutral" },
  };
}

function useNextStatus(): Partial<Record<ReportStatus, { to: ReportStatus; label: string }>> {
  const { t } = useTranslation();
  return {
    active: { to: "found", label: t("myReports.markFound") },
    in_progress: { to: "found", label: t("myReports.markFound") },
    found: { to: "resolved", label: t("myReports.closeReport") },
  };
}

export default function MyReports() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const statusMeta = useStatusMeta();
  const nextStatus = useNextStatus();
  const showToast = useToastStore((state) => state.show);
  const [reports, setReports] = useState<Report[] | null>(null);

  const load = useCallback(() => {
    api
      .get("/reports/mine")
      .then(({ data }) => setReports(data))
      .catch(() => setReports([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (report: Report, status: ReportStatus) => {
    try {
      const { data } = await api.put(`/reports/${report._id}`, { status });
      setReports((prev) => (prev ?? []).map((r) => (r._id === report._id ? data : r)));
      showToast(
        status === "found" ? t("myReports.foundSuccess") : t("myReports.closedSuccess"),
        "success"
      );
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const onDelete = async (report: Report) => {
    const confirmed = await confirmAsync(t("common.delete"), t("myReports.deleteConfirmMessage"), t("common.delete"));
    if (!confirmed) return;
    try {
      await api.delete(`/reports/${report._id}`);
      setReports((prev) => (prev ?? []).filter((r) => r._id !== report._id));
      showToast(t("myReports.deleteSuccess"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const isLoading = reports === null;

  return (
    <FlatList
      className="flex-1 bg-background"
      data={isLoading ? [] : reports}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      renderItem={({ item }) => {
        const status = statusMeta[item.status];
        const action = nextStatus[item.status];
        return (
          <View className="bg-surface rounded-lg border border-border p-3 mb-3">
            <View className="flex-row">
              <Image
                source={item.images?.[0]}
                style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: colors.background }}
                contentFit="cover"
              />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-ink text-[14px]" numberOfLines={1}>
                    {item.type === "lost" ? t("common.lostBadge") : t("common.foundBadge")} · {item.animalName || item.animalType}
                  </Text>
                  <Badge label={status.label} variant={status.variant} />
                </View>
                <Text className="text-ink-muted text-[11px] mt-1 font-mono">{t("myReports.reference", { reference: item.reference })}</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap mt-3" style={{ gap: 14 }}>
              {(item.status === "active" || item.status === "in_progress") && (
                <Pressable
                  onPress={() => router.push(`/report/matches/${item._id}`)}
                  accessibilityRole="button"
                  className="flex-row items-center"
                >
                  <Ionicons name="sparkles-outline" size={16} color={colors.info} />
                  <Text className="text-info text-[13px] ml-1 font-medium">{t("report.matches")}</Text>
                </Pressable>
              )}
              {action && (
                <Pressable
                  onPress={() => changeStatus(item, action.to)}
                  accessibilityRole="button"
                  className="flex-row items-center"
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                  <Text className="text-success text-[13px] ml-1 font-medium">{action.label}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => shareReport(item)} accessibilityRole="button" className="flex-row items-center">
                <Ionicons name="share-outline" size={16} color={colors.text} />
                <Text className="text-ink text-[13px] ml-1 font-medium">{t("common.share")}</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(item)} accessibilityRole="button" className="flex-row items-center">
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text className="text-error text-[13px] ml-1 font-medium">{t("common.delete")}</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
      ListHeaderComponent={
        isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={100} />
            <Skeleton height={100} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? null : (
          <EmptyState
            emoji="📋"
            title={t("myReports.emptyTitle")}
            description={t("myReports.emptyDescription")}
            actionLabel={t("myReports.makeReport")}
            onAction={() => router.push("/publish")}
          />
        )
      }
    />
  );
}
