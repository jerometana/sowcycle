import { Boar } from "./boar";
import { Sow } from "./sow";

export interface Litter {
  id?: number;
  created_at?: string;
  updated_at?: string;
  sow_id: number;
  sows?: Sow;
  birth_date?: string;
  piglets_born_count?: number;
  piglets_male_born_alive?: number;
  piglets_female_born_alive?: number;
  boar_id?: number;
  boars?: Boar;
  avg_weight?: number;
  fattening_at?: string | null;
  saleable_at?: string | null;
  sold_at?: string | null;
}
