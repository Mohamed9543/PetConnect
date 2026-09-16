import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";
import { secureStorage, withTimeout } from "../utils/secureStorage";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isReady: false,

  restore: async () => {
    // The splash screen stays up until isReady flips true (see
    // app/_layout.tsx), so any failure here — a corrupt stored value, a
    // SecureStore/Keystore hiccup on a particular device — must never leave
    // the app stuck behind the splash screen forever.
    try {
      const token = await secureStorage.getItem("token");
      const userJson = await withTimeout(AsyncStorage.getItem("user"), 5000, null);
      if (token && userJson) {
        set({ user: JSON.parse(userJson) });
      }
    } catch (error) {
      console.error("Auth restore failed:", error);
    } finally {
      set({ isReady: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await secureStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data));
      set({ user: data });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/google", { idToken });
      await secureStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data));
      set({ user: data });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/register", payload);
      await secureStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data));
      set({ user: data });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await secureStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({ user: null });
  },

  setUser: async (user) => {
    // Merge onto the current user so we never drop the auth token, which
    // profile-update responses from the API don't include.
    const merged = { ...get().user, ...user };
    await AsyncStorage.setItem("user", JSON.stringify(merged));
    set({ user: merged });
  },
}));
