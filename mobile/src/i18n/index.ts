import { useCallback } from "react";
import { I18nManager } from "react-native";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { withTimeout } from "../utils/secureStorage";
import fr from "./locales/fr";
import en from "./locales/en";
import ar from "./locales/ar";
import ary from "./locales/ary";

export type Locale = "fr" | "en" | "ar" | "ary";

export const locales: { value: Locale; label: string; isRTL: boolean }[] = [
  { value: "fr", label: "Français", isRTL: false },
  { value: "en", label: "English", isRTL: false },
  { value: "ar", label: "العربية", isRTL: true },
  { value: "ary", label: "الدارجة التونسية", isRTL: true },
];

const dictionaries: Record<Locale, typeof fr> = { fr, en, ar, ary };

const STORAGE_KEY = "app-locale";

function detectDefaultLocale(): Locale {
  const tag = Localization.getLocales()[0]?.languageCode;
  if (tag === "ar") return "ar";
  if (tag === "en") return "en";
  return "fr";
}

function isRTL(locale: Locale) {
  return locales.find((l) => l.value === locale)?.isRTL ?? false;
}

interface LocaleState {
  locale: Locale;
  isReady: boolean;
  pendingRestart: boolean;
  restore: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: "fr",
  isReady: false,
  pendingRestart: false,

  restore: async () => {
    // Same rule as authStore/themeStore: the splash screen waits on
    // isReady, so a storage read failure here must not leave it stuck.
    try {
      const saved = (await withTimeout(AsyncStorage.getItem(STORAGE_KEY), 5000, null)) as Locale | null;
      const locale = saved && dictionaries[saved] ? saved : detectDefaultLocale();
      const rtl = isRTL(locale);
      // Align native layout direction on cold start, before any UI renders,
      // so RTL locales (ar/ary) don't briefly flash in LTR.
      if (I18nManager.isRTL !== rtl) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
      }
      set({ locale });
    } catch (error) {
      console.error("Locale restore failed:", error);
    } finally {
      set({ isReady: true });
    }
  },

  setLocale: async (locale) => {
    const rtl = isRTL(locale);
    const needsRestart = I18nManager.isRTL !== rtl;
    if (needsRestart) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
    await AsyncStorage.setItem(STORAGE_KEY, locale);
    set({ locale, pendingRestart: needsRestart });
  },
}));

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}

function getByPath(dict: typeof fr, path: string): string {
  const value = path.split(".").reduce<any>((acc, key) => acc?.[key], dict);
  return typeof value === "string" ? value : path;
}

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const isReady = useLocaleStore((state) => state.isReady);

  // Stable identity across renders while `locale` doesn't change, so
  // components that memoize on `t` (e.g. navigation options) don't
  // recompute — and re-trigger navigation state updates — every render.
  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      interpolate(getByPath(dictionaries[locale], path), vars),
    [locale]
  );

  return { t, locale, isRTL: isRTL(locale), isReady };
}
