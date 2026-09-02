import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Button, Input } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useAuthStore } from "../../src/store/authStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { useTranslation } from "../../src/i18n";

// Required once per app so the in-app browser used for the Google consent
// screen closes itself and hands control back to the app after redirect.
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isLoading = useAuthStore((state) => state.isLoading);
  const showToast = useToastStore((state) => state.show);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type !== "success") return;
    const idToken = googleResponse.params.id_token;
    (async () => {
      setGoogleLoading(true);
      try {
        await loginWithGoogle(idToken);
        router.replace("/(tabs)");
      } catch (error) {
        showToast(getErrorMessage(error, t("auth.googleError")), "error");
      } finally {
        setGoogleLoading(false);
      }
    })();
  }, [googleResponse]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = t("auth.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = t("auth.emailInvalid");
    if (!password) next.password = t("auth.passwordRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error) {
      showToast(getErrorMessage(error, t("auth.loginError")), "error");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Text className="text-[24px] font-bold text-ink mt-6">{t("auth.welcome")}</Text>
          <Text className="text-ink-secondary mt-1 mb-8">{t("auth.loginSubtitle")}</Text>

          <Input
            label={t("auth.email")}
            leftIcon="mail-outline"
            placeholder={t("auth.emailPlaceholder")}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          <Input
            label={t("auth.password")}
            leftIcon="lock-closed-outline"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <Text className="text-right text-ink-secondary text-[13px] mb-6 -mt-2">
            {t("auth.forgotPassword")}
          </Text>

          <Button title={t("auth.login")} onPress={onSubmit} loading={isLoading} />

          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-border" />
            <Text className="mx-3 text-ink-muted text-[13px]">{t("auth.or")}</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <Button
            title={t("auth.continueWithGoogle")}
            variant="outline"
            icon="logo-google"
            loading={googleLoading}
            disabled={!googleRequest}
            onPress={() => promptGoogleAsync()}
          />

          <View className="flex-row justify-center mt-8">
            <Text className="text-ink-secondary">{t("auth.noAccount")} </Text>
            <Link href="/(auth)/register" className="font-semibold" style={{ color: colors.primary }}>
              {t("auth.createAccount")}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
