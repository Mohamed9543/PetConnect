import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../store/themeStore";
import { useTranslation } from "../../i18n";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  isPassword,
  secureTextEntry,
  editable = true,
  multiline,
  numberOfLines,
  ...inputProps
}: InputProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(!!secureTextEntry || !!isPassword);

  const borderColor = error ? colors.error : isFocused ? colors.primary : colors.border;
  const minHeight = multiline ? Math.max(90, (numberOfLines ?? 4) * 22) : 50;

  return (
    <View className="mb-4">
      {label && <Text className="text-ink-secondary text-[13px] font-semibold mb-1.5">{label}</Text>}

      <View
        className={`flex-row rounded-sm bg-surface px-3.5 ${
          multiline ? "items-start py-3" : "items-center"
        } ${!editable ? "opacity-60" : ""}`}
        style={{ borderWidth: 1.5, borderColor, minHeight }}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={colors.textMuted}
            style={{ marginRight: 8, marginTop: multiline ? 2 : 0 }}
          />
        )}
        <TextInput
          {...inputProps}
          editable={editable}
          secureTextEntry={isSecure}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
          className="flex-1 text-[15px] text-ink"
          style={{
            paddingVertical: 0,
            textAlignVertical: multiline ? "top" : "center",
            color: colors.text,
            // RN Web adds its own focus ring on top of our custom border —
            // suppress it so only the borderColor above is visible.
            outlineStyle: "none",
            outlineWidth: 0,
          }}
        />
        {(secureTextEntry || isPassword) && (
          <Pressable
            onPress={() => setIsSecure((prev) => !prev)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? t("common.showPassword") : t("common.hidePassword")}
          >
            <Ionicons name={isSecure ? "eye-outline" : "eye-off-outline"} size={19} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {error ? (
        <Text className="text-error text-[12px] mt-1.5">{error}</Text>
      ) : helperText ? (
        <Text className="text-ink-muted text-[12px] mt-1.5">{helperText}</Text>
      ) : null}
    </View>
  );
}
