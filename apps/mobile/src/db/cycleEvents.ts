import { useQuery } from "@powersync/react-native";
import { cycleEvents, type EventBreeding, type EventLitter } from "@sowcycle/core";
import { db } from ".";

type BreedingRow = Omit<EventBreeding, "is_aborted"> & { is_aborted: number | null };

export const EVENT_BREEDINGS = `
  select b.id, b.sow_id, s.name as sow_name, b.breed_date, b.expected_farrow_date, b.actual_farrow_date, b.is_aborted
  from breedings b join sows s on s.id = b.sow_id`;

export const EVENT_LITTERS = `
  select l.id, l.sow_id, s.name as sow_name, l.fattening_at, l.saleable_at, l.sold_at
  from litters l join sows s on s.id = l.sow_id`;

export const toEventBreeding = (row: BreedingRow): EventBreeding => ({ ...row, is_aborted: row.is_aborted === 1 });

export const loadEventInputs = async () => ({
  breedings: (await db.getAll<BreedingRow>(EVENT_BREEDINGS)).map(toEventBreeding),
  litters: await db.getAll<EventLitter>(EVENT_LITTERS),
});

export const useCycleEvents = () => {
  const { data: breedings } = useQuery<BreedingRow>(EVENT_BREEDINGS);
  const { data: litters } = useQuery<EventLitter>(EVENT_LITTERS);
  return cycleEvents(breedings.map(toEventBreeding), litters);
};
