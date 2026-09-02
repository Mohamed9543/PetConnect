import { useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/ui";
import { useThemeColors } from "../src/store/themeStore";
import { useTranslation } from "../src/i18n";

const { width } = Dimensions.get("window");

function useSlides() {
  const { t } = useTranslation();
  return [
    {
      emoji: "🐕",
      title: t("onboarding.slide1Title"),
      text: t("onboarding.slide1Text"),
    },
    {
      emoji: "📍",
      title: t("onboarding.slide2Title"),
      text: t("onboarding.slide2Text"),
    },
    {
      emoji: "❤️",
      title: t("onboarding.slide3Title"),
      text: t("onboarding.slide3Text"),
    },
  ];
}

export default function Onboarding() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const slides = useSlides();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLast = index === slides.length - 1;

  const goToLogin = () => router.replace("/(auth)/login");

  const next = () => {
    if (!isLast) {
      listRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      goToLogin();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row justify-end px-6 pt-2">
        <Pressable onPress={goToLogin} hitSlop={10} accessibilityRole="button">
          <Text className="text-ink-secondary text-[14px] font-medium">{t("onboarding.skip")}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={{ width }} className="items-center justify-center px-10">
            <View
              className="w-28 h-28 rounded-full items-center justify-center mb-10"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <Text style={{ fontSize: 52 }}>{item.emoji}</Text>
            </View>
            <Text className="text-[24px] leading-[30px] font-bold text-center text-ink">
              {item.title}
            </Text>
            <Text className="text-[15px] leading-[22px] text-center mt-3 text-ink-secondary">
              {item.text}
            </Text>
          </View>
        )}
      />

      <View className="flex-row justify-center mb-8">
        {slides.map((_, i) => (
          <View
            key={i}
            className="h-2 rounded-full mx-1"
            style={{
              width: i === index ? 20 : 8,
              backgroundColor: i === index ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>

      <View className="px-6 mb-6">
        <Button title={isLast ? t("onboarding.start") : t("onboarding.next")} onPress={next} />
      </View>
    </SafeAreaView>
  );
}
