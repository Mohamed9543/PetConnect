import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, Badge } from "../../src/components/ui";
import { confirmAsync } from "../../src/store/actionSheetStore";
import { useThemeColors } from "../../src/store/themeStore";
import { useAuthStore } from "../../src/store/authStore";
import { useTranslation } from "../../src/i18n";

function useMenuItems() {
  const { t } = useTranslation();
  const activityItems = [
    { icon: "home-outline", label: t("profile.myListings"), route: "/my-listings" },
    { icon: "flag-outline", label: t("profile.myReports"), route: "/my-reports" },
    { icon: "heart-circle-outline", label: t("profile.myAdoptionRequests"), route: "/my-adoptions" },
    { icon: "heart-outline", label: t("profile.myFavorites"), route: "/favorites" },
  ] as const;

  const settingsItems = [
    { icon: "person-outline", label: t("profile.editProfileMenu"), route: "/edit-profile" },
    { icon: "sparkles-outline", label: t("profile.assistantMenu"), route: "/assistant" },
    { icon: "notifications-outline", label: t("notifications.title"), route: "/notifications" },
    { icon: "options-outline", label: t("profile.notificationPreferencesMenu"), route: "/notification-preferences" },
    { icon: "ban-outline", label: t("settings.blockedUsers"), route: "/blocked-users" },
    { icon: "moon-outline", label: t("settings.appearance"), route: "/appearance" },
    { icon: "globe-outline", label: t("settings.language"), route: "/language" },
    { icon: "help-circle-outline", label: t("help.title"), route: "/help" },
  ] as const;

  return { activityItems, settingsItems };
}

function MenuGroup({ items }: { items: readonly { icon: any; label: string; route: string | null }[] }) {
  const colors = useThemeColors();
  return (
    <View className="mt-4 mx-4 bg-surface rounded-lg border border-border overflow-hidden">
      {items.map((item, i) => (
        <Pressable
          key={item.label}
          onPress={() => item.route && router.push(item.route as any)}
          accessibilityRole="button"
          className={`flex-row items-center px-4 h-14 ${
            i !== items.length - 1 ? "border-b border-border" : ""
          }`}
        >
          <Ionicons name={item.icon} size={20} color={colors.text} />
          <Text className="ml-3 text-ink text-[15px] flex-1">{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

export default function Profile() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { activityItems, settingsItems } = useMenuItems();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAssociation = user?.role === "association";

  const onLogout = async () => {
    const confirmed = await confirmAsync(
      t("profile.logout"),
      t("profile.logoutConfirmMessage"),
      t("profile.logout")
    );
    if (confirmed) {
      await logout();
      router.replace("/onboarding");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="items-center pt-8 pb-6 bg-surface border-b border-border">
        <Avatar
          uri={user?.avatar}
          name={isAssociation ? user?.organizationName : `${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
          size={88}
        />
        <View className="flex-row items-center mt-3">
          <Text className="text-[18px] font-bold text-ink">
            {isAssociation ? user?.organizationName || t("profile.associationFallback") : `${user?.firstName} ${user?.lastName}`}
          </Text>
          {user?.verified && (
            <Ionicons name="checkmark-circle" size={18} color={colors.info} style={{ marginLeft: 6 }} />
          )}
        </View>
        {isAssociation ? (
          <Badge label={t("profile.associationAccount")} variant="info" />
        ) : (
          typeof user?.rating === "number" &&
          user.rating > 0 && <Text className="text-secondary mt-1 text-[14px]">⭐ {user.rating.toFixed(1)}</Text>
        )}
      </View>

      {isAssociation && (
        <View className="mx-4 mt-4">
          <Pressable
            onPress={() => router.push("/organization-profile")}
            accessibilityRole="button"
            className="bg-surface rounded-lg border border-border px-4 h-14 flex-row items-center"
          >
            <Ionicons name="business-outline" size={20} color={colors.primary} />
            <Text className="ml-3 text-ink text-[15px] flex-1">{t("profile.organizationProfileMenu")}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      <MenuGroup items={activityItems} />
      <MenuGroup items={settingsItems} />

      <Pressable
        onPress={onLogout}
        accessibilityRole="button"
        className="mx-4 mt-4 mb-4 bg-surface rounded-lg border border-border px-4 h-14 flex-row items-center"
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text className="ml-3 text-error font-medium text-[15px]">{t("profile.logout")}</Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
