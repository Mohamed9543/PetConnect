import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/api/client";
import { EmptyState, Skeleton } from "../src/components/ui";
import { useThemeColors } from "../src/store/themeStore";
import { useTranslation } from "../src/i18n";

interface NotificationItem {
  _id: string;
  type: "message" | "match" | "nearby_report" | "adoption_status" | "listing_status" | "reminder";
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

const iconByType: Record<NotificationItem["type"], keyof typeof Ionicons.glyphMap> = {
  message: "chatbubble",
  match: "sparkles",
  nearby_report: "location",
  adoption_status: "heart",
  listing_status: "home",
  reminder: "alarm",
};

function useTimeAgo() {
  const { t } = useTranslation();
  return (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t("notifications.timeNow");
    if (minutes < 60) return t("notifications.timeMinutes", { minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("notifications.timeHours", { hours });
    return t("notifications.timeDays", { days: Math.floor(hours / 24) });
  };
}

export default function Notifications() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api
      .get("/notifications")
      .then(({ data }) => setNotifications(data))
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onPressItem = async (item: NotificationItem) => {
    if (!item.read) {
      setNotifications((prev) => (prev ?? []).map((n) => (n._id === item._id ? { ...n, read: true } : n)));
      api.put(`/notifications/${item._id}/read`).catch(() => {});
    }
    if (item.type === "message" && item.data?.conversationId) {
      router.push(`/chat/${item.data.conversationId}`);
    } else if (item.type === "match" && item.data?.reportId) {
      router.push(`/report/matches/${item.data.reportId}`);
    } else if (item.type === "adoption_status") {
      router.push("/my-adoptions");
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => (prev ?? []).map((n) => ({ ...n, read: true })));
    api.put("/notifications/read-all").catch(() => {});
  };

  const isLoading = notifications === null;
  const hasUnread = (notifications ?? []).some((n) => !n.read);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerRight: () =>
            hasUnread ? (
              <Pressable onPress={markAllRead} accessibilityRole="button">
                <Text className="text-primary text-[13px] font-semibold">{t("notifications.markAllRead")}</Text>
              </Pressable>
            ) : null,
        }}
      />
      <FlatList
        data={isLoading ? [] : notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
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
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressItem(item)}
            accessibilityRole="button"
            className={`flex-row items-start rounded-lg border p-4 mb-3 ${
              item.read ? "bg-surface border-border" : "bg-primary-soft border-primary"
            }`}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Ionicons name={iconByType[item.type]} size={16} color={colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-ink text-[14px] flex-1" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-ink-muted text-[11px] ml-2">{timeAgo(item.createdAt)}</Text>
              </View>
              <Text className="text-ink-secondary text-[13px] mt-1 leading-5">{item.body}</Text>
            </View>
            {!item.read && <View className="w-2 h-2 rounded-full bg-secondary ml-2 mt-1.5" />}
          </Pressable>
        )}
        ListHeaderComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={70} />
              <Skeleton height={70} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              emoji="🔔"
              title={t("notifications.emptyTitle")}
              description={t("notifications.emptyDescription")}
            />
          )
        }
      />
    </View>
  );
}
