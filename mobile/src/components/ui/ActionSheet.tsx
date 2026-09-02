import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActionSheetStore, type ActionSheetOption } from "../../store/actionSheetStore";

function optionTextClass(style: ActionSheetOption["style"]) {
  if (style === "destructive") return "text-error";
  if (style === "cancel") return "text-ink-secondary";
  return "text-primary";
}

export function ActionSheetHost() {
  const insets = useSafeAreaInsets();
  const config = useActionSheetStore((state) => state.config);
  const hide = useActionSheetStore((state) => state.hide);

  if (!config) return null;

  const dismiss = () => {
    const cancelOption = config.options.find((o) => o.style === "cancel");
    hide();
    cancelOption?.onPress?.();
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <Pressable
        onPress={dismiss}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-surface rounded-t-xl"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          {(config.title || config.message) && (
            <View className="px-5 pt-5 pb-3 border-b border-border items-center">
              {config.title && (
                <Text className="text-ink text-[15px] font-semibold text-center">{config.title}</Text>
              )}
              {config.message && (
                <Text className="text-ink-secondary text-[13px] text-center mt-1">{config.message}</Text>
              )}
            </View>
          )}

          {config.options.map((option, i) => (
            <Pressable
              key={`${option.label}-${i}`}
              onPress={() => {
                hide();
                option.onPress?.();
              }}
              accessibilityRole="button"
              className={`px-5 h-14 items-center justify-center ${
                i !== config.options.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <Text className={`text-[15px] font-medium ${optionTextClass(option.style)}`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
