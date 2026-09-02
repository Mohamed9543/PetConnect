import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { getSocket } from "../../src/api/socket";
import { confirmAsync, showActionSheet } from "../../src/store/actionSheetStore";
import { useThemeColors } from "../../src/store/themeStore";
import { useAuthStore } from "../../src/store/authStore";
import { useHiddenConversationsStore } from "../../src/store/hiddenConversationsStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { useTranslation } from "../../src/i18n";

interface MessageItem {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  createdAt: string;
}

interface ConversationInfo {
  _id: string;
  participants: { _id: string; firstName: string; lastName: string }[];
  lastMessageAt: string;
}

export default function Conversation() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const hideConversation = useHiddenConversationsStore((state) => state.hide);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const peer = conversation?.participants.find((p) => p._id !== user?._id);

  useEffect(() => {
    api.get(`/messages/${id}`).then(({ data }) => setMessages(data)).catch(() => setMessages([]));
    api.get(`/messages/${id}/info`).then(({ data }) => setConversation(data)).catch(() => {});

    const socket = getSocket();
    if (user) socket.emit("join", user._id);
    socket.on("newMessage", (message: MessageItem) => {
      setMessages((prev) => [...prev, message]);
    });
    return () => {
      socket.off("newMessage");
    };
  }, [id, user]);

  const send = async () => {
    const value = text.trim();
    if (!value || sending || !peer) return;
    setSending(true);
    setText("");
    try {
      const { data } = await api.post("/messages", {
        conversationId: id,
        receiverId: peer._id,
        message: value,
      });
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      setText(value);
      showToast(getErrorMessage(error, t("chat.sendError")), "error");
    } finally {
      setSending(false);
    }
  };

  const blockPeer = async () => {
    if (!peer) return;
    const confirmed = await confirmAsync(
      t("chat.blockConfirmTitle"),
      t("chat.blockConfirmMessage", { name: peer.firstName }),
      t("common.block")
    );
    if (!confirmed) return;
    try {
      await api.post(`/users/${peer._id}/block`);
      showToast(t("chat.blockSuccess", { name: peer.firstName }), "success");
      router.back();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const reportPeer = () => {
    if (!peer) return;
    showActionSheet({
      title: t("chat.reportUserTitle"),
      message: t("chat.reportUserMessage"),
      options: [
        { label: t("common.cancel"), style: "cancel" },
        { label: t("chat.reasonSuspicious"), onPress: () => submitReport(t("chat.reasonSuspicious")) },
        { label: t("animal.reportReasonInappropriate"), onPress: () => submitReport(t("animal.reportReasonInappropriate")) },
        { label: t("chat.reasonScam"), onPress: () => submitReport(t("chat.reasonScam")) },
      ],
    });
  };

  const submitReport = async (reason: string) => {
    if (!peer) return;
    try {
      await api.post("/flags", { targetType: "user", targetId: peer._id, reason });
      showToast(t("animal.reportSuccess"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const deleteLocally = async () => {
    const confirmed = await confirmAsync(
      t("chat.deleteConvTitle"),
      t("chat.deleteConvMessage"),
      t("common.delete")
    );
    if (!confirmed) return;
    await hideConversation(id);
    router.back();
  };

  const openMenu = () => {
    showActionSheet({
      title: peer ? `${peer.firstName} ${peer.lastName}` : t("chat.conversation"),
      options: [
        { label: t("common.cancel"), style: "cancel" },
        { label: t("chat.reportUserOption"), onPress: reportPeer },
        { label: t("chat.blockUserOption"), style: "destructive", onPress: blockPeer },
        { label: t("chat.deleteConvTitle"), style: "destructive", onPress: deleteLocally },
      ],
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: peer ? `${peer.firstName} ${peer.lastName}` : t("chat.conversation"),
          headerRight: () => (
            <Pressable onPress={openMenu} accessibilityRole="button" accessibilityLabel={t("chat.optionsLabel")} hitSlop={10}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.sender === user?._id;
          return (
            <View className={`mb-3 max-w-[75%] ${mine ? "self-end" : "self-start"}`}>
              <View
                className={`rounded-lg px-4 py-3 ${mine ? "bg-primary" : "bg-background"}`}
                style={{ borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4 }}
              >
                <Text className={mine ? "text-white" : "text-ink"}>{item.message}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <Text style={{ fontSize: 32 }}>👋</Text>
            <Text className="text-ink-secondary text-[14px] mt-3">
              {t("chat.emptyMessagePrompt")}
            </Text>
          </View>
        }
      />

      <View className="flex-row items-center px-3 py-2 border-t border-border">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("chat.messagePlaceholder")}
          placeholderTextColor={colors.textMuted}
          className="flex-1 bg-background rounded-full px-4 py-3 mr-2 text-[14px] text-ink"
          multiline
        />
        <Pressable
          onPress={send}
          disabled={!text.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel={t("chat.sendLabel")}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            !text.trim() || sending ? "bg-border" : "bg-primary"
          }`}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
