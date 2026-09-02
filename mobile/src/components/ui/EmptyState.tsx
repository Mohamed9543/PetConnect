import { Text, View } from "react-native";
import { Button } from "./Button";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = "🐾", title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-8 py-12">
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <Text className="text-ink text-[17px] font-semibold mt-4 text-center">{title}</Text>
      {description && (
        <Text className="text-ink-secondary text-[14px] mt-2 text-center leading-5">{description}</Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-5 w-full max-w-[220px]">
          <Button title={actionLabel} variant="outline" size="sm" onPress={onAction} />
        </View>
      )}
    </View>
  );
}
