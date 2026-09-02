import { create } from "zustand";
import { api } from "../api/client";

interface FavoritesState {
  ids: Set<string>;
  isLoaded: boolean;
  load: () => Promise<void>;
  isFavorite: (animalId: string) => boolean;
  toggle: (animalId: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  isLoaded: false,

  load: async () => {
    try {
      const { data } = await api.get("/favorites");
      set({ ids: new Set(data.map((animal: { _id: string }) => animal._id)), isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  isFavorite: (animalId) => get().ids.has(animalId),

  toggle: async (animalId) => {
    const current = get().ids;
    const wasFavorite = current.has(animalId);
    const next = new Set(current);
    if (wasFavorite) next.delete(animalId);
    else next.add(animalId);
    set({ ids: next });

    try {
      if (wasFavorite) {
        await api.delete(`/favorites/${animalId}`);
      } else {
        await api.post(`/favorites/${animalId}`);
      }
    } catch (error) {
      set({ ids: current });
      throw error;
    }
  },
}));
