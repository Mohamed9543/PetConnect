import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Avatar, Badge, Button, Skeleton } from "../../src/components/ui";
import { confirmAsync, showActionSheet } from "../../src/store/actionSheetStore";
import { useThemeColors } from "../../src/store/themeStore";
import { useAuthStore } from "../../src/store/authStore";
import { useFavoritesStore } from "../../src/store/favoritesStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { shareAnimal } from "../../src/utils/share";
import type { Animal } from "../../src/types";
import { useTranslation } from "../../src/i18n";

export default function AnimalDetails() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const typeLabel: Record<string, string> = { dog: t("common.dogType"), cat: t("common.catType"), other: t("common.otherType") };
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useToastStore((state) => state.show);
  const currentUser = useAuthStore((state) => state.user);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get(`/animals/${id}`)
      .then(({ data }) => setAnimal(data))
      .catch(() => setNotFound(true));
  }, [id]);

  const onToggleFavorite = async () => {
    try {
      await toggleFavorite(id);
    } catch (error) {
      showToast(getErrorMessage(error, t("animal.favoriteError")), "error");
    }
  };

  const contactOwner = async () => {
    if (!animal) return;
    setContacting(true);
    try {
      // Opens the conversation without sending a canned first message —
      // the user writes their own opening message in the chat screen.
      const { data } = await api.post("/messages/start", {
        receiverId: animal.owner._id,
        animalId: animal._id,
      });
      router.push(`/chat/${data._id}`);
    } catch (error) {
      showToast(getErrorMessage(error, t("animal.contactError")), "error");
    } finally {
      setContacting(false);
    }
  };

  const requestAdoption = async () => {
    if (!animal) return;
    setRequesting(true);
    try {
      await api.post("/adoptions", {
        animalId: animal._id,
        message: t("animal.adoptionRequestMessage"),
      });
      showToast(t("animal.adoptionRequestSuccess"), "success");
    } catch (error) {
      showToast(getErrorMessage(error, t("animal.adoptionRequestError")), "error");
    } finally {
      setRequesting(false);
    }
  };

  const reportListing = () => {
    showActionSheet({
      title: t("animal.reportTitle"),
      message: t("animal.reportMessage"),
      options: [
        { label: t("common.cancel"), style: "cancel" },
        { label: t("animal.reportReasonMisleading"), onPress: () => submitFlag(t("animal.reportReasonMisleading")) },
        { label: t("animal.reportReasonUnavailable"), onPress: () => submitFlag(t("animal.reportReasonUnavailable")) },
        { label: t("animal.reportReasonInappropriate"), onPress: () => submitFlag(t("animal.reportReasonInappropriate")) },
      ],
    });
  };

  const submitFlag = async (reason: string) => {
    try {
      await api.post("/flags", { targetType: "animal", targetId: id, reason });
      showToast(t("animal.reportSuccess"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const deleteListing = async () => {
    const confirmed = await confirmAsync(t("animal.deleteConfirmTitle"), t("animal.deleteConfirmMessage"), t("animal.deleteConfirmButton"));
    if (!confirmed) return;
    setDeleting(true);
    try {
      await api.delete(`/animals/${id}`);
      showToast(t("animal.deleteSuccess"), "success");
      router.back();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setDeleting(false);
    }
  };

  if (notFound) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Text style={{ fontSize: 40 }}>🐾</Text>
        <Text className="text-ink text-[17px] font-semibold mt-4 text-center">
          {t("animal.notFoundTitle")}
        </Text>
        <Text className="text-ink-secondary text-[14px] mt-2 text-center">
          {t("animal.notFoundDescription")}
        </Text>
        <View className="mt-5">
          <Button title={t("common.back")} variant="outline" size="sm" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (!animal) {
    return (
      <View className="flex-1 bg-surface">
        <Skeleton height={280} radius={0} />
        <View className="p-5">
          <Skeleton height={22} width="60%" />
          <View style={{ height: 12 }} />
          <Skeleton height={14} width="90%" />
          <View style={{ height: 6 }} />
          <Skeleton height={14} width="80%" />
        </View>
      </View>
    );
  }

  const isOwner = currentUser?._id === animal.owner?._id;

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="relative">
        <Image
          source={animal.images?.[0]}
          style={{ width: "100%", height: 280, backgroundColor: colors.background }}
          contentFit="cover"
        />
        <View className="absolute top-4 right-4 flex-row" style={{ gap: 8 }}>
          <Pressable
            onPress={() => shareAnimal(animal)}
            hitSlop={8}
            className="bg-white/95 rounded-full p-2.5"
            accessibilityRole="button"
            accessibilityLabel={t("animal.shareListing")}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </Pressable>
          {!isOwner && (
            <>
              <Pressable
                onPress={reportListing}
                hitSlop={8}
                className="bg-white/95 rounded-full p-2.5"
                accessibilityRole="button"
                accessibilityLabel={t("animal.reportTitle")}
              >
                <Ionicons name="flag-outline" size={20} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={onToggleFavorite}
                hitSlop={8}
                className="bg-white/95 rounded-full p-2.5"
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? t("animal.removeFavorite") : t("animal.addFavorite")}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={22}
                  color={colors.secondary}
                />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <View className="p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[24px] font-bold text-ink">{animal.name}</Text>
          {animal.status !== "available" && (
            <Badge
              label={animal.status === "pending" ? t("animal.statusPending") : t("animal.statusAdopted")}
              variant="warning"
            />
          )}
        </View>

        <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
          <Badge label={typeLabel[animal.type]} />
          <Badge label={animal.gender === "male" ? t("common.male") : t("common.female")} />
          <Badge label={t("animal.ageBadge", { age: animal.age, unit: animal.age > 1 ? t("animal.ageYears") : t("animal.ageYear") })} />
          {animal.breed && <Badge label={animal.breed} />}
          {animal.location?.city && <Badge label={t("animal.locationBadge", { city: animal.location.city })} />}
          {animal.vaccinated && <Badge label={t("animal.vaccinated")} variant="success" />}
        </View>

        {animal.description && (
          <>
            <Text className="text-[17px] font-semibold text-ink mt-6 mb-2">À propos</Text>
            <Text className="text-ink-secondary text-[14px] leading-6">{animal.description}</Text>
          </>
        )}

        <View className="h-px bg-border my-6" />

        <Text className="text-[17px] font-semibold text-ink mb-3">
          {animal.owner?.role === "association" ? t("animal.associationLabel") : t("animal.ownerLabel")}
        </Text>
        <View className="flex-row items-center">
          <Avatar
            uri={animal.owner?.avatar}
            name={
              animal.owner?.role === "association"
                ? animal.owner?.organizationName
                : `${animal.owner?.firstName ?? ""} ${animal.owner?.lastName ?? ""}`
            }
            size={44}
          />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="font-medium text-ink">
                {animal.owner?.role === "association"
                  ? animal.owner?.organizationName
                  : `${animal.owner?.firstName ?? ""} ${animal.owner?.lastName ?? ""}`}
              </Text>
              {animal.owner?.verified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.info} style={{ marginLeft: 4 }} />
              )}
            </View>
            {typeof animal.owner?.rating === "number" && animal.owner.rating > 0 && (
              <Text className="text-secondary text-[13px]">⭐ {animal.owner.rating.toFixed(1)}</Text>
            )}
          </View>
        </View>

        {isOwner ? (
          <View className="mt-6" style={{ gap: 12 }}>
            <Button
              title={t("animal.edit")}
              variant="outline"
              icon="create-outline"
              onPress={() => router.push(`/animal/edit/${animal._id}`)}
            />
            <Button
              title={t("animal.removeListing")}
              variant="danger"
              icon="trash-outline"
              loading={deleting}
              onPress={deleteListing}
            />
          </View>
        ) : (
          <View className="mt-6" style={{ gap: 12 }}>
            <Button
              title={t("common.contact")}
              variant="outline"
              icon="chatbubble-outline"
              loading={contacting}
              onPress={contactOwner}
            />
            {animal.status === "available" && (
              <Button
                title={t("animal.requestAdoption")}
                icon="heart"
                loading={requesting}
                onPress={requestAdoption}
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
