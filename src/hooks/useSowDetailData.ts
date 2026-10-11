import { useEffect, useState } from "react";
import { useSowStore } from "@/stores/useSowStore";
import { useBreedingStore } from "@/stores/useBreedingStore";
import { useMedicalRecordStore } from "@/stores/useMedicalRecordStore";
import { getSowByIdWithAllInfo } from "@/services/sow";
import { Litter } from "@sowcycle/core";

export function useSowDetailData(id: number | null) {
  const { sow, setSow } = useSowStore();
  const { breedings, setBreedings } = useBreedingStore();
  const { medicalRecords, setMedicalRecords } = useMedicalRecordStore();

  const [litters, setLitters] = useState<Litter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const sowData = await getSowByIdWithAllInfo(id);

        if (sowData) {
          setSow(sowData);
          setBreedings(sowData.breedings);
          setMedicalRecords(sowData.medical_records);
          setLitters(sowData.litters ?? []);
        }
      } catch (err) {
        console.error("Error fetching sow data:", err);
        setError("Failed to fetch sow data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, setSow, setBreedings, setMedicalRecords]);

  return {
    sow,
    breedings,
    litters,
    medicalRecords,
    isLoading,
    error,
  };
}
