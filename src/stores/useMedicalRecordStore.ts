import { MedicalRecord } from "@sowcycle/core";
import { create } from "zustand";

interface MedicalRecordState {
  medicalRecords: MedicalRecord[];
  editingMedicalRecord: MedicalRecord | null;
  setMedicalRecords: (medicalRecords: MedicalRecord[]) => void;
  setEditingMedicalRecord: (medicalRecord: MedicalRecord | null) => void;
  updateMedicalRecord: (medicalRecord: MedicalRecord) => void;
  addMedicalRecord: (medicalRecord: MedicalRecord) => void;
  removeMedicalRecord: (id: number) => void;
}

export const useMedicalRecordStore = create<MedicalRecordState>((set) => ({
  medicalRecords: [],
  editingMedicalRecord: null,
  setMedicalRecords: (medicalRecords: MedicalRecord[]) =>
    set({ medicalRecords }),
  setEditingMedicalRecord: (medicalRecord: MedicalRecord | null) =>
    set({ editingMedicalRecord: medicalRecord }),
  updateMedicalRecord: (medicalRecord: MedicalRecord) =>
    set((state) => ({
      medicalRecords: state.medicalRecords.map((m) =>
        m.id === medicalRecord.id ? medicalRecord : m
      ),
    })),
  addMedicalRecord: (medicalRecord: MedicalRecord) =>
    set((state) => ({
      medicalRecords: [medicalRecord, ...state.medicalRecords],
    })),
  removeMedicalRecord: (id: number) =>
    set((state) => ({
      medicalRecords: state.medicalRecords.filter(
        (medicalRecord) => medicalRecord.id !== id
      ),
    })),
}));
