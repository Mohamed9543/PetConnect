import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { api } from "../../src/api/client";
import { Avatar, Badge, Button, Skeleton } from "../../src/components/ui";
import { useThemeColors } from "../../src/store/themeStore";
import { useAuthStore } from "../../src/store/authStore";
import { confirmAsync } from "../../src/store/actionSheetStore";
import { useToastStore } from "../../src/store/toastStore";
import { getErrorMessage } from "../../src/utils/getErrorMessage";
import { shareReport } from "../../src/utils/share";
import type { Report, ReportStatus } from "../../src/types";
import { useTranslation } from "../../src/i18n";

function useStatusMeta(): Record<ReportStatus, { label: string; variant: "info" | "warning" | "success" | "neutral" }> {
  const { t } = useTranslation();
  return {
    active: { label: t("myReports.statusActive"), variant: "info" },
    in_progress: { label: t("myReports.statusInProgress"), variant: "warning" },
    found: { label: t("myReports.statusFound"), variant: "success" },
    resolved: { label: t("myReports.statusResolved"), variant: "neutral" },
  };
}

export default function ReportDetails() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const typeLabel: Record<string, string> = { dog: t("common.dogType"), cat: t("common.catType"), other: t("common.otherType") };
  const statusMeta = useStatusMeta();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const [report, setReport] = useState<Report | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get(`/reports/${id}`)
      .then(({ data }) => setReport(data))
      .catch(() => setNotFound(true));
  }, [id]);

  const contactReporter = async () => {
    if (!report) return;
    setContacting(true);
    try {
      // Opens the conversation without sending a canned first message —
      // the user writes their own opening message in the chat screen.
      const { data } = await api.post("/messages/start", { receiverId: report.user._id });
      router.push(`/chat/${data._id}`);
    } catch (error) {
      showToast(getErrorMessage(error, t("reportDetail.contactError")), "error");
    } finally {
      setContacting(false);
    }
  };

  const deleteReport = async () => {
    if (!report) return;
    const confirmed = await confirmAsync(
      t("reportDetail.deleteConfirmTitle"),
      t("animal.deleteConfirmMessage"),
      t("common.delete")
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await api.delete(`/reports/${report._id}`);
      showToast(t("myReports.deleteSuccess"), "success");
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
          {t("reportDetail.notFoundTitle")}
        </Text>
        <View className="mt-5">
          <Button title={t("common.back")} variant="outline" size="sm" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View className="flex-1 bg-surface">
        <Skeleton height={280} radius={0} />
        <View className="p-5">
          <Skeleton height={22} width="60%" />
          <View style={{ height: 12 }} />
          <Skeleton height={14} width="90%" />
        </View>
      </View>
    );
  }

  const isOwner = currentUser?._id === report.user?._id;
  const status = statusMeta[report.status];

  return (
    <ScrollView className="flex-1 bg-surface">
      <Image
        source={report.images?.[0]}
        style={{ width: "100%", height: 260, backgroundColor: colors.background }}
        contentFit="cover"
      />

      <View className="p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[22px] font-bold text-ink">
            {report.type === "lost" ? t("reportDetail.lostTitleBadge") : t("reportDetail.foundTitleBadge")}
          </Text>
          <Badge label={status.label} variant={status.variant} />
        </View>
        <Text className="text-ink-muted text-[12px] mt-1 font-mono">{t("myReports.reference", { reference: report.reference })}</Text>

        <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
          <Badge label={typeLabel[report.animalType]} />
          {report.breed && <Badge label={report.breed} />}
          {report.color && <Badge label={report.color} />}
          {report.gender && report.gender !== "unknown" && (
            <Badge label={report.gender === "male" ? t("common.male") : t("common.female")} />
          )}
          {report.location?.address && <Badge label={t("animal.locationBadge", { city: report.location.address })} />}
        </View>

        {report.description && (
          <>
            <Text className="text-[17px] font-semibold text-ink mt-6 mb-2">{t("editAnimal.descriptionLabel")}</Text>
            <Text className="text-ink-secondary text-[14px] leading-6">{report.description}</Text>
          </>
        )}

        <View className="h-px bg-border my-6" />

        <Text className="text-[17px] font-semibold text-ink mb-3">{t("reportDetail.reportedByLabel")}</Text>
        <View className="flex-row items-center">
          <Avatar uri={report.user?.avatar} name={`${report.user?.firstName ?? ""} ${report.user?.lastName ?? ""}`} size={44} />
          <View className="ml-3">
            <Text className="font-medium text-ink">
              {report.user?.firstName} {report.user?.lastName}
            </Text>
            <Text className="text-ink-muted text-[13px]">
              {new Date(report.date).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        <View className="mt-6" style={{ gap: 12 }}>
          {!isOwner && (
            <Button
              title={t("common.contact")}
              variant="outline"
              icon="chatbubble-outline"
              loading={contacting}
              onPress={contactReporter}
            />
          )}
          <Button title={t("common.share")} icon="share-outline" variant="ghost" onPress={() => shareReport(report)} />
          {isOwner && (
            <Button
              title={t("reportDetail.deleteReportButton")}
              variant="danger"
              icon="trash-outline"
              loading={deleting}
              onPress={deleteReport}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
