import { Boar } from "./boar";
import { Breeding } from "./breeding";
import { Litter } from "./litter";
import { MedicalRecord } from "./medicalRecord";

export interface Sow {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  birth_date?: string;
  add_date?: string;
  is_available?: boolean;
  is_active?: boolean;
  breedings: Breeding[];
  medical_records: MedicalRecord[];
  litters?: Litter[];
  boars?: Boar[];
  user_id: string;
  breed_ids?: number[];
  breasts_count: number;
}
