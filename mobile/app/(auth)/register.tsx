import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useAuthStore } from "../../src/store/authStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { useTranslation } from "../../src/i18n";
import type { UserRole } from "../../src/types";

type FormKey =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "city"
  | "password"
  | "confirmPassword"
  | "organizationName";

export default function Register() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [accountType, setAccountType] = useState<Extract<UserRole, "user" | "association">>("user");
  const [form, setForm] = useState<Record<FormKey, string>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    city: "",
    organizationName: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const showToast = useToastStore((state) => state.show);

  const update = (key: FormKey, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Partial<Record<FormKey, string>> = {};
    if (!form.firstName.trim()) next.firstName = t("auth.fieldRequired");
    if (!form.lastName.trim()) next.lastName = t("auth.fieldRequired");
    if (!form.email.trim()) next.email = t("auth.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t("auth.emailInvalid");
    if (form.password.length < 6) next.password = t("auth.passwordMinLength");
    if (form.confirmPassword !== form.password) next.confirmPassword = t("auth.passwordMismatch");
    if (accountType === "association" && !form.organizationName.trim()) {
      next.organizationName = t("auth.organizationNameRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      const { confirmPassword, organizationName, ...rest } = form;
      const payload: Record<string, string> = { ...rest, role: accountType };
      if (accountType === "association") payload.organizationName = organizationName;
      await register(payload);
      showToast(t("auth.registerSuccess"), "success");
      router.replace("/(tabs)");
    } catch (error) {
      showToast(getErrorMessage(error, t("auth.registerError")), "error");
    }
  };

  const fields: { key: FormKey; label: string; placeholder: string; icon: any; secure?: boolean; keyboardType?: any }[] = [
    {
      key: "firstName",
      label: accountType === "association" ? t("auth.contactFirstName") : t("auth.firstName"),
      placeholder: t("auth.firstNamePlaceholder"),
      icon: "person-outline",
    },
    {
      key: "lastName",
      label: accountType === "association" ? t("auth.contactLastName") : t("auth.lastName"),
      placeholder: t("auth.lastNamePlaceholder"),
      icon: "person-outline",
    },
    { key: "email", label: t("auth.email"), placeholder: t("auth.emailPlaceholder"), icon: "mail-outline", keyboardType: "email-address" },
    { key: "phone", label: t("auth.phone"), placeholder: t("auth.phonePlaceholder"), icon: "call-outline", keyboardType: "phone-pad" },
    { key: "city", label: t("auth.city"), placeholder: t("auth.cityPlaceholder"), icon: "location-outline" },
    { key: "password", label: t("auth.password"), placeholder: t("auth.passwordPlaceholder"), icon: "lock-closed-outline", secure: true },
    {
      key: "confirmPassword",
      label: t("auth.confirmPassword"),
      placeholder: t("auth.confirmPasswordPlaceholder"),
      icon: "lock-closed-outline",
      secure: true,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text className="text-[24px] font-bold text-ink mb-1">{t("auth.registerTitle")}</Text>
          <Text className="text-ink-secondary mb-5">{t("auth.registerSubtitle")}</Text>

          <View className="flex-row bg-background rounded-md p-1 mb-5">
            <Pressable
              onPress={() => setAccountType("user")}
              accessibilityRole="button"
              accessibilityState={{ selected: accountType === "user" }}
              className={`flex-1 h-10 rounded-sm items-center justify-center ${
                accountType === "user" ? "bg-surface" : ""
              }`}
              style={accountType === "user" ? { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4 } : undefined}
            >
              <Text className={`text-[13px] font-semibold ${accountType === "user" ? "text-primary" : "text-ink-secondary"}`}>
                {t("auth.individual")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAccountType("association")}
              accessibilityRole="button"
              accessibilityState={{ selected: accountType === "association" }}
              className={`flex-1 h-10 rounded-sm items-center justify-center ${
                accountType === "association" ? "bg-surface" : ""
              }`}
              style={
                accountType === "association" ? { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4 } : undefined
              }
            >
              <Text
                className={`text-[13px] font-semibold ${
                  accountType === "association" ? "text-primary" : "text-ink-secondary"
                }`}
              >
                {t("auth.association")}
              </Text>
            </Pressable>
          </View>

          {accountType === "association" && (
            <Input
              label={t("auth.organizationName")}
              leftIcon="business-outline"
              placeholder={t("auth.organizationNamePlaceholder")}
              value={form.organizationName}
              onChangeText={(v) => update("organizationName", v)}
              error={errors.organizationName}
            />
          )}

          {fields.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              leftIcon={field.icon}
              isPassword={field.secure}
              keyboardType={field.keyboardType}
              autoCapitalize={field.key === "email" ? "none" : "words"}
              value={form[field.key]}
              onChangeText={(value) => update(field.key, value)}
              error={errors[field.key]}
            />
          ))}

          <Button
            title={t("auth.createMyAccount")}
            onPress={onSubmit}
            loading={isLoading}
            style={{ marginTop: 8 }}
          />

          <View className="flex-row justify-center mt-6 mb-4">
            <Text className="text-ink-secondary">{t("auth.alreadyHaveAccount")} </Text>
            <Text
              onPress={() => router.replace("/(auth)/login")}
              className="font-semibold"
              style={{ color: colors.primary }}
            >
              {t("auth.login")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
