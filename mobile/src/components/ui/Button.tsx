import { ActivityIndicator, Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../store/themeStore";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Plain Tailwind classes only — no NativeWind `active:` variant. On web,
// react-native-css-interop implements `:active` by attaching its own
// pointer listeners to the node, which race with react-native-web's own
// Pressable press-responder and can silently swallow mouse clicks
// (keyboard activation still worked, which is what exposed this). Pressed
// feedback below is done natively via Pressable's style-function instead.
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  outline: "bg-transparent border border-primary",
  ghost: "bg-transparent",
  danger: "bg-transparent border border-error",
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-primary",
  ghost: "text-primary",
  danger: "text-error",
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
  ...pressableProps
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const height = size === "sm" ? "h-10" : "h-[52px]";

  const accentColor: Record<ButtonVariant, string> = {
    primary: colors.white,
    secondary: colors.white,
    outline: colors.primary,
    ghost: colors.primary,
    danger: colors.error,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`${height} ${fullWidth ? "w-full" : ""} rounded-md items-center justify-center flex-row px-5 ${
        variantClasses[variant]
      } ${isDisabled ? "opacity-50" : ""}`}
      style={style}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={accentColor[variant]} size="small" />
      ) : (
        <View className="flex-row items-center">
          {icon && (
            <Ionicons name={icon} size={18} color={accentColor[variant]} style={{ marginRight: 8 }} />
          )}
          <Text className={`${textVariantClasses[variant]} text-[15px] font-semibold`}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
