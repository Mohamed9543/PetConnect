import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Avatar, EmptyState } from "../../src/components/ui";
import { showActionSheet } from "../../src/store/actionSheetStore";
import { useThemeColors } from "../../src/store/themeStore";
import { useAuthStore } from "../../src/store/authStore";
import { useHiddenConversationsStore } from "../../src/store/hiddenConversationsStore";
import { useTranslation } from "../../src/i18n";

interface ConversationItem {
  _id: string;
  participants: { _id: string; firstName: string; lastName: string; avatar?: string }[];
  animal?: { name: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function Chat() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null);
  const [query, setQuery] = useState("");
  const hiddenAt = useHiddenConversationsStore((state) => state.hiddenAt);
  const loadHidden = useHiddenConversationsStore((state) => state.load);
  const isHidden = useHiddenConversationsStore((state) => state.isHidden);
  const hideConversation = useHiddenConversationsStore((state) => state.hide);

  useEffect(() => {
    loadHidden();
    api
      .get("/messages")
      .then(({ data }) => setConversations(data))
      .catch(() => setConversations([]));
  }, [loadHidden]);

  const visible = useMemo(() => {
    const list = (conversations ?? []).filter((c) => !isHidden(c._id, c.lastMessageAt));
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      const other = c.participants.find((p) => p._id !== user?._id) ?? c.participants[0];
      const name = `${other?.firstName ?? ""} ${other?.lastName ?? ""}`.toLowerCase();
      return name.includes(q) || c.lastMessage?.toLowerCase().includes(q) || c.animal?.name.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, query, hiddenAt, user]);

  const onLongPress = (conversation: ConversationItem) => {
    showActionSheet({
      title: t("chat.conversation"),
      message: t("chat.menuMessage"),
      options: [
        { label: t("common.cancel"), style: "cancel" },
        { label: t("chat.deleteLocally"), style: "destructive", onPress: () => hideConversation(conversation._id) },
      ],
    });
  };

  const isLoading = conversations === null;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <View className="px-4 pt-3 pb-3 border-b border-border">
        <Text className="text-[20px] font-bold text-ink mb-3">{t("chat.title")}</Text>
        <View className="flex-row items-center bg-background rounded-md px-3 h-11 border border-border">
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder={t("chat.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            className="ml-2 flex-1 text-[14px] text-ink"
          />
        </View>
      </View>

      <FlatList
        data={isLoading ? [] : visible}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const other = item.participants.find((p) => p._id !== user?._id) ?? item.participants[0];
          const hasUnread = item.unreadCount > 0;
          return (
            <Pressable
              onPress={() => router.push(`/chat/${item._id}`)}
              onLongPress={() => onLongPress(item)}
              accessibilityRole="button"
              className="flex-row items-center px-4 py-3 border-b border-border"
            >
              <Avatar uri={other?.avatar} name={`${other?.firstName ?? ""} ${other?.lastName ?? ""}`} />
              <View className="ml-3 flex-1">
                <Text
                  className={`text-[15px] ${hasUnread ? "font-bold text-ink" : "font-semibold text-ink"}`}
                >
                  {other?.firstName} {other?.lastName}
                </Text>
                <Text
                  className={`text-[13px] mt-0.5 ${hasUnread ? "text-ink font-medium" : "text-ink-secondary"}`}
                  numberOfLines={1}
                >
                  {item.animal ? `🐾 ${item.animal.name} · ` : ""}
                  {item.lastMessage}
                </Text>
              </View>
              {hasUnread && (
                <View className="min-w-[20px] h-5 rounded-full bg-secondary items-center justify-center px-1.5 ml-2">
                  <Text className="text-white text-[11px] font-bold">{item.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              emoji="💬"
              title={query ? t("chat.emptySearchTitle") : t("chat.emptyTitle")}
              description={
                query
                  ? t("chat.emptySearchDescription")
                  : t("chat.emptyDescription")
              }
            />
          )
        }
      />
    </SafeAreaView>
  );
}
