export const lightColors = {
  primary: "#2E7D32",
  primaryHover: "#256428",
  primaryLight: "#4CAF50",
  primaryDark: "#1B5E20",
  primarySoft: "#E8F3E9",

  secondary: "#F57C00",
  secondaryHover: "#D96C00",
  secondaryLight: "#FFB74D",
  secondarySoft: "#FFF1DE",

  accent: "#FFB74D",

  background: "#F7F8F7",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",

  text: "#1A1D1A",
  textSecondary: "#5B625B",
  textMuted: "#9AA39A",

  border: "#E4E7E3",
  borderStrong: "#CBD1CB",

  success: "#2E7D32",
  successSoft: "#E8F3E9",
  warning: "#B8860B",
  warningSoft: "#FBF3DC",
  error: "#C62828",
  errorSoft: "#FBEAEA",
  info: "#1565C0",
  infoSoft: "#E7F0FA",

  white: "#FFFFFF",
  black: "#000000",

  // Legacy aliases kept for backward compatibility with existing screens.
  gray: "#9AA39A",
  danger: "#C62828",
};

export const darkColors: typeof lightColors = {
  primary: "#4CAF50",
  primaryHover: "#5DBB61",
  primaryLight: "#66BB6A",
  primaryDark: "#2E7D32",
  primarySoft: "#1E2E20",

  secondary: "#FFA733",
  secondaryHover: "#FFB74D",
  secondaryLight: "#FFCC80",
  secondarySoft: "#3A2814",

  accent: "#FFCC80",

  background: "#10140F",
  surface: "#171C15",
  surfaceElevated: "#1D231A",

  text: "#ECEEE9",
  textSecondary: "#B7BDAE",
  textMuted: "#7C8574",

  border: "#2A3025",
  borderStrong: "#3B4234",

  success: "#4CAF50",
  successSoft: "#1E2E20",
  warning: "#E0A63A",
  warningSoft: "#332907",
  error: "#EF5350",
  errorSoft: "#3A1D1C",
  info: "#64B5F6",
  infoSoft: "#14263A",

  white: "#FFFFFF",
  black: "#000000",

  gray: "#7C8574",
  danger: "#EF5350",
};

// Mutable, theme-aware default export. Kept for the handful of call sites
// that read colors outside of component render (module-scope maps); inside
// components, prefer the reactive `useThemeColors()` hook from themeStore.
export const colors = { ...lightColors };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  button: { fontSize: 15, lineHeight: 20, fontWeight: "600" as const },
};

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

export const touchTarget = 44;
