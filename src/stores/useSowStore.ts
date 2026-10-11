import { Sow } from "@sowcycle/core";
import { create } from "zustand";

interface SowState {
  sows: Sow[];
  sow: Sow;
  setSows: (sows: Sow[]) => void;
  setSow: (sow: Sow) => void;
  updateSow: (sow: Sow) => void;
  addSow: (sow: Sow) => void;
  removeSow: (id: number) => void;
}

export const useSowStore = create<SowState>((set) => ({
  sows: [],
  sow: {} as Sow,
  setSows: (sows: Sow[]) => set({ sows }),
  setSow: (sow: Sow) => set({ sow }),
  updateSow: (sow: Sow) =>
    set((state) => ({
      sow,
      sows: state.sows.map((s) => (s.id === sow.id ? sow : s)),
    })),
  addSow: (sow: Sow) => set((state) => ({ sows: [sow, ...state.sows] })),
  removeSow: (id: number) =>
    set((state) => ({
      sows: state.sows.filter((sow) => sow.id !== id),
    })),
}));
