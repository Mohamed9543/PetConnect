import { useEffect, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../../../src/api/client";
import { Button, Input, Skeleton } from "../../../src/components/ui";
import { useThemeColors } from "../../../src/store/themeStore";
import { useToastStore } from "../../../src/store/toastStore";
import { getErrorMessage } from "../../../src/utils/getErrorMessage";
import type { Animal } from "../../../src/types";
import { useTranslation } from "../../../src/i18n";

export default function EditAnimal() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useToastStore((state) => state.show);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vaccinated, setVaccinated] = useState(false);
  const [form, setForm] = useState({
    name: "",
    breed: "",
    color: "",
    age: "",
    description: "",
    city: "",
  });

  useEffect(() => {
    api
      .get(`/animals/${id}`)
      .then(({ data }: { data: Animal }) => {
        setForm({
          name: data.name ?? "",
          breed: data.breed ?? "",
          color: data.color ?? "",
          age: String(data.age ?? ""),
          description: data.description ?? "",
          city: data.location?.city ?? "",
        });
        setVaccinated(data.vaccinated);
      })
      .catch(() => showToast(t("editAnimal.loadError"), "error"))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      data.append("vaccinated", String(vaccinated));
      await api.put(`/animals/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      showToast(t("editAnimal.saveSuccess"), "success");
      router.back();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-surface p-5">
        <Skeleton height={50} />
        <View style={{ height: 12 }} />
        <Skeleton height={50} />
        <View style={{ height: 12 }} />
        <Skeleton height={90} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 20 }}>
      <Input label={t("editAnimal.nameLabel")} value={form.name} onChangeText={(v) => update("name", v)} />
      <Input label={t("editAnimal.breedLabel")} value={form.breed} onChangeText={(v) => update("breed", v)} />
      <Input label={t("editAnimal.colorLabel")} value={form.color} onChangeText={(v) => update("color", v)} />
      <Input label={t("editAnimal.ageLabel")} value={form.age} onChangeText={(v) => update("age", v)} keyboardType="numeric" />
      <Input label={t("editAnimal.cityLabel")} leftIcon="location-outline" value={form.city} onChangeText={(v) => update("city", v)} />

      <View
        className="flex-row items-center justify-between bg-surface border rounded-sm px-3.5 mb-4"
        style={{ height: 50, borderColor: colors.border, borderWidth: 1.5 }}
      >
        <Text className="text-ink text-[14px]">{t("animal.vaccinated")}</Text>
        <Switch value={vaccinated} onValueChange={setVaccinated} trackColor={{ true: colors.primary }} />
      </View>

      <Input
        label={t("editAnimal.descriptionLabel")}
        value={form.description}
        onChangeText={(v) => update("description", v)}
        multiline
        numberOfLines={4}
      />

      <Button title={t("editAnimal.saveButton")} onPress={onSave} loading={saving} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}
