import { z } from "zod";

export const litterFormSchema = z.object({
  birth_date: z.date(),
  piglets_male_born_alive: z.coerce.number().nonnegative(),
  piglets_female_born_alive: z.coerce.number().nonnegative(),
  avg_weight: z.coerce.number().nonnegative().optional(),
  fattening_at: z.date().optional().nullable(),
  sold_at: z.date().optional().nullable(),
});

export type LitterFormData = z.infer<typeof litterFormSchema>;