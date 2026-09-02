import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { api } from "../src/api/client";
import { Avatar, EmptyState, Skeleton } from "../src/components/ui";
import { useToastStore } from "../src/store/toastStore";
import { getErrorMessage } from "../src/utils/getErrorMessage";
import { useTranslation } from "../src/i18n";

interface BlockedUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export default function BlockedUsers() {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [users, setUsers] = useState<BlockedUser[] | null>(null);

  const load = useCallback(() => {
    api
      .get("/users/blocked")
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (user: BlockedUser) => {
    try {
      await api.post(`/users/${user._id}/block`);
      setUsers((prev) => (prev ?? []).filter((u) => u._id !== user._id));
      showToast(t("blockedUsers.unblockSuccess", { name: user.firstName }), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const isLoading = users === null;

  return (
    <FlatList
      className="flex-1 bg-background"
      data={isLoading ? [] : users}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      renderItem={({ item }) => (
        <View className="flex-row items-center bg-surface rounded-lg border border-border p-3 mb-3">
          <Avatar uri={item.avatar} name={`${item.firstName} ${item.lastName}`} size={40} />
          <Text className="ml-3 flex-1 text-ink text-[14px] font-medium">
            {item.firstName} {item.lastName}
          </Text>
          <Pressable onPress={() => unblock(item)} accessibilityRole="button">
            <Text className="text-primary text-[13px] font-semibold">{t("common.unblock")}</Text>
          </Pressable>
        </View>
      )}
      ListHeaderComponent={
        isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={60} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? null : (
          <EmptyState emoji="🚫" title={t("blockedUsers.emptyTitle")} description={t("blockedUsers.emptyDescription")} />
        )
      }
    />
  );
}
