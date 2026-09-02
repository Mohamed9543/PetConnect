import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "hidden-conversations";

interface HiddenConversationsState {
  hiddenAt: Record<string, string>;
  isLoaded: boolean;
  load: () => Promise<void>;
  hide: (conversationId: string) => Promise<void>;
  isHidden: (conversationId: string, lastMessageAt: string) => boolean;
}

// "Delete" a conversation locally: it's hidden client-side only. If the other
// participant sends a new message afterwards, it reappears — matching what
// was asked for ("supprimer localement lorsque pertinent"), not a real delete.
export const useHiddenConversationsStore = create<HiddenConversationsState>((set, get) => ({
  hiddenAt: {},
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      set({ hiddenAt: raw ? JSON.parse(raw) : {}, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  hide: async (conversationId) => {
    const next = { ...get().hiddenAt, [conversationId]: new Date().toISOString() };
    set({ hiddenAt: next });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // best-effort persistence; the in-memory hide still applies this session
    }
  },

  isHidden: (conversationId, lastMessageAt) => {
    const hiddenAt = get().hiddenAt[conversationId];
    if (!hiddenAt) return false;
    return new Date(lastMessageAt).getTime() <= new Date(hiddenAt).getTime();
  },
}));
