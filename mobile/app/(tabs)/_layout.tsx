import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shadow } from "../../src/constants/theme";
import { useThemeColors } from "../../src/store/themeStore";
import { useTranslation } from "../../src/i18n";

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ focused, active, inactive }: { focused: boolean; active: IconName; inactive: IconName }) {
  const colors = useThemeColors();
  return (
    <Ionicons
      name={focused ? active : inactive}
      color={focused ? colors.primary : colors.textMuted}
      size={24}
    />
  );
}

export default function TabsLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: -2 },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 8 + insets.bottom,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarAccessibilityLabel: t("tabs.home"),
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} active="home" inactive="home-outline" />,
        }}
      />
      <Tabs.Screen
        name="animals"
        options={{
          title: t("tabs.animals"),
          tabBarAccessibilityLabel: t("tabs.animals"),
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} active="paw" inactive="paw-outline" />,
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          // Not a real navigable route — this tab exists only to render a
          // center action button. Without `href: null`, tapping it (or the
          // navigator re-focusing it) mounts app/(tabs)/publish.tsx, which
          // previously used <Redirect> to jump to the "/publish" modal;
          // that redirect-on-focus round-tripped back to this tab and
          // caused an infinite "Maximum update depth exceeded" loop.
          href: null,
          title: "",
          tabBarAccessibilityLabel: t("tabs.publish"),
          tabBarIcon: () => (
            <View
              className="w-12 h-12 rounded-full items-center justify-center -mt-6"
              style={{ backgroundColor: colors.secondary, ...shadow.md }}
            >
              <Ionicons name="add" color={colors.white} size={26} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/publish");
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.messages"),
          tabBarAccessibilityLabel: t("tabs.messages"),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="chatbubble" inactive="chatbubble-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarAccessibilityLabel: t("tabs.profile"),
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} active="person" inactive="person-outline" />,
        }}
      />
    </Tabs>
  );
}
