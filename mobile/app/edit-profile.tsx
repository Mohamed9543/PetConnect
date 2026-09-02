import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/api/client";
import { Avatar, Button, Input } from "../src/components/ui";
import { useThemeColors } from "../src/store/themeStore";
import { useAuthStore } from "../src/store/authStore";
import { useToastStore } from "../src/store/toastStore";
import { attachImage } from "../src/utils/attachImage";
import { getErrorMessage } from "../src/utils/getErrorMessage";
import { useTranslation } from "../src/i18n";

export default function EditProfile() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const showToast = useToastStore((state) => state.show);
  const isAssociation = user?.role === "association";

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append("firstName", firstName);
      data.append("lastName", lastName);
      data.append("phone", phone);
      data.append("city", city);
      if (avatarUri) {
        const attached = await attachImage(data, "avatar", avatarUri, "avatar.jpg");
        if (!attached) {
          showToast(t("editProfile.avatarAttachError"), "error");
        }
      }
      const { data: updated } = await api.put("/users/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(updated);
      showToast(t("editProfile.saveSuccess"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 20 }}>
      <View className="items-center mb-6">
        <Pressable onPress={pickAvatar} accessibilityRole="button" className="relative">
          <Avatar
            uri={avatarUri ?? user?.avatar}
            name={isAssociation ? user?.organizationName : `${firstName} ${lastName}`}
            size={96}
          />
          <View
            className="absolute bottom-0 right-0 rounded-full items-center justify-center"
            style={{ width: 32, height: 32, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface }}
          >
            <Ionicons name="camera" size={16} color="white" />
          </View>
        </Pressable>
      </View>

      {!isAssociation && (
        <>
          <Input label={t("auth.firstName")} value={firstName} onChangeText={setFirstName} />
          <Input label={t("auth.lastName")} value={lastName} onChangeText={setLastName} />
        </>
      )}
      <Input label={t("auth.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label={t("auth.city")} value={city} onChangeText={setCity} />

      <Button title={t("common.save")} onPress={onSave} loading={saving} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}
