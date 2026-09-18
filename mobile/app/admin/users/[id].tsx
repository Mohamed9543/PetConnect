import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { api } from "../../../src/api/client";
import { Avatar, Badge, Skeleton } from "../../../src/components/ui";
import { useThemeColors } from "../../../src/store/themeStore";
import { useToastStore } from "../../../src/store/toastStore";
import { getErrorMessage } from "../../../src/utils/getErrorMessage";
import type { Animal, Report, User } from "../../../src/types";
import { useTranslation } from "../../../src/i18n";

interface AdoptionRequestItem {
  _id: string;
  animal: Animal;
  status: "pending" | "accepted" | "rejected";
}

interface UserDetail {
  user: User;
  animals: Animal[];
  reports: Report[];
  adoptionRequests: AdoptionRequestItem[];
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View className="mt-5">
      <Text className="text-ink-muted text-[12px] font-semibold mb-2 uppercase">
        {title} ({count})
      </Text>
      {children}
    </View>
  );
}

export default function AdminUserDetail() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useToastStore((state) => state.show);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<UserDetail>(`/admin/users/${id}`);
      setDetail(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  if (!detail) {
    return (
      <View className="flex-1 bg-background p-4" style={{ gap: 12 }}>
        <Skeleton height={100} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </View>
    );
  }

  const { user, animals, reports, adoptionRequests } = detail;
  const isAssociation = user.role === "association";

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <View className="items-center bg-surface rounded-lg border border-border p-5">
        <Avatar uri={user.avatar} name={`${user.firstName} ${user.lastName}`} size={72} />
        <Text className="text-ink text-[17px] font-bold mt-3">
          {user.firstName} {user.lastName}
        </Text>
        <Text className="text-ink-muted text-[13px] mt-0.5">{user.email}</Text>
        {user.phone && <Text className="text-ink-muted text-[13px]">{user.phone}</Text>}
        <View className="flex-row mt-2" style={{ gap: 6 }}>
          {user.role !== "user" && <Badge label={user.role} variant={user.role === "admin" ? "primary" : "info"} />}
          {user.isBlocked && <Badge label={t("admin.blocked")} variant="error" />}
          {isAssociation && user.verified && <Badge label={t("admin.verified")} variant="success" />}
        </View>
        {isAssociation && user.organizationName && (
          <Text className="text-ink text-[14px] mt-2 font-medium">{user.organizationName}</Text>
        )}
      </View>

      <Section title={t("admin.userAnimals")} count={animals.length}>
        {animals.map((animal) => (
          <View key={animal._id} className="flex-row items-center bg-surface rounded-lg border border-border p-2.5 mb-2">
            <Image source={animal.images?.[0]} style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.background }} contentFit="cover" />
            <Text className="ml-3 text-ink text-[14px] flex-1" numberOfLines={1}>{animal.name}</Text>
            <Badge label={animal.status} variant={animal.status === "available" ? "success" : "neutral"} />
          </View>
        ))}
      </Section>

      <Section title={t("admin.userReports")} count={reports.length}>
        {reports.map((report) => (
          <View key={report._id} className="flex-row items-center bg-surface rounded-lg border border-border p-2.5 mb-2">
            <Text className="text-ink text-[14px] flex-1" numberOfLines={1}>
              {report.animalName || report.reference}
            </Text>
            <Badge label={report.type === "lost" ? t("common.lostBadge") : t("common.foundBadge")} variant={report.type === "lost" ? "warning" : "info"} />
          </View>
        ))}
      </Section>

      <Section title={t("admin.userAdoptions")} count={adoptionRequests.length}>
        {adoptionRequests.map((request) => (
          <View key={request._id} className="flex-row items-center bg-surface rounded-lg border border-border p-2.5 mb-2">
            <Text className="text-ink text-[14px] flex-1" numberOfLines={1}>{request.animal?.name}</Text>
            <Badge
              label={request.status}
              variant={request.status === "accepted" ? "success" : request.status === "rejected" ? "error" : "warning"}
            />
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}
