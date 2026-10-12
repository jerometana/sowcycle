import { expectedFarrowDate } from "@sowcycle/core";
import { supabase } from "../lib/supabase";

export type BreedingInput = {
  sowId: string;
  boarId: string | null;
  breedDate: Date;
};

export type FarrowInput = {
  breedingId: string;
  farrowDate: Date;
  maleBornAlive: number;
  femaleBornAlive: number;
  bornDead: number;
  avgWeight: number | null;
  isAborted: boolean;
};

export class SaveTimeoutError extends Error {}

const SAVE_TIMEOUT_MS = 15_000;

const callRpc = async (fn: string, args: Record<string, unknown>) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);
  try {
    const { error } = await supabase.rpc(fn, args).abortSignal(controller.signal);
    if (controller.signal.aborted) throw new SaveTimeoutError();
    if (error) throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const recordBreeding = (input: BreedingInput) =>
  callRpc("record_breeding", {
    p_sow_id: Number(input.sowId),
    p_boar_id: input.boarId === null ? null : Number(input.boarId),
    p_breed_date: input.breedDate.toISOString(),
    p_expected_farrow_date: expectedFarrowDate(input.breedDate).toISOString(),
  });

export const recordFarrow = (input: FarrowInput) =>
  callRpc("record_farrow", {
    p_breeding_id: Number(input.breedingId),
    p_farrow_date: input.farrowDate.toISOString(),
    p_male_born_alive: input.isAborted ? 0 : input.maleBornAlive,
    p_female_born_alive: input.isAborted ? 0 : input.femaleBornAlive,
    p_born_dead: input.isAborted ? 0 : input.bornDead,
    p_avg_weight: input.isAborted ? null : input.avgWeight,
    p_is_aborted: input.isAborted,
  });

const isConflict = (e: unknown): e is { message: string } =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "SC409";

export const saveErrorMessage = (e: unknown) => {
  if (e instanceof SaveTimeoutError) return "สัญญาณไม่พอ กดบันทึกอีกครั้งได้ ข้อมูลจะไม่ซ้ำ";
  if (isConflict(e)) return e.message;
  return "บันทึกไม่สำเร็จ ลองอีกครั้ง";
};
