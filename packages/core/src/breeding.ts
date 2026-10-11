import { Boar } from "./boar";

export interface Breeding {
  id?: number;
  created_at?: string;
  updated_at?: string;
  sow_id: number;
  breed_date: string;
  expected_farrow_date: string;
  actual_farrow_date?: string;
  piglets_born_count?: number;
  piglets_male_born_alive?: number;
  piglets_female_born_alive?: number;
  piglets_born_dead?: number;
  boar_id: number | null;
  boars?: Boar;
  avg_weight?: number;
  is_aborted?: boolean;
}
