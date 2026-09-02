import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Button, Input } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { attachImage } from "../../src/utils/attachImage";
import { frenchDateToISO } from "../../src/utils/date";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { useTranslation } from "../../src/i18n";

export default function ReportLost() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    animalName: "",
    animalType: "dog",
    breed: "",
    color: "",
    gender: "unknown",
    date: new Date().toLocaleDateString("fr-FR"),
    description: "",
    contact: "",
  });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

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
    if (!form.contact.trim()) {
      showToast(t("reportForm.phoneRequiredError"), "error");
      return;
    }
    if (!coords) {
      showToast(t("reportForm.locationRequiredErrorLost"), "error");
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("type", "lost");
      Object.entries(form).forEach(([key, value]) =>
        data.append(key, key === "date" ? frenchDateToISO(value) : value)
      );
      data.append("latitude", String(coords.latitude));
      data.append("longitude", String(coords.longitude));
      const attached = await Promise.all(images.map((uri, i) => attachImage(data, "images", uri, `photo${i}.jpg`)));
      if (attached.some((ok) => !ok)) {
        showToast(t("reportForm.photoAttachError"), "error");
      }
      const { data: created } = await api.post("/reports", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // A confirmation dialog (Alert.alert) here previously required the
      // user to dismiss it before router.back() ran — but multi-step
      // Alert flows are unreliable on react-native-web (see Button.tsx /
      // ActionSheet.tsx history), so success silently looked like nothing
      // had happened even though the report was created. A toast plus an
      // immediate, unconditional navigation is reliable on every platform.
      showToast(t("reportForm.lostSubmitSuccess", { reference: created.reference }), "success");
      router.back();
    } catch (error) {
      showToast(getErrorMessage(error, t("reportForm.submitErrorReport")), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 20 }}>
      <View className="flex-row items-center mb-1">
        <Text style={{ fontSize: 20 }}>🚨</Text>
        <Text className="text-[20px] font-bold text-ink ml-2">{t("reportForm.lostHeader")}</Text>
      </View>
      <Text className="text-ink-secondary text-[13px] mb-5">
        {t("reportForm.lostSubheading")}
      </Text>

      <Text className="text-ink-secondary text-[13px] font-semibold mb-2">{t("reportForm.photosLabel")}</Text>
      <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
        {images.map((uri) => (
          <Image key={uri} source={{ uri }} style={{ width: 70, height: 70, borderRadius: 12 }} />
        ))}
        <Pressable
          onPress={pickImage}
          accessibilityRole="button"
          accessibilityLabel={t("reportForm.addPhoto")}
          className="w-[70px] h-[70px] rounded-md border border-dashed border-border-strong items-center justify-center"
        >
          <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text className="text-ink-secondary text-[13px] font-semibold mb-1.5">{t("reportForm.typeAnimalLabel")}</Text>
      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {[
          { value: "dog", label: t("common.dogType") },
          { value: "cat", label: t("common.catType") },
          { value: "other", label: t("reportForm.otherType") },
        ].map((option) => (
          <Pressable
            key={option.value}
            onPress={() => update("animalType", option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: form.animalType === option.value }}
            className={`px-4 h-9 rounded-full items-center justify-center ${
              form.animalType === option.value ? "bg-primary" : "bg-background border border-border"
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                form.animalType === option.value ? "text-white" : "text-ink-secondary"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label={t("editAnimal.nameLabel")} placeholder={t("reportForm.namePlaceholder")} value={form.animalName} onChangeText={(v) => update("animalName", v)} />
      <Input label={t("editAnimal.breedLabel")} placeholder={t("reportForm.breedPlaceholder")} value={form.breed} onChangeText={(v) => update("breed", v)} />
      <Input label={t("editAnimal.colorLabel")} placeholder={t("reportForm.colorPlaceholder")} value={form.color} onChangeText={(v) => update("color", v)} />

      <Text className="text-ink-secondary text-[13px] font-semibold mb-1.5">{t("reportForm.genderLabel")}</Text>
      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {[
          { value: "unknown", label: t("reportForm.unknown") },
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
              className={`text-[13px] font-medium ${form.gender === option.value ? "text-white" : "text-ink-secondary"}`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label={t("reportForm.dateLostLabel")} leftIcon="calendar-outline" value={form.date} onChangeText={(v) => update("date", v)} />

      <Text className="text-ink-secondary text-[13px] font-semibold mb-1.5">{t("reportForm.locationLostLabel")}</Text>
      <Pressable
        onPress={pickLocation}
        accessibilityRole="button"
        className="flex-row items-center bg-surface border rounded-sm px-3.5 mb-4"
        style={{ height: 50, borderColor: colors.border, borderWidth: 1.5 }}
      >
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <Text className="ml-2 text-ink text-[14px] flex-1">
          {locating
            ? t("reportForm.locationInProgress")
            : coords
              ? t("reportForm.locationSavedCoords", { lat: coords.latitude.toFixed(3), lng: coords.longitude.toFixed(3) })
              : t("reportForm.useCurrentLocation")}
        </Text>
      </Pressable>

      <Input
        label={t("editAnimal.descriptionLabel")}
        placeholder={t("reportForm.descriptionPlaceholderLost")}
        value={form.description}
        onChangeText={(v) => update("description", v)}
        multiline
        numberOfLines={4}
      />
      <Input
        label={t("reportForm.phoneLabel")}
        leftIcon="call-outline"
        placeholder={t("reportForm.phonePlaceholder")}
        value={form.contact}
        onChangeText={(v) => update("contact", v)}
        keyboardType="phone-pad"
      />

      <Button
        title={t("reportForm.lostSubmitButton")}
        onPress={onSubmit}
        loading={submitting}
        style={{ marginTop: 8, marginBottom: 24 }}
      />
    </ScrollView>
  );
}
