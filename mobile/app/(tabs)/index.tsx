import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { AnimalCard } from "../../src/components/AnimalCard";
import { Badge, EmptyState, Skeleton, SkeletonAnimalGrid } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useAuthStore } from "../../src/store/authStore";
import { useToastStore } from "../../src/store/toastStore";
import type { Animal, Report } from "../../src/types";
import { useTranslation } from "../../src/i18n";

function useQuickActions() {
  const { t } = useTranslation();
  return [
    { icon: "home-outline" as const, label: t("home.adoption"), route: "/(tabs)/animals" },
    { icon: "alert-circle-outline" as const, label: t("home.reportLost"), route: "/report/lost" },
    { icon: "paw-outline" as const, label: t("home.reportFound"), route: "/report/found" },
    { icon: "map-outline" as const, label: t("home.map"), route: "/map" },
  ];
}

function ReportMiniCard({ report }: { report: Report }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => router.push(`/report/${report._id}`)}
      className="w-[150px] bg-surface rounded-lg border border-border overflow-hidden mr-3"
      accessibilityLabel={t("home.viewReport", { reference: report.reference })}
    >
      <Image
        source={report.images?.[0]}
        style={{ width: "100%", height: 90, backgroundColor: colors.background }}
        contentFit="cover"
      />
      <View className="p-2.5">
        <Badge label={report.type === "lost" ? t("common.lostBadge") : t("common.foundBadge")} variant={report.type === "lost" ? "warning" : "info"} />
        <Text className="text-ink text-[12px] font-medium mt-1.5" numberOfLines={1}>
          {report.animalName || (report.animalType === "dog" ? t("common.dogName") : report.animalType === "cat" ? t("common.catName") : t("common.animalName"))}
        </Text>
        <Text className="text-ink-muted text-[11px] mt-0.5" numberOfLines={1}>
          {report.location?.address || new Date(report.date).toLocaleDateString("fr-FR")}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const quickActions = useQuickActions();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const [animals, setAnimals] = useState<Animal[] | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [animalsRes, reportsRes] = await Promise.all([
        api.get("/animals"),
        api.get("/reports").catch(() => ({ data: [] })),
      ]);
      setAnimals(animalsRes.data);
      setReports(reportsRes.data.slice(0, 10));
    } catch {
      setAnimals((prev) => prev ?? []);
      setReports((prev) => prev ?? []);
      showToast(t("home.loadError"), "error");
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const isLoading = animals === null;
  const isLoadingReports = reports === null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList
        data={isLoading ? [] : animals}
        numColumns={2}
        keyExtractor={(item) => item._id}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => <AnimalCard animal={item} />}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-[22px] font-bold text-ink">
                  {t("home.greeting", { name: user?.firstName ?? "" })}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text className="text-ink-secondary text-[13px] ml-1">
                    {user?.city || t("home.yourCity")}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push("/notifications")}
                hitSlop={10}
                className="w-11 h-11 rounded-full bg-surface items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={t("notifications.title")}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/(tabs)/animals")}
              className="flex-row items-center bg-surface rounded-md px-4 h-12 mb-6 border border-border"
              accessibilityRole="search"
            >
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <Text className="text-ink-muted text-[14px] ml-2">{t("home.searchPlaceholder")}</Text>
            </Pressable>

            <View className="flex-row flex-wrap justify-between mb-7">
              {quickActions.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => router.push(action.route as any)}
                  className="w-[48%] bg-surface rounded-lg py-4 items-center mb-3 border border-border"
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  <Ionicons name={action.icon} size={22} color={colors.primary} />
                  <Text className="text-ink text-[13px] font-medium mt-2">{action.label}</Text>
                </Pressable>
              ))}
            </View>

            {(isLoadingReports || (reports && reports.length > 0)) && (
              <View className="mb-7">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[17px] font-bold text-ink">{t("home.recentReports")}</Text>
                  <Pressable onPress={() => router.push("/map")} hitSlop={8}>
                    <Text className="text-primary text-[13px] font-semibold">{t("home.viewMap")}</Text>
                  </Pressable>
                </View>
                {isLoadingReports ? (
                  <View className="flex-row" style={{ gap: 12 }}>
                    <Skeleton height={140} width={150} radius={12} />
                    <Skeleton height={140} width={150} radius={12} />
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {reports!.map((report) => (
                      <ReportMiniCard key={report._id} report={report} />
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[17px] font-bold text-ink">{t("home.animalsToAdopt")}</Text>
              <Pressable onPress={() => router.push("/(tabs)/animals")} hitSlop={8}>
                <Text className="text-primary text-[13px] font-semibold">{t("common.seeAll")}</Text>
              </Pressable>
            </View>

            {isLoading && <SkeletonAnimalGrid />}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              emoji="🐾"
              title={t("home.emptyTitle")}
              description={t("home.emptyDescription")}
              actionLabel={t("home.publishListing")}
              onAction={() => router.push("/report/adopt")}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
