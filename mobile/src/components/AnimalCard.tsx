import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { shadow } from "../constants/theme";
import { useFavoritesStore } from "../store/favoritesStore";
import { useThemeColors } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";
import { Badge } from "./ui";
import type { Animal } from "../types";
import { useTranslation } from "../i18n";

const typeIcon: Record<string, string> = { dog: "🐕", cat: "🐈", other: "🐾" };

interface AnimalCardProps {
  animal: Animal;
  hideFavorite?: boolean;
}

export function AnimalCard({ animal, hideFavorite = false }: AnimalCardProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const isFavorite = useFavoritesStore((state) => state.isFavorite(animal._id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const showToast = useToastStore((state) => state.show);

  const onToggleFavorite = async () => {
    try {
      await toggleFavorite(animal._id);
    } catch {
      showToast(t("animal.favoriteError"), "error");
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/animal/${animal._id}`)}
      className="w-[47%] bg-surface rounded-lg overflow-hidden mb-4"
      style={shadow.sm}
      // Deliberately no accessibilityRole="button" here: on web this maps to
      // a literal <button>, and the favorite toggle below is a second
      // <button> nested inside it — invalid HTML that made the browser
      // swallow clicks on the outer card unpredictably. The card is still
      // fully pressable; only its ARIA/host-element semantics change.
      accessibilityLabel={t("animal.viewDetails", { name: animal.name })}
    >
      <View className="relative">
        <Image
          source={animal.images?.[0]}
          style={{ width: "100%", height: 130, backgroundColor: colors.background }}
          contentFit="cover"
          transition={150}
        />
        {animal.status !== "available" && (
          <View className="absolute top-2 left-2">
            <Badge label={animal.status === "pending" ? t("animal.statusPending") : t("animal.statusAdopted")} variant="warning" />
          </View>
        )}
        {!hideFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={8}
            className="absolute top-2 right-2 bg-white/95 rounded-full p-1.5"
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? t("animal.removeFavorite") : t("animal.addFavorite")}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={16}
              color={colors.secondary}
            />
          </Pressable>
        )}
      </View>
      <View className="p-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-[15px] text-ink flex-1" numberOfLines={1}>
            {typeIcon[animal.type] ?? "🐾"} {animal.name}
          </Text>
          {animal.owner?.role === "association" && animal.owner?.verified && (
            <Ionicons name="checkmark-circle" size={14} color={colors.info} style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text className="text-ink-muted text-[12px] mt-1">
          {animal.age} {animal.age > 1 ? t("animal.ageYears") : t("animal.ageYear")} · {animal.gender === "male" ? t("common.male") : t("common.female")}
        </Text>
        <View className="flex-row items-center mt-1.5">
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text className="text-ink-muted text-[12px] ml-1" numberOfLines={1}>
            {animal.location?.city || t("common.locationUnspecified")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
