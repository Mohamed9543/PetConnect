import { create } from "zustand";

export interface ActionSheetOption {
  label: string;
  onPress?: () => void;
  style?: "default" | "destructive" | "cancel";
}

interface ActionSheetConfig {
  title?: string;
  message?: string;
  options: ActionSheetOption[];
}

interface ActionSheetState {
  config: ActionSheetConfig | null;
  show: (config: ActionSheetConfig) => void;
  hide: () => void;
}

// Alert.alert() with 2+ buttons is unreliable on react-native-web (no
// dialog appears at all in some RNW versions), which silently breaks every
// destructive-confirmation and action-menu flow when the app runs in a
// browser. This in-app action sheet replaces those call sites so the same
// code works identically on web and native.
export const useActionSheetStore = create<ActionSheetState>((set) => ({
  config: null,
  show: (config) => set({ config }),
  hide: () => set({ config: null }),
}));

export function showActionSheet(config: ActionSheetConfig) {
  useActionSheetStore.getState().show(config);
}

// Promise-based yes/no confirm, for the common two-button case.
export function confirmAsync(title: string, message?: string, confirmLabel = "Confirmer"): Promise<boolean> {
  return new Promise((resolve) => {
    showActionSheet({
      title,
      message,
      options: [
        { label: "Annuler", style: "cancel", onPress: () => resolve(false) },
        { label: confirmLabel, style: "destructive", onPress: () => resolve(true) },
      ],
    });
  });
}
