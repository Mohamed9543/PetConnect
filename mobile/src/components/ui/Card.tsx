import { Pressable, View, type PressableProps, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  onPress?: PressableProps["onPress"];
  padded?: boolean;
}

export function Card({ onPress, padded = true, className = "", children, ...rest }: CardProps) {
  const base = `bg-surface rounded-lg border border-border ${padded ? "p-4" : ""} ${className}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={base} accessibilityRole="button">
        {children}
      </Pressable>
    );
  }

  return (
    <View className={base} {...rest}>
      {children}
    </View>
  );
}
