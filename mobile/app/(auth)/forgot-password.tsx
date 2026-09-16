import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { api } from "../../src/api/client";
import { useTranslation } from "../../src/i18n";

export default function ForgotPassword() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.show);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) return setError(t("auth.emailRequired"));
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return setError(t("auth.emailInvalid"));
    setError(undefined);
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: trimmed });
      router.push({ pathname: "/(auth)/verify-otp", params: { email: trimmed } });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} hitSlop={10} className="mt-2 mb-6 w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>

          <Text className="text-[24px] font-bold text-ink">{t("auth.forgotPasswordTitle")}</Text>
          <Text className="text-ink-secondary mt-1 mb-8">{t("auth.forgotPasswordSubtitle")}</Text>

          <Input
            label={t("auth.email")}
            leftIcon="mail-outline"
            placeholder={t("auth.emailPlaceholder")}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={error}
          />

          <Button title={t("auth.sendCode")} onPress={onSubmit} loading={isLoading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
