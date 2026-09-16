import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { api } from "../../src/api/client";
import { useTranslation } from "../../src/i18n";

export default function ResetPassword() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { resetToken } = useLocalSearchParams<{ resetToken: string }>();
  const showToast = useToastStore((state) => state.show);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (password.length < 6) next.password = t("auth.passwordMinLength");
    if (confirmPassword !== password) next.confirmPassword = t("auth.passwordMismatch");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { resetToken, newPassword: password });
      showToast(t("auth.passwordResetSuccess"), "success");
      router.replace("/(auth)/login");
    } catch (error) {
      showToast(getErrorMessage(error, t("auth.otpError")), "error");
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

          <Text className="text-[24px] font-bold text-ink">{t("auth.resetPasswordTitle")}</Text>
          <Text className="text-ink-secondary mt-1 mb-8">{t("auth.resetPasswordSubtitle")}</Text>

          <Input
            label={t("auth.newPassword")}
            leftIcon="lock-closed-outline"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <Input
            label={t("auth.confirmPassword")}
            leftIcon="lock-closed-outline"
            placeholder="••••••••"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
          />

          <Button title={t("auth.resetPassword")} onPress={onSubmit} loading={isLoading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
