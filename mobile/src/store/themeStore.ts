import { Appearance } from "react-native";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, colors as mutableColors } from "../constants/theme";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedMode = "light" | "dark";

const STORAGE_KEY = "theme-mode";

interface ThemeState {
  mode: ThemeMode;
  systemScheme: ResolvedMode;
  isReady: boolean;
  restore: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

function applyColors(resolved: ResolvedMode) {
  Object.assign(mutableColors, resolved === "dark" ? darkColors : lightColors);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "system",
  systemScheme: Appearance.getColorScheme() === "dark" ? "dark" : "light",
  isReady: false,

  restore: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        set({ mode: saved });
      }
    } finally {
      const { mode, systemScheme } = get();
      applyColors(mode === "system" ? systemScheme : mode);
      set({ isReady: true });
    }
  },

  setMode: async (mode) => {
    set({ mode });
    const resolved = mode === "system" ? get().systemScheme : mode;
    applyColors(resolved);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  },
}));

Appearance.addChangeListener(({ colorScheme }) => {
  const resolvedSystem: ResolvedMode = colorScheme === "dark" ? "dark" : "light";
  useThemeStore.setState({ systemScheme: resolvedSystem });
  if (useThemeStore.getState().mode === "system") {
    applyColors(resolvedSystem);
  }
});

export function useResolvedTheme(): ResolvedMode {
  const mode = useThemeStore((state) => state.mode);
  const systemScheme = useThemeStore((state) => state.systemScheme);
  return mode === "system" ? systemScheme : mode;
}

// Reactive palette for use inside components (icons, inline styles). Any
// component calling this hook re-renders when the resolved theme changes,
// regardless of where it sits in the navigation stack.
export function useThemeColors() {
  const resolved = useResolvedTheme();
  return resolved === "dark" ? darkColors : lightColors;
}

// Maps the palette to the CSS custom-property names referenced by
// tailwind.config.js, so every `bg-surface` / `text-ink` / etc. class
// resolves to the right color without any per-screen className changes.
export function paletteToCssVars(palette: typeof lightColors) {
  return {
    "--color-primary": palette.primary,
    "--color-primary-hover": palette.primaryHover,
    "--color-primary-light": palette.primaryLight,
    "--color-primary-dark": palette.primaryDark,
    "--color-primary-soft": palette.primarySoft,
    "--color-secondary": palette.secondary,
    "--color-secondary-hover": palette.secondaryHover,
    "--color-secondary-light": palette.secondaryLight,
    "--color-secondary-soft": palette.secondarySoft,
    "--color-accent": palette.accent,
    "--color-background": palette.background,
    "--color-surface": palette.surface,
    "--color-border": palette.border,
    "--color-border-strong": palette.borderStrong,
    "--color-ink": palette.text,
    "--color-ink-secondary": palette.textSecondary,
    "--color-ink-muted": palette.textMuted,
    "--color-success": palette.success,
    "--color-success-soft": palette.successSoft,
    "--color-warning": palette.warning,
    "--color-warning-soft": palette.warningSoft,
    "--color-error": palette.error,
    "--color-error-soft": palette.errorSoft,
    "--color-info": palette.info,
    "--color-info-soft": palette.infoSoft,
  };
}
