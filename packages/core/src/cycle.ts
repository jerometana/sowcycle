import { addDays } from "date-fns";
import { Breeding } from "./breeding";
import { Litter } from "./litter";

export const PREGNANCY_DAYS = 114;
export const FATTENING_DAYS = 145;
export const PREGNANCY_CHECK_DAYS = [21, 42] as const;

export const expectedFarrowDate = (breedDate: Date) =>
  addDays(breedDate, PREGNANCY_DAYS);

export const saleableDate = (fatteningAt: Date) =>
  addDays(fatteningAt, FATTENING_DAYS);

export const pregnancyCheckDates = (breedDate: Date) =>
  PREGNANCY_CHECK_DAYS.map((days) => addDays(breedDate, days));

export type BreedingStage = "pregnant" | "aborted" | "farrowed";

export const breedingStage = (
  breeding: Pick<Breeding, "actual_farrow_date" | "is_aborted">
): BreedingStage => {
  if (breeding.is_aborted) return "aborted";
  if (breeding.actual_farrow_date) return "farrowed";
  return "pregnant";
};

export const countsTowardLitterStats = (
  breeding: Pick<
    Breeding,
    "actual_farrow_date" | "is_aborted" | "piglets_born_count"
  >
) =>
  breedingStage(breeding) === "farrowed" &&
  breeding.piglets_born_count !== null;

export type LitterStage = "nursing" | "fattening" | "sold";

export const litterStage = (
  litter: Pick<Litter, "fattening_at" | "sold_at">
): LitterStage => {
  if (litter.sold_at) return "sold";
  if (litter.fattening_at) return "fattening";
  return "nursing";
};
