import { Sow, Boar } from "@sowcycle/core";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "./auth";

const supabase = createClient();

export const getAllSows = async () => {
  const user = await getCurrentUser();
  try {
    const { data, error } = (await supabase
      .from("sows")
      .select("*, boars(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as {
      data: (Sow & { boars: Boar[] })[];
      error: any;
    };

    if (error) throw new Error(`Failed to fetch sows: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error fetching sows: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const getAllSowsWithLatestBreeding = async () => {
  const user = await getCurrentUser();
  try {
    const { data, error } = (await supabase
      .from("sows")
      .select(
        `*,
        breedings(*), 
        boars(*)
        `
      )
      .eq("user_id", user.id)
      .order("breed_date", { ascending: false, referencedTable: "breedings" })
      .order("created_at", { ascending: false })
      .limit(1, {
        foreignTable: "breedings",
      })) as {
      data: (Sow & { boars: Boar[] })[];
      error: any;
    };

    if (error) throw new Error(`Failed to fetch sows: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error fetching sows with latest breeding: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const getSowById = async (id: number) => {
  try {
    const { data, error } = (await supabase
      .from("sows")
      .select("*, boars(*)")
      .eq("id", id)
      .single()) as { data: Sow & { boars: Boar }; error: any };

    if (error) throw new Error(`Failed to fetch sow: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error fetching sow: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const getSowByIdWithAllInfo = async (id: number) => {
  const user = await getCurrentUser();
  try {
    const { data, error } = (await supabase
      .from("sows")
      .select(
        `*,
        breedings(*, boars(*)),
        medical_records(*, medicines(*)),
        litters(*),
        boars(*)
        `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .order("breed_date", { ascending: false, referencedTable: "breedings" })
      .single()) as { data: Sow & { boars: Boar[] }; error: any };

    if (error) throw new Error(`Failed to fetch sow: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error fetching sow: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const createSow = async (sow: Sow) => {
  const user = await getCurrentUser();
  try {
    const { data, error } = await supabase
      .from("sows")
      .insert([{ ...sow, user_id: user.id }])
      .select("*")
      .single();

    if (error) throw new Error(`Failed to create sow: ${error.message}`);

    const junctionRows = sow.breed_ids?.map((breedId) => ({
      sow_id: data.id,
      breed_id: breedId,
    }));

    // 3. Insert into junction table
    const { error: junctionError } = await supabase
      .from("sow_breeds")
      .insert(junctionRows);

    if (junctionError) throw junctionError;

    // 4. Return the created sow using getSowById
    const updatedData = await getSowById(data.id);

    return updatedData;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error creating sow: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const updateSow = async (sow: Sow) => {
  try {
    const { data, error } = await supabase
      .from("sows")
      .update([sow])
      .eq("id", sow.id)
      .select("*, boars(*)")
      .single();

    if (error) throw new Error(`Failed to update sow: ${error.message}`);

    await updateSowBreeds(sow.id, sow.breed_ids || []);

    const updatedData = await getSowById(data.id);

    return updatedData;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error updating sow: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const updateSowBreeds = async (sowId: number, breedIds: number[]) => {
  // 1. Delete all existing links for this sow
  const { error: deleteError } = await supabase
    .from("sow_breeds")
    .delete()
    .eq("sow_id", sowId);

  if (deleteError) throw deleteError;

  // 2. Insert the new set of links
  const junctionRows = breedIds.map((breedId) => ({
    sow_id: sowId,
    breed_id: breedId,
  }));

  const { error: insertError } = await supabase
    .from("sow_breeds")
    .insert(junctionRows);

  if (insertError) throw insertError;
};

export const deleteSow = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from("sows")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw new Error(`Failed to delete sow: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error deleting sow: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const patchSow = async (sow: Partial<Sow>) => {
  try {
    const { data, error } = await supabase
      .from("sows")
      .update(sow)
      .eq("id", sow.id)
      .select(
        `
        *,
        breedings(*),
        boars(*)
      `
      )
      .order("breed_date", { ascending: false, referencedTable: "breedings" })
      .limit(1, {
        foreignTable: "breedings",
      })
      .single();

    if (error) throw new Error(`Failed to patch sow: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error patching sow: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};
