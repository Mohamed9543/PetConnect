import { Text, View } from "react-native";

export type BadgeVariant = "neutral" | "primary" | "secondary" | "success" | "warning" | "error" | "info";

const containerClasses: Record<BadgeVariant, string> = {
  neutral: "bg-background",
  primary: "bg-primary-soft",
  secondary: "bg-secondary-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  error: "bg-error-soft",
  info: "bg-info-soft",
};

const textClasses: Record<BadgeVariant, string> = {
  neutral: "text-ink-secondary",
  primary: "text-primary",
  secondary: "text-secondary",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
  info: "text-info",
};

export function Badge({ label, variant = "neutral" }: { label: string; variant?: BadgeVariant }) {
  return (
    <View className={`${containerClasses[variant]} px-2.5 py-1 rounded-sm self-start`}>
      <Text className={`${textClasses[variant]} text-[12px] font-medium`}>{label}</Text>
    </View>
  );
}
