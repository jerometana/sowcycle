import { Breeding } from "@sowcycle/core";
import { create } from "zustand";

interface BreedingState {
  breedings: Breeding[];
  editingBreeding: Breeding | null;
  setBreedings: (breedings: Breeding[]) => void;
  setEditingBreeding: (breeding: Breeding | null) => void;
  updateBreeding: (breeding: Breeding) => void;
  addBreeding: (breeding: Breeding) => void;
  removeBreeding: (id: number) => void;
}

export const useBreedingStore = create<BreedingState>((set) => ({
  breedings: [],
  editingBreeding: null,
  setBreedings: (breedings: Breeding[]) => set({ breedings }),
  setEditingBreeding: (breeding: Breeding | null) =>
    set({ editingBreeding: breeding }),
  updateBreeding: (breeding: Breeding) =>
    set((state) => ({
      breedings: state.breedings.map((b) =>
        b.id === breeding.id ? breeding : b
      ),
    })),
  addBreeding: (breeding: Breeding) =>
    set((state) => ({ breedings: [breeding, ...state.breedings] })),
  removeBreeding: (id: number) =>
    set((state) => ({
      breedings: state.breedings.filter((breeding) => breeding.id !== id),
    })),
}));
