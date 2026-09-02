import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api/client";
import { AnimalCard } from "../src/components/AnimalCard";
import { EmptyState, SkeletonAnimalGrid } from "../src/components/ui";
import { useThemeColors } from "../src/store/themeStore";
import { useFavoritesStore } from "../src/store/favoritesStore";
import { useToastStore } from "../src/store/toastStore";
import type { Animal } from "../src/types";
import { useTranslation } from "../src/i18n";

export default function Favorites() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const [animals, setAnimals] = useState<Animal[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/favorites");
      setAnimals(data);
    } catch {
      setAnimals((prev) => prev ?? []);
      showToast(t("favorites.loadError"), "error");
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const isLoading = animals === null;
  // Filter against the live store so un-favoriting here removes the card
  // immediately, without waiting for a full refetch.
  const visible = (animals ?? []).filter((animal) => favoriteIds.has(animal._id));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <FlatList
        data={isLoading ? [] : visible}
        numColumns={2}
        keyExtractor={(item) => item._id}
        columnWrapperStyle={{ justifyContent: "space-between" }}
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
        renderItem={({ item }) => <AnimalCard animal={item} />}
        ListHeaderComponent={isLoading ? <SkeletonAnimalGrid /> : null}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              emoji="🤍"
              title={t("favorites.emptyTitle")}
              description={t("favorites.emptyDescription")}
              actionLabel={t("favorites.discoverAnimals")}
              onAction={() => router.push("/(tabs)/animals")}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
