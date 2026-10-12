export interface MedicalRecord {
  id?: number;
  created_at?: string;
  updated_at?: string;
  sow_id: number;
  symptoms?: string;
  medicine?: string;
  used_at: string;
  medicine_id: string;
  notes: string;
}
