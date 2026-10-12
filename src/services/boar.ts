import { Boar } from "@sowcycle/core";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "./auth";

const supabase = createClient();

export const getAllBoars = async () => {
  const user = await getCurrentUser();
  try {
    const { data, error } = (await supabase
      .from("boars")
      .select()
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as {
      data: Boar[];
      error: any;
    };

    if (error) throw new Error(`Failed to fetch boars: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error fetching boars: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const getBoarById = async (id: number) => {
  try {
    const { data, error } = (await supabase
      .from("boars")
      .select()
      .eq("id", id)
      .single()) as { data: Boar; error: any };

    if (error) throw new Error(`Failed to fetch boar: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error fetching boar: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const createBoar = async (boar: Boar) => {
  const user = await getCurrentUser();
  try {
    const { data, error } = await supabase
      .from("boars")
      .insert([{ ...boar, user_id: user.id }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create boar: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error creating boar: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const updateBoar = async (boar: Boar) => {
  try {
    const { data, error } = await supabase
      .from("boars")
      .update([boar])
      .eq("id", boar.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update boar: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error updating boar: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const deleteBoar = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from("boars")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw new Error(`Failed to delete boar: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error deleting boar: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const patchBoar = async (boar: Partial<Boar>) => {
  try {
    const { data, error } = await supabase
      .from("boars")
      .update(boar)
      .eq("id", boar.id)
      .select(
        `
      *,
      breedings(*)`
      )
      .order("breed_date", { ascending: false, referencedTable: "breedings" })
      .limit(1, {
        foreignTable: "breedings",
      })
      .single();

    if (error) throw new Error(`Failed to patch boar: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error patching boar: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};
