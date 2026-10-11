import { z } from "zod";

export const newBreedingFormSchema = z.object({
  sow_id: z.string(),
  boar_id: z.number().nullable(),
  breed_date: z.date({ required_error: "กรุณาเลือกวันที่" }),
});

export const farrowFormSchema = z.object({
  breed_date: z.date({ required_error: "กรุณาเลือกวันที่" }),
  actual_farrow_date: z.date(),
  piglets_male_born_alive: z.coerce.number().nonnegative(),
  piglets_female_born_alive: z.coerce.number().nonnegative(),
  piglets_born_dead: z.coerce.number().nonnegative(),
  avg_weight: z.coerce.number().nonnegative().optional(),
  is_aborted: z.boolean(),
});

export type NewBreedingFormData = z.infer<typeof newBreedingFormSchema>;
export type FarrowFormData = z.infer<typeof farrowFormSchema>;