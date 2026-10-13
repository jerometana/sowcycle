import { expectedFarrowDate, saleableDate } from "@sowcycle/core";
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

type AbortableQuery = {
  abortSignal: (signal: AbortSignal) => PromiseLike<{ error: unknown }>;
};

const runWrite = async (query: AbortableQuery) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);
  try {
    const { error } = await query.abortSignal(controller.signal);
    if (controller.signal.aborted) throw new SaveTimeoutError();
    if (error) throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const recordBreeding = (input: BreedingInput) =>
  runWrite(
    supabase.rpc("record_breeding", {
      p_sow_id: Number(input.sowId),
      p_boar_id: input.boarId === null ? null : Number(input.boarId),
      p_breed_date: input.breedDate.toISOString(),
      p_expected_farrow_date: expectedFarrowDate(input.breedDate).toISOString(),
    })
  );

export const recordFarrow = (input: FarrowInput) =>
  runWrite(
    supabase.rpc("record_farrow", {
      p_breeding_id: Number(input.breedingId),
      p_farrow_date: input.farrowDate.toISOString(),
      p_male_born_alive: input.isAborted ? 0 : input.maleBornAlive,
      p_female_born_alive: input.isAborted ? 0 : input.femaleBornAlive,
      p_born_dead: input.isAborted ? 0 : input.bornDead,
      p_avg_weight: input.isAborted ? null : input.avgWeight,
      p_is_aborted: input.isAborted,
    })
  );

export const startFattening = (litterId: string, fatteningAt: Date) =>
  runWrite(
    supabase
      .from("litters")
      .update({
        fattening_at: fatteningAt.toISOString(),
        saleable_at: saleableDate(fatteningAt).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(litterId))
  );

export type LitterInput = {
  birthDate: Date;
  male: number;
  female: number;
  fatteningAt: Date | null;
  soldAt: Date | null;
  avgWeight: number | null;
};

// Mirrors the web's litter edit: the total follows the two counts, and the sale due date follows fattening.
export const updateLitter = (litterId: string, input: LitterInput) =>
  runWrite(
    supabase
      .from("litters")
      .update({
        birth_date: input.birthDate.toISOString(),
        piglets_male_born_alive: input.male,
        piglets_female_born_alive: input.female,
        piglets_born_count: input.male + input.female,
        fattening_at: input.fatteningAt?.toISOString() ?? null,
        saleable_at: input.fatteningAt ? saleableDate(input.fatteningAt).toISOString() : null,
        sold_at: input.soldAt?.toISOString() ?? null,
        avg_weight: input.avgWeight,
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(litterId))
  );

export const deleteLitter = (litterId: string) => runWrite(supabase.from("litters").delete().eq("id", Number(litterId)));

export const recordSale = (litterId: string, soldAt: Date, avgWeight: number | null) =>
  runWrite(
    supabase
      .from("litters")
      .update({
        sold_at: soldAt.toISOString(),
        ...(avgWeight === null ? {} : { avg_weight: avgWeight }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(litterId))
  );

const isConflict = (e: unknown): e is { message: string } =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "SC409";

// Only idempotent writes (the RPCs and updates by id) can promise that a retry will not duplicate.
export const saveErrorMessage = (e: unknown, retrySafe = true) => {
  if (e instanceof SaveTimeoutError) {
    return retrySafe
      ? "สัญญาณไม่พอ กดบันทึกอีกครั้งได้ ข้อมูลจะไม่ซ้ำ"
      : "สัญญาณไม่พอ ตรวจดูรายการก่อนกดบันทึกอีกครั้ง อาจบันทึกไปแล้ว";
  }
  if (isConflict(e)) return e.message;
  return "บันทึกไม่สำเร็จ ลองอีกครั้ง";
};

export type BoarInput = { breed: string; description: string };

export const createBoar = async (input: BoarInput) => {
  const { data } = await supabase.auth.getSession();
  return runWrite(supabase.from("boars").insert({ ...input, user_id: data.session?.user.id }));
};

export const updateBoar = (id: string, input: BoarInput) =>
  runWrite(supabase.from("boars").update({ ...input, updated_at: new Date().toISOString() }).eq("id", Number(id)));

export const deleteBoar = (id: string) => runWrite(supabase.from("boars").delete().eq("id", Number(id)));

export type SowInput = {
  name: string;
  breasts_count: number | null;
  birth_date: string | null;
  add_date: string | null;
  is_active: boolean;
};

export const createSow = async (input: SowInput) => {
  const { data } = await supabase.auth.getSession();
  return runWrite(supabase.from("sows").insert({ ...input, user_id: data.session?.user.id }));
};

export const updateSow = (id: string, input: SowInput) =>
  runWrite(supabase.from("sows").update({ ...input, updated_at: new Date().toISOString() }).eq("id", Number(id)));

// The database cascades this to the sow's breedings, litters, treatments and breed links.
export const deleteSow = (id: string) => runWrite(supabase.from("sows").delete().eq("id", Number(id)));

export type MedicineInput = { title: string; description: string; stock_count: number };

export const createMedicine = async (input: MedicineInput) => {
  const { data } = await supabase.auth.getSession();
  return runWrite(supabase.from("medicines").insert({ ...input, user_id: data.session?.user.id }));
};

export const updateMedicine = (id: string, input: MedicineInput) =>
  runWrite(supabase.from("medicines").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id));

export const deleteMedicine = (id: string) => runWrite(supabase.from("medicines").delete().eq("id", id));

export type TreatmentInput = {
  sowId: string;
  medicineId: string;
  usedAt: Date;
  symptoms: string;
  notes: string;
};

export const recordTreatment = (input: TreatmentInput) =>
  runWrite(
    supabase.from("medical_records").insert({
      sow_id: Number(input.sowId),
      medicine_id: input.medicineId,
      used_at: input.usedAt.toISOString(),
      symptoms: input.symptoms,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
  );

export const deleteTreatment = (id: string) =>
  runWrite(supabase.from("medical_records").delete().eq("id", Number(id)));
