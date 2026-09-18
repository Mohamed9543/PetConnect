import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Badge, EmptyState, Skeleton } from "../../src/components/ui";
import { confirmAsync } from "../../src/store/actionSheetStore";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import type { Animal, Paginated } from "../../src/types";
import { useTranslation } from "../../src/i18n";

export default function AdminAnimals() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [query, setQuery] = useState("");
  const [animals, setAnimals] = useState<Animal[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (targetPage: number, search: string, append: boolean) => {
      try {
        const { data } = await api.get<Paginated<Animal>>("/admin/animals", {
          params: { page: targetPage, limit: 20, search: search || undefined },
        });
        setAnimals((prev) => (append && prev ? [...prev, ...data.data] : data.data));
        setPage(data.page);
        setPages(data.pages);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
        if (!append) setAnimals([]);
      }
    },
    [showToast]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(1, query, false), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  const onDelete = async (animal: Animal) => {
    const confirmed = await confirmAsync(
      t("animal.deleteConfirmTitle"),
      t("admin.deleteAnimalConfirm", { name: animal.name }),
      t("common.remove")
    );
    if (!confirmed) return;
    try {
      await api.delete(`/animals/${animal._id}`);
      setAnimals((prev) => (prev ?? []).filter((a) => a._id !== animal._id));
      showToast(t("animal.deleteSuccess"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const isLoading = animals === null;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center bg-surface rounded-md px-3.5 h-11 mx-4 mt-4 border border-border">
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t("admin.searchAnimals")}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          className="ml-2 flex-1 text-[14px] text-ink"
        />
      </View>

      <FlatList
        data={isLoading ? [] : animals}
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
        ListEmptyComponent={isLoading ? null : <EmptyState emoji="🐾" title={t("admin.noAnimals")} />}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-surface rounded-lg border border-border p-3 mb-3">
            <Image
              source={item.images?.[0]}
              style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: colors.background }}
              contentFit="cover"
            />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-ink text-[15px]" numberOfLines={1}>{item.name}</Text>
              <Text className="text-ink-muted text-[12px] mt-0.5" numberOfLines={1}>
                {item.owner?.firstName} {item.owner?.lastName} · {item.location?.city || "—"}
              </Text>
              <View className="mt-1.5">
                <Badge label={item.status} variant={item.status === "available" ? "success" : "neutral"} />
              </View>
            </View>
            <Pressable onPress={() => onDelete(item)} hitSlop={8} accessibilityRole="button">
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
