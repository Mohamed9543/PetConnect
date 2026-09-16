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

export default function VerifyOtp() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const showToast = useToastStore((state) => state.show);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const onSubmit = async () => {
    if (otp.length !== 6) return setError(t("auth.otpInvalid"));
    setError(undefined);
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/verify-reset-otp", { email, otp });
      router.push({ pathname: "/(auth)/reset-password", params: { resetToken: data.resetToken } });
    } catch (error) {
      showToast(getErrorMessage(error, t("auth.otpError")), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async () => {
    setIsResending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      showToast(t("auth.codeResent"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} hitSlop={10} className="mt-2 mb-6 w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>

          <Text className="text-[24px] font-bold text-ink">{t("auth.verifyOtpTitle")}</Text>
          <Text className="text-ink-secondary mt-1 mb-8">{t("auth.verifyOtpSubtitle", { email: email ?? "" })}</Text>

          <Input
            label={t("auth.otpLabel")}
            leftIcon="key-outline"
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(value) => setOtp(value.replace(/[^0-9]/g, ""))}
            error={error}
          />

          <Button title={t("auth.verify")} onPress={onSubmit} loading={isLoading} />

          <Pressable onPress={onResend} disabled={isResending} hitSlop={8} className="items-center mt-6">
            <Text className="text-primary text-[13px] font-semibold">
              {isResending ? t("auth.resending") : t("auth.resendCode")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
