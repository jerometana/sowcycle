import { useToast } from "@/hooks/use-toast";
import { useBreedingStore } from "@/stores/useBreedingStore";
import { useSowStore } from "@/stores/useSowStore";
import {
  createBreeding as createBreedingService,
  updateBreeding as updateBreedingService,
  deleteBreeding as deleteBreedingService,
} from "@/services/breeding";
import { createLitter } from "@/services/litter";
import { patchSow } from "@/services/sow";
import { Breeding } from "@sowcycle/core";

interface CreateBreedingData {
  sow_id: number;
  boar_id: number | null;
  breed_date: string;
  expected_farrow_date: string;
}

interface CreateLitterData {
  sow_id: number;
  birth_date: string;
  piglets_born_count: number;
  piglets_male_born_alive: number;
  piglets_female_born_alive: number;
  boar_id?: number;
  avg_weight?: number;
}

export function useBreedingOperations() {
  const { toast } = useToast();
  const {
    addBreeding,
    updateBreeding: updateBreedingStore,
    removeBreeding,
  } = useBreedingStore();
  const { updateSow } = useSowStore();

  const createBreeding = async (data: CreateBreedingData) => {
    try {
      const breedingResponse = await createBreedingService(data);

      if (breedingResponse) {
        // Update sow availability
        const sowPatchResponse = await patchSow({
          id: data.sow_id,
          is_available: false,
          updated_at: new Date().toISOString(),
        });

        // Update stores
        addBreeding(breedingResponse);

        if (sowPatchResponse) {
          const updatedSow = {
            ...sowPatchResponse,
            breedings: [breedingResponse],
          };
          updateSow(updatedSow);
        }

        toast({
          title: "เพิ่มสำเร็จ",
          description: "เพิ่มประวัติการผสมเรียบร้อย",
        });

        return breedingResponse;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มประวัติการผสมได้",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBreeding = async (breeding: Breeding) => {
    try {
      const requestBody = {
        ...breeding,
        updated_at: new Date().toISOString(),
        sows: undefined,
        sow: undefined,
        boars: undefined,
      };

      const response = await updateBreedingService(requestBody);

      if (response) {
        updateBreedingStore(response);

        toast({
          title: "แก้ไขสำเร็จ",
          description: "แก้ไขประวัติการผสมเรียบร้อย",
        });

        return response;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขประวัติการผสมได้",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createFarrowRecord = async (
    breeding: Breeding,
    totalBornPiglets: number
  ) => {
    try {
      const requestBody = {
        ...breeding,
        updated_at: new Date().toISOString(),
        sows: undefined,
        sow: undefined,
        boars: undefined,
      };

      const updateResponse = await updateBreedingService(requestBody);

      if (updateResponse) {
        // Create litter if not aborted
        if (!breeding.is_aborted) {
          const litterData: CreateLitterData = {
            sow_id: breeding.sow_id,
            birth_date: breeding.actual_farrow_date!,
            piglets_born_count: totalBornPiglets,
            piglets_male_born_alive: breeding.piglets_male_born_alive!,
            piglets_female_born_alive: breeding.piglets_female_born_alive!,
            avg_weight: breeding.avg_weight,
          };

          await createLitter(litterData);
        }

        // Update sow availability
        const sowPatchResponse = await patchSow({
          id: breeding.sow_id,
          is_available: true,
          updated_at: new Date().toISOString(),
        });

        // Update stores
        updateBreedingStore(updateResponse);

        if (sowPatchResponse) {
          updateSow(sowPatchResponse);
        }

        toast({
          title: "เพิ่มสำเร็จ",
          description: "เพิ่มประวัติการคลอดเรียบร้อย",
        });

        return updateResponse;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการคลอดได้",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBreeding = async (
    breedingId: number,
    sowId?: number,
    hadFarrowed?: boolean
  ) => {
    try {
      const response = await deleteBreedingService(breedingId);

      if (response) {
        removeBreeding(response.id);

        // If breeding hadn't farrowed, make sow available again
        if (!hadFarrowed && sowId) {
          const sowPatchResponse = await patchSow({
            id: sowId,
            is_available: true,
            updated_at: new Date().toISOString(),
          });

          if (sowPatchResponse) {
            updateSow(sowPatchResponse);
          }
        }

        toast({
          title: "ลบสำเร็จ",
          description: "ลบประวัติการผสมเรียบร้อย",
        });

        return response;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบประวัติการผสมได้",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createBreeding,
    updateBreeding,
    createFarrowRecord,
    deleteBreeding,
  };
}
