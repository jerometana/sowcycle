import { Breeding, Boar, Sow } from "@sowcycle/core";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "./auth";

const supabase = createClient();

export const getAllBreedings = async () => {
  const user = await getCurrentUser();
  // get from sows that owned by current user
  const { data, error } = (await supabase
    .from("breedings")
    .select(
      `
      *,
      boars(*),
      sows!inner(*, boars(*))
    `
    )
    .eq("sows.user_id", user.id)
    .order("expected_farrow_date", { ascending: true })) as {
    data: (Breeding & { boars: Boar; sows: Sow & { boars: Boar[] } })[];
    error: any;
  };

  if (error) throw new Error(`Failed to fetch breedings: ${error.message}`);

  return data;
};

export const getBreedingsBySowId = async (sowId: number) => {
  const { data, error } = (await supabase
    .from("breedings")
    .select()
    .eq("sow_id", sowId)
    .order("breed_date", { ascending: false })) as {
    data: Breeding[];
    error: any;
  };

  if (error) throw new Error(`Failed to fetch breedings: ${error.message}`);

  return data;
};

export const createBreeding = async (breeding: Breeding) => {
  const { data, error } = await supabase
    .from("breedings")
    .insert([breeding])
    .select(`*, boars(*)`)
    .single();

  if (error) throw new Error(`Failed to create breeding: ${error.message}`);

  return data;
};

export const updateBreeding = async (breeding: Breeding) => {
  const { data, error } = await supabase
    .from("breedings")
    .update(breeding)
    .eq("id", breeding.id)
    .select(`*, boars(*)`)
    .single();

  if (error) throw new Error(`Failed to update breeding: ${error.message}`);

  return data;
};

export const deleteBreeding = async (id: number) => {
  const { data, error } = await supabase
    .from("breedings")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to delete breeding: ${error.message}`);

  return data;
};
