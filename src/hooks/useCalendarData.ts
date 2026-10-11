import { useState, useCallback, useEffect } from "react";
import { parseISO, differenceInDays } from "date-fns";
import { getAllBreedings } from "@/services/breeding";
import { getAllLitters } from "@/services/litter";
import { Breeding, Sow, Boar } from "@sowcycle/core";

export interface FarrowEvent {
  id: number;
  sows: Sow & { boars: Boar[] };
  expectedDate: Date;
  breedDate: Date;
  daysUntilFarrow: number;
  isOverdue: boolean;
  actualFarrowDate?: Date;
  boarBreed?: string;
  boarId?: number | null;
  originalBreeding: Breeding;
}

export interface SaleableEvent {
  id: number;
  litterId: number;
  sowId: number;
  sowName: string;
  saleableDate: Date;
  daysUntilSaleable: number;
  isPastDue: boolean;
  farrowDate: Date;
  boarBreed: string;
  pigletCount: number;
  maleCount: number;
  femaleCount: number;
  fattening_at?: Date;
  boarId?: number;
  soldDate?: Date;
}

export interface CalendarData {
  breedings: Breeding[];
  farrowEvents: FarrowEvent[];
  saleableEvents: SaleableEvent[];
}

export const useCalendarData = () => {
  const [data, setData] = useState<CalendarData>({
    breedings: [],
    farrowEvents: [],
    saleableEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformBreedingsToEvents = useCallback(
    (
      breedings: (Breeding & { boars: Boar; sows: Sow & { boars: Boar[] } })[]
    ): FarrowEvent[] => {
      return breedings.map((breeding) => {
        const expectedDate = parseISO(breeding.expected_farrow_date);
        const breedDate = parseISO(breeding.breed_date);
        const today = new Date();
        const daysUntilFarrow = differenceInDays(expectedDate, today);

        return {
          id: breeding.id!,
          sows: breeding.sows,
          expectedDate,
          breedDate,
          daysUntilFarrow,
          isOverdue: daysUntilFarrow < 0,
          actualFarrowDate: breeding.actual_farrow_date
            ? parseISO(breeding.actual_farrow_date)
            : undefined,
          boarBreed: breeding.boars?.breed,
          boarId: breeding.boar_id,
          originalBreeding: breeding,
        };
      });
    },
    []
  );

  const transformLittersToSaleableEvents = useCallback(
    (litters: any[]): SaleableEvent[] => {
      return litters
        .filter((litter) => litter.saleable_at)
        .map((litter) => {
          const saleableDate = parseISO(litter.saleable_at!);
          const farrowDate = litter.birth_date
            ? parseISO(litter.birth_date)
            : new Date();
          const today = new Date();
          const daysUntilSaleable = differenceInDays(saleableDate, today);

          return {
            id: litter.id!,
            litterId: litter.id!,
            sowId: litter.sow_id,
            sowName: (litter as any).sows?.name || `Sow #${litter.sow_id}`,
            saleableDate,
            daysUntilSaleable,
            isPastDue: daysUntilSaleable < 0,
            farrowDate,
            boarBreed: litter.boars?.breed || "",
            pigletCount: litter.piglets_born_count || 0,
            maleCount: litter.piglets_male_born_alive || 0,
            femaleCount: litter.piglets_female_born_alive || 0,
            fattening_at: litter.fattening_at
              ? parseISO(litter.fattening_at)
              : undefined,
            boarId: litter.boar_id,
            soldDate: litter.sold_at ? parseISO(litter.sold_at) : undefined,
          };
        });
    },
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [breedings, litters] = await Promise.all([
        getAllBreedings(),
        getAllLitters(),
      ]);

      const farrowEvents = transformBreedingsToEvents(breedings);
      const saleableEvents = transformLittersToSaleableEvents(litters);

      setData({
        breedings,
        farrowEvents,
        saleableEvents,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch calendar data"
      );
    } finally {
      setLoading(false);
    }
  }, [transformBreedingsToEvents, transformLittersToSaleableEvents]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
