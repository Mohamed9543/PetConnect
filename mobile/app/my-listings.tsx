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
import { shareAnimal } from "../src/utils/share";
import type { Animal } from "../src/types";
import { useTranslation } from "../src/i18n";

function useStatusVariant(): Record<Animal["status"], { label: string; variant: "success" | "warning" | "neutral" }> {
  const { t } = useTranslation();
  return {
    available: { label: t("myListings.statusAvailable"), variant: "success" },
    pending: { label: t("animal.statusPending"), variant: "warning" },
    adopted: { label: t("animal.statusAdopted"), variant: "neutral" },
  };
}

export default function MyListings() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const statusVariant = useStatusVariant();
  const showToast = useToastStore((state) => state.show);
  const [animals, setAnimals] = useState<Animal[] | null>(null);

  const load = useCallback(() => {
    api
      .get("/animals/mine")
      .then(({ data }) => setAnimals(data))
      .catch(() => setAnimals([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (animal: Animal) => {
    const confirmed = await confirmAsync(
      t("animal.deleteConfirmTitle"),
      t("myListings.deleteConfirmMessage", { name: animal.name }),
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
    <FlatList
      className="flex-1 bg-background"
      data={isLoading ? [] : animals}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      renderItem={({ item }) => {
        const status = statusVariant[item.status];
        return (
          <View className="flex-row bg-surface rounded-lg border border-border p-3 mb-3">
            <Image
              source={item.images?.[0]}
              style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: colors.background }}
              contentFit="cover"
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-ink text-[15px]" numberOfLines={1}>
                  {item.name}
                </Text>
                <Badge label={status.label} variant={status.variant} />
              </View>
              <Text className="text-ink-muted text-[12px] mt-1">
                {t("animal.ageBadge", { age: item.age, unit: item.age > 1 ? t("animal.ageYears") : t("animal.ageYear") })} · {item.location?.city || "—"}
              </Text>
              <View className="flex-row mt-2" style={{ gap: 16 }}>
                <Pressable
                  onPress={() => router.push(`/animal/edit/${item._id}`)}
                  accessibilityRole="button"
                  className="flex-row items-center"
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text className="text-primary text-[13px] ml-1 font-medium">{t("common.edit")}</Text>
                </Pressable>
                <Pressable onPress={() => shareAnimal(item)} accessibilityRole="button" className="flex-row items-center">
                  <Ionicons name="share-outline" size={16} color={colors.text} />
                  <Text className="text-ink text-[13px] ml-1 font-medium">{t("common.share")}</Text>
                </Pressable>
                <Pressable onPress={() => onDelete(item)} accessibilityRole="button" className="flex-row items-center">
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text className="text-error text-[13px] ml-1 font-medium">{t("common.remove")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      }}
      ListHeaderComponent={
        isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={90} />
            <Skeleton height={90} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? null : (
          <EmptyState
            emoji="🏠"
            title={t("myListings.emptyTitle")}
            description={t("myListings.emptyDescription")}
            actionLabel={t("myListings.publishAnimal")}
            onAction={() => router.push("/report/adopt")}
          />
        )
      }
    />
  );
}
