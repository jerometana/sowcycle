import { Litter } from "@sowcycle/core";
import { create } from "zustand";

interface LitterState {
  litters: Litter[];
  editingLitter: Litter | null;
  setLitters: (litters: Litter[]) => void;
  setEditingLitter: (litter: Litter | null) => void;
  updateLitter: (litter: Litter) => void;
  addLitter: (litter: Litter) => void;
  removeLitter: (id: number) => void;
}

export const useLitterStore = create<LitterState>((set) => ({
  litters: [],
  editingLitter: null,
  setLitters: (litters: Litter[]) => set({ litters }),
  setEditingLitter: (litter: Litter | null) =>
    set({ editingLitter: litter }),
  updateLitter: (litter: Litter) =>
    set((state) => ({
      litters: state.litters.map((b) =>
        b.id === litter.id ? litter : b
      ),
    })),
  addLitter: (litter: Litter) =>
    set((state) => ({ litters: [litter, ...state.litters] })),
  removeLitter: (id: number) =>
    set((state) => ({
      litters: state.litters.filter((litter) => litter.id !== id),
    })),
}));
