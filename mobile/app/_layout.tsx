import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { vars } from "nativewind";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import "../global.css";

import { ActionSheetHost, ToastHost } from "../src/components/ui";
import { ErrorBoundary as ScreenErrorBoundary } from "../src/components/ErrorBoundary";
import { useAuthStore } from "../src/store/authStore";
import { useFavoritesStore } from "../src/store/favoritesStore";
import { darkColors, lightColors } from "../src/constants/theme";
import { paletteToCssVars, useResolvedTheme, useThemeColors, useThemeStore } from "../src/store/themeStore";
import { registerPushToken } from "../src/utils/registerPushToken";
import { useLocaleStore, useTranslation } from "../src/i18n";

SplashScreen.preventAutoHideAsync();

// expo-router's route-segment error boundary convention: exporting a
// component named `ErrorBoundary` from a layout file makes the router
// render it, instead of a blank screen, if the default export below throws
// during render — including hook errors that happen before the JSX return,
// which the *inner* <ErrorBoundary> further down in this file cannot catch
// since it only wraps <Stack>, not the whole RootLayout render.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 60 }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Une erreur est survenue</Text>
        <Text style={{ fontSize: 14, color: "#444", marginBottom: 20 }}>{error.message}</Text>
        <Text style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>{error.stack}</Text>
        <Pressable
          onPress={retry}
          style={{ backgroundColor: "#22c55e", padding: 14, borderRadius: 10, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Réessayer</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function useHeaderScreenOptions() {
  const colors = useThemeColors();
  // Memoized so the returned object keeps the same identity across renders
  // where the theme hasn't changed — passing a freshly-identitied options
  // object to every <Stack.Screen> on every render can otherwise cause
  // expo-router to re-sync navigation state in a loop ("Maximum update
  // depth exceeded").
  return useMemo(
    () =>
      ({
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 17, fontWeight: "600" as const, color: colors.text },
        headerBackTitleVisible: false,
      }) as const,
    [colors.surface, colors.text]
  );
}

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useFonts(Ionicons.font);
  // A font-loading error still means "done trying" — the icons just won't
  // render — so it must unblock the splash screen the same as success.
  // Same belt-and-suspenders reasoning as the storage reads: if the native
  // font-loading call never settles at all on some device, nothing here
  // should wait on it forever.
  const [iconsTimedOut, setIconsTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIconsTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);
  const iconsSettled = iconsLoaded || !!iconsError || iconsTimedOut;

  const isAuthReady = useAuthStore((state) => state.isReady);
  const restoreAuth = useAuthStore((state) => state.restore);
  const user = useAuthStore((state) => state.user);
  const loadFavorites = useFavoritesStore((state) => state.load);

  const isThemeReady = useThemeStore((state) => state.isReady);
  const restoreTheme = useThemeStore((state) => state.restore);
  const resolvedTheme = useResolvedTheme();

  const { t, isReady: isI18nReady } = useTranslation();
  const restoreLocale = useLocaleStore((state) => state.restore);

  const headerScreenOptions = useHeaderScreenOptions();

  useEffect(() => {
    restoreAuth();
    restoreTheme();
    restoreLocale();
  }, [restoreAuth, restoreTheme, restoreLocale]);

  useEffect(() => {
    if (isAuthReady && isThemeReady && isI18nReady && iconsSettled) SplashScreen.hideAsync();
  }, [isAuthReady, isThemeReady, isI18nReady, iconsSettled]);

  useEffect(() => {
    if (user) {
      loadFavorites();
      registerPushToken();
    }
  }, [user, loadFavorites]);

  const activeVars = useMemo(
    () => vars(paletteToCssVars(resolvedTheme === "dark" ? darkColors : lightColors)),
    [resolvedTheme]
  );

  // Each screen's merged options object is memoized together so it only
  // gets a new identity when the theme or the active language actually
  // changes, not on every unrelated re-render of this layout.
  const screenOptions = useMemo(
    () => ({
      animalDetails: { ...headerScreenOptions, title: t("animal.details") },
      animalEdit: { ...headerScreenOptions, title: t("animal.edit") },
      chatConversation: { ...headerScreenOptions, title: t("chat.conversation") },
      reportLost: { ...headerScreenOptions, title: t("report.lostTitle") },
      reportFound: { ...headerScreenOptions, title: t("report.foundTitle") },
      publishModal: { presentation: "modal" as const, title: t("publish.title") },
      map: { ...headerScreenOptions, title: t("map.title") },
      favorites: { ...headerScreenOptions, title: t("favorites.title") },
      myListings: { ...headerScreenOptions, title: t("profile.myListings") },
      myReports: { ...headerScreenOptions, title: t("profile.myReports") },
      myAdoptions: { ...headerScreenOptions, title: t("profile.myAdoptions") },
      organizationProfile: { ...headerScreenOptions, title: t("profile.organizationProfile") },
      notificationPreferences: { ...headerScreenOptions, title: t("settings.notificationPreferences") },
      blockedUsers: { ...headerScreenOptions, title: t("settings.blockedUsers") },
      appearance: { ...headerScreenOptions, title: t("settings.appearance") },
      language: { ...headerScreenOptions, title: t("settings.language") },
      assistant: { ...headerScreenOptions, title: t("assistant.title") },
      reportMatches: { ...headerScreenOptions, title: t("report.matches") },
      reportDetails: { ...headerScreenOptions, title: t("report.details") },
      notifications: { ...headerScreenOptions, title: t("notifications.title") },
      help: { ...headerScreenOptions, title: t("help.title") },
      editProfile: { ...headerScreenOptions, title: t("editProfile.title") },
    }),
    [headerScreenOptions, t]
  );

  // Temporary on-screen boot diagnostic (no adb access to this device): a
  // plain-inline-style view, deliberately NOT using NativeWind/className, so
  // it renders even if NativeWind's runtime style resolution is the thing
  // failing. If this text is visible, JS/React are running fine and the
  // hang is in whichever step never completes. If even this stays blank,
  // the problem is upstream of React entirely (native crash before JS).
  if (!isAuthReady || !isThemeReady || !isI18nReady || !iconsSettled) {
    const pending = [
      !isAuthReady && "auth",
      !isThemeReady && "theme",
      !isI18nReady && "locale",
      !iconsSettled && "icons",
    ].filter(Boolean);
    return (
      <View style={{ flex: 1, backgroundColor: "#facc15", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 16, color: "#000", textAlign: "center", fontWeight: "700" }}>
          Démarrage… en attente de : {pending.join(", ")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={activeVars} className="flex-1 bg-background">
        <ScreenErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="animal/[id]" options={screenOptions.animalDetails} />
          <Stack.Screen name="animal/edit/[id]" options={screenOptions.animalEdit} />
          <Stack.Screen name="chat/[id]" options={screenOptions.chatConversation} />
          <Stack.Screen name="report/lost" options={screenOptions.reportLost} />
          <Stack.Screen name="report/found" options={screenOptions.reportFound} />
          <Stack.Screen name="publish" options={screenOptions.publishModal} />
          <Stack.Screen name="map" options={screenOptions.map} />
          <Stack.Screen name="favorites" options={screenOptions.favorites} />
          <Stack.Screen name="my-listings" options={screenOptions.myListings} />
          <Stack.Screen name="my-reports" options={screenOptions.myReports} />
          <Stack.Screen name="my-adoptions" options={screenOptions.myAdoptions} />
          <Stack.Screen name="organization-profile" options={screenOptions.organizationProfile} />
          <Stack.Screen name="notification-preferences" options={screenOptions.notificationPreferences} />
          <Stack.Screen name="blocked-users" options={screenOptions.blockedUsers} />
          <Stack.Screen name="appearance" options={screenOptions.appearance} />
          <Stack.Screen name="language" options={screenOptions.language} />
          <Stack.Screen name="assistant" options={screenOptions.assistant} />
          <Stack.Screen name="report/matches/[id]" options={screenOptions.reportMatches} />
          <Stack.Screen name="report/[id]" options={screenOptions.reportDetails} />
          <Stack.Screen name="notifications" options={screenOptions.notifications} />
          <Stack.Screen name="help" options={screenOptions.help} />
          <Stack.Screen name="edit-profile" options={screenOptions.editProfile} />
          <Stack.Screen name="+not-found" />
        </Stack>
        </ScreenErrorBoundary>
        <ToastHost />
        <ActionSheetHost />
      </View>
      {/* Temporary boot diagnostic: confirms the full render tree (incl.
          NativeWind's `vars()`-driven View above) actually mounted, as
          opposed to the app being stuck on the "Démarrage…" screen above or
          crashing silently. Plain inline style, not NativeWind, so it's
          visible even if NativeWind itself is the thing failing. */}
      <View pointerEvents="none" style={{ position: "absolute", top: 40, left: 8, backgroundColor: "#22c55e", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
        <Text style={{ color: "#fff", fontSize: 10 }}>boot-ok</Text>
      </View>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
    </SafeAreaProvider>
  );
}
