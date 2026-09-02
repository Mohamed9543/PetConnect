import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/api/client";
import { Button, Input } from "../src/components/ui";
import { useThemeColors } from "../src/store/themeStore";
import { useAuthStore } from "../src/store/authStore";
import { useToastStore } from "../src/store/toastStore";
import { getErrorMessage } from "../src/utils/getErrorMessage";
import { useTranslation } from "../src/i18n";

export default function OrganizationProfile() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const showToast = useToastStore((state) => state.show);
  const [organizationName, setOrganizationName] = useState(user?.organizationName ?? "");
  const [organizationDescription, setOrganizationDescription] = useState(user?.organizationDescription ?? "");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append("organizationName", organizationName);
      data.append("organizationDescription", organizationDescription);
      const { data: updated } = await api.put("/users/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(updated);
      showToast(t("organizationProfile.saveSuccess"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 20 }}>
      <View className="flex-row items-center bg-info-soft rounded-lg p-4 mb-6">
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text className="text-ink-secondary text-[13px] ml-2 flex-1">
          {t("organizationProfile.infoBanner")}
        </Text>
      </View>

      <Input
        label={t("auth.organizationName")}
        value={organizationName}
        onChangeText={setOrganizationName}
        placeholder={t("auth.organizationNamePlaceholder")}
      />
      <Input
        label={t("editAnimal.descriptionLabel")}
        value={organizationDescription}
        onChangeText={setOrganizationDescription}
        placeholder={t("organizationProfile.descriptionPlaceholder")}
        multiline
        numberOfLines={5}
      />

      {!user?.verified && (
        <Text className="text-ink-muted text-[12px] mb-4">
          {t("organizationProfile.unverifiedNote")}
        </Text>
      )}

      <Button title={t("common.save")} onPress={onSave} loading={saving} />
    </ScrollView>
  );
}
