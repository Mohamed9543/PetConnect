import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { router } from "expo-router";
import { api } from "../src/api/client";
import { shadow } from "../src/constants/theme";
import { useThemeColors } from "../src/store/themeStore";
import type { Animal, Report } from "../src/types";
import { useTranslation } from "../src/i18n";

// Leaflet's default marker icon resolves image paths relative to the
// bundler's asset pipeline, which breaks under Metro (assets end up
// 404ing). Pointing it at the package's own CDN copies is the standard
// workaround for this exact class of bundler.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function makeColoredIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

type Layer = "adoption" | "lost" | "found";

function useLayers(): { key: Layer; emoji: string; label: string }[] {
  const { t } = useTranslation();
  return [
    { key: "adoption", emoji: "🐕", label: t("home.adoption") },
    { key: "lost", emoji: "🚨", label: t("common.lostLabel") },
    { key: "found", emoji: "🐾", label: t("common.foundLabel") },
  ];
}

function RecenterOnLayerChange({ hasMarkers, lat, lng }: { hasMarkers: boolean; lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (hasMarkers) map.setView([lat, lng], map.getZoom());
  }, [hasMarkers, lat, lng, map]);
  return null;
}

export default function MapScreenWeb() {
  const colors = useThemeColors();
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
            subtitle: a.location?.city,
            onPress: () => router.push(`/animal/${a._id}`),
          }))
      : reports.map((r) => ({
          id: r._id,
          lat: r.location.latitude,
          lng: r.location.longitude,
          title: r.animalName || r.animalType,
          subtitle: r.reference,
          onPress: () => router.push(`/report/${r._id}`),
        }));

  const markerIcon = makeColoredIcon(layer === "adoption" ? colors.primary : colors.secondary);
  const center = markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 36.8065, lng: 10.1815 };

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={markers.length ? 12 : 7}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnLayerChange hasMarkers={markers.length > 0} lat={center.lat} lng={center.lng} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={markerIcon || defaultIcon}
            eventHandlers={{ click: marker.onPress }}
          >
            <Popup>
              <strong>{marker.title}</strong>
              {marker.subtitle ? <div>{marker.subtitle}</div> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <View
        className="absolute bottom-6 left-4 right-4 bg-surface rounded-lg flex-row justify-around py-3"
        style={{ ...shadow.md, zIndex: 1000 }}
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
