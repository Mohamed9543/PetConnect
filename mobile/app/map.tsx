import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
// Web uses map.web.tsx (Leaflet-based) instead — react-native-maps has no web implementation.
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api } from "../src/api/client";
import { shadow } from "../src/constants/theme";
import { useThemeColors } from "../src/store/themeStore";
import type { Animal, Report } from "../src/types";
import { useTranslation } from "../src/i18n";

type Layer = "adoption" | "lost" | "found";

function useLayers(): { key: Layer; emoji: string; label: string }[] {
  const { t } = useTranslation();
  return [
    { key: "adoption", emoji: "🐕", label: t("home.adoption") },
    { key: "lost", emoji: "🚨", label: t("common.lostLabel") },
    { key: "found", emoji: "🐾", label: t("common.foundLabel") },
  ];
}

export default function MapScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const layers = useLayers();
  const [layer, setLayer] = useState<Layer>("adoption");
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (layer === "adoption") {
      api.get("/animals").then(({ data }) => setAnimals(data)).catch(() => setAnimals([]));
    } else {
      api.get(`/reports/${layer}`).then(({ data }) => setReports(data)).catch(() => setReports([]));
    }
  }, [layer]);

  const markers =
    layer === "adoption"
      ? animals
          .filter((a) => a.location?.latitude && a.location?.longitude)
          .map((a) => ({
            id: a._id,
            lat: a.location.latitude!,
            lng: a.location.longitude!,
            title: a.name,
            onPress: () => router.push(`/animal/${a._id}`),
          }))
      : reports.map((r) => ({
          id: r._id,
          lat: r.location.latitude,
          lng: r.location.longitude,
          title: r.animalName || r.animalType,
          onPress: () => {},
        }));

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: 36.8065, longitude: 10.1815, latitudeDelta: 0.3, longitudeDelta: 0.3 }}
        provider={Platform.OS === "android" ? "google" : undefined}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.lat, longitude: marker.lng }}
            title={marker.title}
            onPress={marker.onPress}
            pinColor={layer === "adoption" ? colors.primary : colors.secondary}
          />
        ))}
      </MapView>

      <View
        className="absolute left-4 right-4 bg-surface rounded-lg flex-row justify-around py-3"
        style={{ bottom: insets.bottom + 24, ...shadow.md }}
      >
        {layers.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setLayer(item.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: layer === item.key }}
            className="items-center px-2"
          >
            <Text
              style={{ color: layer === item.key ? colors.primary : colors.textMuted }}
              className="font-semibold text-[13px]"
            >
              {item.emoji} {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
