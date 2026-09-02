import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { api } from "../src/api/client";
import { Badge, EmptyState, Skeleton } from "../src/components/ui";
import { useThemeColors } from "../src/store/themeStore";
import { useAuthStore } from "../src/store/authStore";
import { useToastStore } from "../src/store/toastStore";
import { getErrorMessage } from "../src/utils/getErrorMessage";
import type { Animal, User } from "../src/types";
import { useTranslation } from "../src/i18n";

interface AdoptionRequestItem {
  _id: string;
  animal: Animal;
  requester: User;
  owner: User;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

function useStatusMeta(): Record<AdoptionRequestItem["status"], { label: string; variant: "warning" | "success" | "error" }> {
  const { t } = useTranslation();
  return {
    pending: { label: t("animal.statusPending"), variant: "warning" },
    accepted: { label: t("myAdoptions.statusAccepted"), variant: "success" },
    rejected: { label: t("myAdoptions.statusRejected"), variant: "error" },
  };
}

export default function MyAdoptions() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const statusMeta = useStatusMeta();
  const currentUser = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const [requests, setRequests] = useState<AdoptionRequestItem[] | null>(null);

  const load = useCallback(() => {
    api
      .get("/adoptions/my")
      .then(({ data }) => setRequests(data))
      .catch((error) => {
        setRequests([]);
        showToast(getErrorMessage(error, t("myAdoptions.loadError")), "error");
      });
  }, [showToast]);

  // Re-fetch every time this screen gains focus, since expo-router keeps
  // the screen mounted in the background — a plain mount-only effect would
  // otherwise show stale data after submitting a request from elsewhere.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const respond = async (request: AdoptionRequestItem, status: "accepted" | "rejected") => {
    try {
      const { data } = await api.put(`/adoptions/${request._id}`, { status });
      setRequests((prev) => (prev ?? []).map((r) => (r._id === request._id ? { ...r, status: data.status } : r)));
      showToast(status === "accepted" ? t("myAdoptions.acceptSuccess") : t("myAdoptions.rejectSuccess"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const isLoading = requests === null;

  return (
    <FlatList
      className="flex-1 bg-background"
      data={isLoading ? [] : requests}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      renderItem={({ item }) => {
        const status = statusMeta[item.status];
        const isOwnerView = item.owner._id === currentUser?._id;
        return (
          <Pressable
            onPress={() => router.push(`/animal/${item.animal._id}`)}
            className="flex-row bg-surface rounded-lg border border-border p-3 mb-3"
          >
            <Image
              source={item.animal.images?.[0]}
              style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: colors.background }}
              contentFit="cover"
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-ink text-[14px]" numberOfLines={1}>
                  {item.animal.name}
                </Text>
                <Badge label={status.label} variant={status.variant} />
              </View>
              <Text className="text-ink-muted text-[12px] mt-1">
                {isOwnerView
                  ? t("myAdoptions.requestFrom", { name: `${item.requester.firstName} ${item.requester.lastName}` })
                  : t("myAdoptions.yourRequestTo", { name: `${item.owner.firstName} ${item.owner.lastName}` })}
              </Text>
              {isOwnerView && item.status === "pending" && (
                <View className="flex-row mt-2" style={{ gap: 16 }}>
                  <Pressable onPress={() => respond(item, "accepted")} accessibilityRole="button">
                    <Text className="text-success text-[13px] font-semibold">{t("myAdoptions.accept")}</Text>
                  </Pressable>
                  <Pressable onPress={() => respond(item, "rejected")} accessibilityRole="button">
                    <Text className="text-error text-[13px] font-semibold">{t("myAdoptions.reject")}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </Pressable>
        );
      }}
      ListHeaderComponent={
        isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={80} />
            <Skeleton height={80} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? null : (
          <EmptyState
            emoji="❤️"
            title={t("myAdoptions.emptyTitle")}
            description={t("myAdoptions.emptyDescription")}
          />
        )
      }
    />
  );
}
