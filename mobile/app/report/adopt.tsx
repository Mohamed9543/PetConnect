import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Button, Input } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { useTranslation } from "../../src/i18n";

export default function ReportAdopt() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [vaccinated, setVaccinated] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "dog",
    breed: "",
    gender: "male",
    age: "",
    ageCategory: "young",
    color: "",
    description: "",
    city: "",
  });
  const [errors, setErrors] = useState<{ name?: string; age?: string }>({});
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast(t("reportForm.locationPermissionError"), "error");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = t("reportForm.nameRequired");
    if (!form.age.trim() || Number.isNaN(Number(form.age))) nextErrors.age = t("reportForm.ageInvalid");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.post("/animals", {
        ...form,
        vaccinated,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      });
      showToast(t("reportForm.adoptSubmitSuccess"), "success");
      router.replace("/(tabs)");
    } catch (error) {
      showToast(getErrorMessage(error, t("reportForm.submitErrorAdopt")), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 20 }}>
      <Stack.Screen options={{ headerShown: true, title: t("publish.adoptLabel") }} />
      <View className="flex-row items-center mb-1">
        <Text style={{ fontSize: 20 }}>🏠</Text>
        <Text className="text-[20px] font-bold text-ink ml-2">{t("reportForm.adoptHeader")}</Text>
      </View>
      <Text className="text-ink-secondary text-[13px] mb-5">
        {t("reportForm.adoptSubheading")}
      </Text>

      <Text className="text-ink-secondary text-[13px] font-semibold mb-1.5">{t("reportForm.typeAnimalLabel")}</Text>
      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {[
          { value: "dog", label: t("common.dogType") },
          { value: "cat", label: t("common.catType") },
          { value: "other", label: t("reportForm.otherType") },
        ].map((option) => (
          <Pressable
            key={option.value}
            onPress={() => update("type", option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: form.type === option.value }}
            className={`px-4 h-9 rounded-full items-center justify-center ${
              form.type === option.value ? "bg-primary" : "bg-background border border-border"
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                form.type === option.value ? "text-white" : "text-ink-secondary"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-ink-secondary text-[13px] font-semibold mb-1.5">{t("reportForm.genderLabel")}</Text>
      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {[
          { value: "male", label: t("common.male") },
          { value: "female", label: t("common.female") },
        ].map((option) => (
          <Pressable
            key={option.value}
            onPress={() => update("gender", option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: form.gender === option.value }}
            className={`px-4 h-9 rounded-full items-center justify-center ${
              form.gender === option.value ? "bg-primary" : "bg-background border border-border"
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                form.gender === option.value ? "text-white" : "text-ink-secondary"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label={t("editAnimal.nameLabel")} placeholder={t("reportForm.namePlaceholder")} value={form.name} onChangeText={(v) => update("name", v)} error={errors.name} />
      <Input label={t("editAnimal.breedLabel")} placeholder={t("reportForm.breedPlaceholder")} value={form.breed} onChangeText={(v) => update("breed", v)} />
      <Input label={t("editAnimal.colorLabel")} placeholder={t("reportForm.colorPlaceholder")} value={form.color} onChangeText={(v) => update("color", v)} />
      <Input
        label={t("editAnimal.ageLabel")}
        placeholder={t("reportForm.agePlaceholder")}
        value={form.age}
        onChangeText={(v) => update("age", v)}
        keyboardType="numeric"
        error={errors.age}
      />

      <Text className="text-ink-secondary text-[13px] font-semibold mb-1.5">{t("reportForm.ageCategoryLabel")}</Text>
      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {[
          { value: "baby", label: t("common.ageBaby") },
          { value: "young", label: t("common.ageYoung") },
          { value: "adult", label: t("common.ageAdult") },
        ].map((option) => (
          <Pressable
            key={option.value}
            onPress={() => update("ageCategory", option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: form.ageCategory === option.value }}
            className={`px-4 h-9 rounded-full items-center justify-center ${
              form.ageCategory === option.value ? "bg-primary" : "bg-background border border-border"
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                form.ageCategory === option.value ? "text-white" : "text-ink-secondary"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Input label={t("editAnimal.cityLabel")} leftIcon="location-outline" placeholder={t("reportForm.cityPlaceholder")} value={form.city} onChangeText={(v) => update("city", v)} />

      <Pressable
        onPress={pickLocation}
        accessibilityRole="button"
        className="flex-row items-center bg-surface border rounded-sm px-3.5 mb-4"
        style={{ height: 50, borderColor: colors.border, borderWidth: 1.5 }}
      >
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <Text className="ml-2 text-ink text-[14px] flex-1">
          {locating ? t("reportForm.locationInProgress") : coords ? t("reportForm.locationSavedSimple") : t("reportForm.locationOptional")}
        </Text>
      </Pressable>

      <View
        className="flex-row items-center justify-between bg-surface border rounded-sm px-3.5 mb-4"
        style={{ height: 50, borderColor: colors.border, borderWidth: 1.5 }}
      >
        <Text className="text-ink text-[14px]">{t("animal.vaccinated")}</Text>
        <Switch value={vaccinated} onValueChange={setVaccinated} trackColor={{ true: colors.primary }} />
      </View>

      <Input
        label={t("editAnimal.descriptionLabel")}
        placeholder={t("reportForm.descriptionPlaceholderAdopt")}
        value={form.description}
        onChangeText={(v) => update("description", v)}
        multiline
        numberOfLines={4}
      />

      <Button title={t("reportForm.adoptSubmitButton")} onPress={onSubmit} loading={submitting} style={{ marginTop: 8, marginBottom: 24 }} />
    </ScrollView>
  );
}
