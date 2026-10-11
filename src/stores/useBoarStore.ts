import { Boar } from "@sowcycle/core";
import { create } from "zustand";

interface BoarState {
  boars: Boar[];
  boar: Boar;
  setBoars: (boars: Boar[]) => void;
  setBoar: (boar: Boar) => void;
  updateBoar: (boar: Boar) => void;
  addBoar: (boar: Boar) => void;
  removeBoar: (id: number) => void;
}

export const useBoarStore = create<BoarState>((set) => ({
  boars: [],
  boar: {} as Boar,
  setBoars: (boars: Boar[]) => set({ boars }),
  setBoar: (boar: Boar) => set({ boar }),
  updateBoar: (boar: Boar) =>
    set((state) => ({
      boar,
      boars: state.boars.map((s) => (s.id === boar.id ? boar : s)),
    })),
  addBoar: (boar: Boar) => set((state) => ({ boars: [boar, ...state.boars] })),
  removeBoar: (id: number) =>
    set((state) => ({
      boars: state.boars.filter((boar) => boar.id !== id),
    })),
}));
