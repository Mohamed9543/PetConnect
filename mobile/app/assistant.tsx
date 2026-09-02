import { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/api/client";
import { Badge } from "../src/components/ui";
import { useThemeColors } from "../src/store/themeStore";
import { getErrorMessage } from "../src/utils/getErrorMessage";
import { useTranslation } from "../src/i18n";

interface ResultItem {
  _id: string;
  name?: string;
  animalName?: string;
  animalType?: string;
  type?: string;
  images?: string[];
  reference?: string;
}

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  text?: string;
  kind?: "data" | "suggestion" | "unknown";
  results?: ResultItem[];
}

// A reply is treated as Arabic-script (standard Arabic or Darija written in
// Arabic letters) when it contains Arabic Unicode characters — Arabizi
// (Latin letters + digits) intentionally stays LTR since it reads left to
// right even though it's Tunisian Darija.
const ARABIC_SCRIPT_RE = /[؀-ۿ]/;
function isRtl(text?: string) {
  return !!text && ARABIC_SCRIPT_RE.test(text);
}

const introEntry = (text: string): ChatEntry => ({ id: "intro", role: "assistant", kind: "unknown", text });

export default function Assistant() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const suggestions = [
    t("assistant.suggestion1"),
    t("assistant.suggestion2"),
    t("assistant.suggestion3"),
    t("assistant.suggestion4"),
    t("assistant.suggestion5"),
    t("assistant.suggestion6"),
  ];
  const [entries, setEntries] = useState<ChatEntry[]>([introEntry(t("assistant.intro"))]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const clearConversation = () => setEntries([introEntry(t("assistant.intro"))]);

  const ask = async (text: string) => {
    const value = text.trim();
    if (!value || sending) return;
    setQuestion("");
    // Last few turns give the assistant conversational context (e.g. "sghir"
    // referring back to the animal just mentioned) without the server having
    // to persist chat history itself.
    const history = entries
      .filter((e) => e.id !== "intro" && e.text)
      .slice(-6)
      .map((e) => ({ role: e.role, text: e.text }));
    setEntries((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: value }]);
    setSending(true);
    try {
      const { data } = await api.post("/assistant/ask", { question: value, history });
      setEntries((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: data.message, kind: data.kind, results: data.results },
      ]);
    } catch (error) {
      setEntries((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          kind: "unknown",
          text: getErrorMessage(error, t("assistant.errorMessage")),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          if (item.role === "user") {
            return (
              <View className="self-end max-w-[80%] bg-primary rounded-lg rounded-br-sm px-4 py-3 mb-3">
                <Text className="text-white text-[14px]">{item.text}</Text>
              </View>
            );
          }
          const rtl = isRtl(item.text);
          return (
            <View
              className="self-start max-w-[90%] bg-surface border border-border rounded-lg rounded-bl-sm px-4 py-3 mb-3"
              style={rtl ? { alignItems: "flex-end" } : undefined}
            >
              {item.kind && (
                <Badge
                  label={item.kind === "data" ? t("assistant.dataLabel") : t("assistant.generalAdviceLabel")}
                  variant={item.kind === "data" ? "info" : "neutral"}
                />
              )}
              <Text
                className="text-ink text-[14px] leading-5 mt-2"
                style={rtl ? { writingDirection: "rtl", textAlign: "right", alignSelf: "stretch" } : undefined}
              >
                {item.text}
              </Text>

              {item.results && item.results.length > 0 && (
                <View className="mt-3" style={{ gap: 8 }}>
                  {item.results.map((result: ResultItem) => (
                    <Pressable
                      key={result._id}
                      onPress={() =>
                        router.push(
                          result.reference ? `/report/matches/${result._id}` : `/animal/${result._id}`
                        )
                      }
                      className="flex-row items-center bg-background rounded-md p-2"
                    >
                      <Image
                        source={result.images?.[0]}
                        style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.border }}
                        contentFit="cover"
                      />
                      <Text className="text-ink text-[13px] ml-2 flex-1" numberOfLines={1}>
                        {result.name || result.animalName || result.animalType}
                        {result.reference ? ` · ${result.reference}` : ""}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          sending ? (
            <View className="self-start bg-surface border border-border rounded-lg rounded-bl-sm px-4 py-3 mb-3">
              <Text className="text-ink-muted text-[13px]">{t("assistant.typing")}</Text>
            </View>
          ) : null
        }
      />

      {entries.length > 1 && (
        <View className="px-4 pb-1 items-end">
          <Pressable onPress={clearConversation} hitSlop={8}>
            <Text className="text-ink-muted text-[12px]">{t("assistant.clearConversation")}</Text>
          </Pressable>
        </View>
      )}

      {entries.length <= 1 && (
        <View className="px-4 pb-2" style={{ gap: 6 }}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => ask(s)}
              className="bg-primary-soft rounded-full px-3 py-2 self-start"
            >
              <Text className="text-primary text-[12px] font-medium">{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View className="flex-row items-center px-3 py-2 border-t border-border">
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder={t("assistant.placeholder")}
          placeholderTextColor={colors.textMuted}
          className="flex-1 bg-surface border border-border rounded-full px-4 py-3 mr-2 text-[14px] text-ink"
          multiline
        />
        <Pressable
          onPress={() => ask(question)}
          disabled={!question.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel={t("assistant.sendLabel")}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            !question.trim() || sending ? "bg-border" : "bg-primary"
          }`}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
