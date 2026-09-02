import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { api } from "../../../src/api/client";
import { Badge, EmptyState, Skeleton } from "../../../src/components/ui";
import { useThemeColors } from "../../../src/store/themeStore";
import { useToastStore } from "../../../src/store/toastStore";
import { getErrorMessage } from "../../../src/utils/getErrorMessage";
import type { Report } from "../../../src/types";
import { useTranslation } from "../../../src/i18n";

interface MatchEntry {
  score: number;
  report: Report;
}

function scoreVariant(score: number): "success" | "warning" | "neutral" {
  if (score >= 70) return "success";
  if (score >= 55) return "warning";
  return "neutral";
}

export default function ReportMatches() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useToastStore((state) => state.show);
  const [matches, setMatches] = useState<MatchEntry[] | null>(null);

  useEffect(() => {
    api
      .get(`/reports/${id}/matches`)
      .then(({ data }) => setMatches(data))
      .catch((error) => {
        setMatches([]);
        showToast(getErrorMessage(error, t("reportMatches.loadError")), "error");
      });
  }, [id, showToast]);

  const contact = async (report: Report) => {
    try {
      // Opens the conversation without sending a canned first message —
      // the user writes their own opening message in the chat screen.
      const { data } = await api.post("/messages/start", { receiverId: report.user._id });
      router.push(`/chat/${data._id}`);
    } catch (error) {
      showToast(getErrorMessage(error, t("reportDetail.contactError")), "error");
    }
  };

  const isLoading = matches === null;

  return (
    <FlatList
      className="flex-1 bg-background"
      data={isLoading ? [] : matches}
      keyExtractor={(item) => item.report._id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ListHeaderComponent={
        !isLoading && matches.length > 0 ? (
          <Text className="text-ink-secondary text-[13px] mb-3">
            {t("reportMatches.headerDescription")}
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <View className="bg-surface rounded-lg border border-border p-3 mb-3">
          <View className="flex-row">
            <Image
              source={item.report.images?.[0]}
              style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: colors.background }}
              contentFit="cover"
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-ink text-[14px]" numberOfLines={1}>
                  {item.report.type === "lost" ? t("common.lostBadge") : t("common.foundBadge")} · {item.report.animalName || item.report.animalType}
                </Text>
                <Badge label={`${item.score}%`} variant={scoreVariant(item.score)} />
              </View>
              <Text className="text-ink-secondary text-[12px] mt-1" numberOfLines={2}>
                {item.report.description || t("reportMatches.noDescription")}
              </Text>
              <Text className="text-ink-muted text-[11px] mt-1 font-mono">{t("myReports.reference", { reference: item.report.reference })}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => contact(item.report)}
            accessibilityRole="button"
            className="mt-3 self-start"
          >
            <Text className="text-primary text-[13px] font-semibold">{t("reportMatches.contactThisPerson")}</Text>
          </Pressable>
        </View>
      )}
      ListHeaderComponentStyle={{ marginBottom: 4 }}
      ListEmptyComponent={
        isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={100} />
            <Skeleton height={100} />
          </View>
        ) : (
          <EmptyState
            emoji="🔎"
            title={t("reportMatches.emptyTitle")}
            description={t("reportMatches.emptyDescription")}
          />
        )
      }
    />
  );
}
