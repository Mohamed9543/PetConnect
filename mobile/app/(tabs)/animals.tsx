import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { AnimalCard } from "../../src/components/AnimalCard";
import { EmptyState, SkeletonAnimalGrid } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import type { Animal, AgeCategory, AnimalType, Gender } from "../../src/types";
import { useTranslation } from "../../src/i18n";

function useFilterOptions() {
  const { t } = useTranslation();
  const typeOptions: { value: AnimalType | "all"; label: string }[] = [
    { value: "all", label: t("common.all") },
    { value: "dog", label: t("common.dogType") },
    { value: "cat", label: t("common.catType") },
  ];

  const genderOptions: { value: Gender | "all"; label: string }[] = [
    { value: "all", label: t("common.all") },
    { value: "male", label: t("common.male") },
    { value: "female", label: t("common.female") },
  ];

  const ageOptions: { value: AgeCategory | "all"; label: string }[] = [
    { value: "all", label: t("common.all") },
    { value: "baby", label: t("common.ageBaby") },
    { value: "young", label: t("common.ageYoung") },
    { value: "adult", label: t("common.ageAdult") },
  ];

  return { typeOptions, genderOptions, ageOptions };
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`px-4 h-9 rounded-full mr-2 mb-2 items-center justify-center ${
        active ? "bg-primary" : "bg-surface border border-border"
      }`}
    >
      <Text className={`text-[13px] font-medium ${active ? "text-white" : "text-ink-secondary"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Animals() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { typeOptions, genderOptions, ageOptions } = useFilterOptions();
  const showToast = useToastStore((state) => state.show);
  const [animals, setAnimals] = useState<Animal[] | null>(null);
  const [type, setType] = useState<AnimalType | "all">("all");
  const [gender, setGender] = useState<Gender | "all">("all");
  const [ageCategory, setAgeCategory] = useState<AgeCategory | "all">("all");
  const [breed, setBreed] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const toggleNearMe = async () => {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      showToast(t("animals.locationError"), "error");
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    setNearMe(true);
  };

  useEffect(() => {
    setAnimals(null);
    const params: Record<string, string> = {};
    if (type !== "all") params.type = type;
    if (gender !== "all") params.gender = gender;
    if (ageCategory !== "all") params.ageCategory = ageCategory;
    if (breed.trim()) params.breed = breed.trim();
    if (nearMe && coords) {
      params.lat = String(coords.latitude);
      params.lng = String(coords.longitude);
      params.radiusKm = "25";
    }
    const timeout = setTimeout(() => {
      api
        .get("/animals", { params })
        .then(({ data }) => setAnimals(data))
        .catch(() => {
          setAnimals([]);
          showToast(t("animals.loadError"), "error");
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [type, gender, ageCategory, breed, nearMe, coords, showToast]);

  const isLoading = animals === null;
  const hasActiveFilters = type !== "all" || gender !== "all" || ageCategory !== "all" || !!breed.trim() || nearMe;

  const resetFilters = () => {
    setType("all");
    setGender("all");
    setAgeCategory("all");
    setBreed("");
    setNearMe(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 pt-4 bg-surface border-b border-border pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[20px] font-bold text-ink">{t("home.adoption")}</Text>
          <Pressable onPress={() => setShowMore((v) => !v)} accessibilityRole="button" className="flex-row items-center">
            <Ionicons name="options-outline" size={16} color={colors.primary} />
            <Text className="text-primary text-[13px] font-semibold ml-1">
              {showMore ? t("animals.lessFilters") : t("animals.moreFilters")}
            </Text>
          </Pressable>
        </View>

        <Text className="text-ink-secondary text-[12px] font-semibold mb-1.5">{t("animals.typeLabel")}</Text>
        <View className="flex-row flex-wrap mb-1">
          {typeOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={type === option.value}
              onPress={() => setType(option.value)}
            />
          ))}
        </View>

        <Text className="text-ink-secondary text-[12px] font-semibold mb-1.5 mt-1">{t("animals.genderLabel")}</Text>
        <View className="flex-row flex-wrap mb-1">
          {genderOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={gender === option.value}
              onPress={() => setGender(option.value)}
            />
          ))}
        </View>

        {showMore && (
          <>
            <Text className="text-ink-secondary text-[12px] font-semibold mb-1.5 mt-1">{t("animals.ageLabel")}</Text>
            <View className="flex-row flex-wrap mb-1">
              {ageOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  active={ageCategory === option.value}
                  onPress={() => setAgeCategory(option.value)}
                />
              ))}
            </View>

            <Text className="text-ink-secondary text-[12px] font-semibold mb-1.5 mt-2">{t("animals.breedLabel")}</Text>
            <View className="flex-row items-center bg-background rounded-sm px-3 h-10 mb-2 border border-border">
              <Ionicons name="search" size={14} color={colors.textMuted} />
              <TextInput
                placeholder={t("animals.breedPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={breed}
                onChangeText={setBreed}
                className="flex-1 ml-2 text-[13px] text-ink"
              />
            </View>

            <Pressable
              onPress={toggleNearMe}
              accessibilityRole="button"
              accessibilityState={{ selected: nearMe }}
              className={`flex-row items-center px-4 h-9 rounded-full self-start mb-2 ${
                nearMe ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Ionicons name="navigate-outline" size={14} color={nearMe ? colors.white : colors.textSecondary} />
              <Text className={`text-[13px] font-medium ml-1.5 ${nearMe ? "text-white" : "text-ink-secondary"}`}>
                {t("animals.nearMe")}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <FlatList
        data={isLoading ? [] : animals}
        numColumns={2}
        keyExtractor={(item) => item._id}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        renderItem={({ item }) => <AnimalCard animal={item} />}
        ListHeaderComponent={isLoading ? <SkeletonAnimalGrid /> : null}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              emoji="🔍"
              title={t("animals.emptyTitle")}
              description={
                hasActiveFilters
                  ? t("animals.emptyFiltered")
                  : t("animals.emptyDefault")
              }
              actionLabel={hasActiveFilters ? t("animals.resetFilters") : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
