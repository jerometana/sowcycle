import { Medicine } from "@sowcycle/core";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "./auth";

const supabase = createClient();

export const getAllMedicines = async () => {
  const user = await getCurrentUser();
  try {
    const { data, error } = (await supabase
      .from("medicines")
      .select()
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as {
      data: Medicine[];
      error: any;
    };

    if (error) throw new Error(`Failed to fetch medicines: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error fetching medicines: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const getMedicineById = async (id: number) => {
  try {
    const { data, error } = (await supabase
      .from("medicines")
      .select()
      .eq("id", id)
      .single()) as { data: Medicine; error: any };

    if (error) throw new Error(`Failed to fetch medicine: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error fetching medicine: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const createMedicine = async (medicine: Medicine) => {
  const user = await getCurrentUser();
  try {
    const { data, error } = await supabase
      .from("medicines")
      .insert([{ ...medicine, user_id: user.id }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create medicine: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error creating medicine: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const updateMedicine = async (medicine: Medicine) => {
  try {
    const { data, error } = await supabase
      .from("medicines")
      .update([medicine])
      .eq("id", medicine.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update medicine: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error updating medicine: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const deleteMedicine = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("medicines")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw new Error(`Failed to delete medicine: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error deleting medicine: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const patchMedicine = async (medicine: Partial<Medicine>) => {
  try {
    const { data, error } = await supabase
      .from("medicines")
      .update(medicine)
      .eq("id", medicine.id)
      .select()
      .limit(1)
      .single();

    if (error) throw new Error(`Failed to patch medicine: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error patching medicine: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const useMedicine = async (id: string) => {
  try {
    const { data: medicine, error: fetchError } = await supabase
      .from("medicines")
      .select("stock_count")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(`Failed to fetch medicine: ${fetchError.message}`);

    const { data, error } = await supabase
      .from("medicines")
      .update({
        stock_count: (medicine.stock_count || 0) - 1,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to use medicine: ${error.message}`);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error using medicine: ${err.message}`);
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
};
