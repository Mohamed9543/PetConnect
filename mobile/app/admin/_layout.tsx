import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { useThemeColors } from "../../src/store/themeStore";
import { useTranslation } from "../../src/i18n";

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  const colors = useThemeColors();
  const { t } = useTranslation();

  // Client-side guard only hides the entry point for non-admins; every
  // admin endpoint is independently protected server-side (protect + admin
  // middleware), so this is UX, not the actual security boundary.
  if (user?.role !== "admin") return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 17, fontWeight: "600" },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("admin.dashboard") }} />
      <Stack.Screen name="users" options={{ title: t("admin.users") }} />
      <Stack.Screen name="users/[id]" options={{ title: t("admin.userDetail") }} />
      <Stack.Screen name="animals" options={{ title: t("admin.animals") }} />
      <Stack.Screen name="reports" options={{ title: t("admin.reports") }} />
      <Stack.Screen name="flags" options={{ title: t("admin.flags") }} />
    </Stack>
  );
}
