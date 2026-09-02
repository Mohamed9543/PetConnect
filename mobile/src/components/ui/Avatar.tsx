import { Text, View } from "react-native";
import { Image } from "expo-image";
import { useThemeColors } from "../../store/themeStore";
import { useTranslation } from "../../i18n";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("");
}

export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (uri) {
    return (
      <Image
        source={uri}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.background }}
        contentFit="cover"
        accessibilityLabel={name ? t("common.profilePictureOf", { name }) : t("common.profilePicture")}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }}
      className="items-center justify-center"
      accessibilityLabel={name ? t("common.initialsOf", { name }) : undefined}
    >
      <Text style={{ fontSize: size * 0.38, color: colors.primary }} className="font-bold">
        {getInitials(name)}
      </Text>
    </View>
  );
}
