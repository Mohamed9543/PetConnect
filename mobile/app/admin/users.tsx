import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Avatar, Badge, EmptyState, Skeleton } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import type { Paginated, User } from "../../src/types";
import { useTranslation } from "../../src/i18n";

export default function AdminUsers() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (targetPage: number, search: string, append: boolean) => {
      try {
        const { data } = await api.get<Paginated<User>>("/admin/users", {
          params: { page: targetPage, limit: 20, search: search || undefined },
        });
        setUsers((prev) => (append && prev ? [...prev, ...data.data] : data.data));
        setPage(data.page);
        setPages(data.pages);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
        if (!append) setUsers([]);
      }
    },
    [showToast]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(1, query, false), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  const onToggleBlock = async (target: User) => {
    try {
      const { data } = await api.put<User>(`/admin/users/${target._id}/block`);
      setUsers((prev) => (prev ?? []).map((u) => (u._id === data._id ? data : u)));
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const onToggleVerify = async (target: User) => {
    try {
      const { data } = await api.put<User>(`/admin/users/${target._id}/verify`);
      setUsers((prev) => (prev ?? []).map((u) => (u._id === data._id ? data : u)));
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const isLoading = users === null;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center bg-surface rounded-md px-3.5 h-11 mx-4 mt-4 border border-border">
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t("admin.searchUsers")}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          className="ml-2 flex-1 text-[14px] text-ink"
        />
      </View>

      <FlatList
        data={isLoading ? [] : users}
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
        ListEmptyComponent={isLoading ? null : <EmptyState emoji="🔍" title={t("admin.noUsers")} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/admin/users/${item._id}`)}
            className="flex-row items-center bg-surface rounded-lg border border-border p-3 mb-3"
          >
            <Avatar uri={item.avatar} name={`${item.firstName} ${item.lastName}`} size={44} />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-ink text-[15px]" numberOfLines={1}>
                {item.firstName} {item.lastName}
              </Text>
              <Text className="text-ink-muted text-[12px] mt-0.5" numberOfLines={1}>
                {item.email}
              </Text>
              <View className="flex-row mt-1.5" style={{ gap: 6 }}>
                {item.role !== "user" && <Badge label={item.role} variant={item.role === "admin" ? "primary" : "info"} />}
                {item.isBlocked && <Badge label={t("admin.blocked")} variant="error" />}
                {item.role === "association" && item.verified && <Badge label={t("admin.verified")} variant="success" />}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Pressable
                onPress={() => onToggleBlock(item)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={item.isBlocked ? t("admin.unblock") : t("admin.block")}
              >
                <Ionicons
                  name={item.isBlocked ? "lock-open-outline" : "lock-closed-outline"}
                  size={20}
                  color={item.isBlocked ? colors.success : colors.error}
                />
              </Pressable>
              {item.role === "association" && (
                <Pressable
                  onPress={() => onToggleVerify(item)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={item.verified ? t("admin.unverify") : t("admin.verify")}
                >
                  <Ionicons
                    name={item.verified ? "checkmark-circle" : "checkmark-circle-outline"}
                    size={20}
                    color={colors.info}
                  />
                </Pressable>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
