import { breedingStage, litterStage, pregnancyCheckDates } from "./cycle";

export type EventBreeding = {
  id: string;
  sow_id: string;
  sow_name: string;
  breed_date: string;
  expected_farrow_date: string;
  actual_farrow_date: string | null;
  is_aborted: boolean;
};

export type EventLitter = {
  id: string;
  sow_id: string;
  sow_name: string;
  fattening_at: string | null;
  saleable_at: string | null;
  sold_at: string | null;
};

export type CycleEventKind = "check21" | "check42" | "farrowDue" | "saleable";

export type CycleEvent = {
  kind: CycleEventKind;
  sourceId: string;
  sowId: string;
  sowName: string;
  date: Date;
};

const breedingEvents = (b: EventBreeding): CycleEvent[] => {
  const stage = breedingStage({ actual_farrow_date: b.actual_farrow_date ?? undefined, is_aborted: b.is_aborted });
  if (stage !== "pregnant") return [];
  const [check21, check42] = pregnancyCheckDates(new Date(b.breed_date));
  const base = { sourceId: b.id, sowId: b.sow_id, sowName: b.sow_name };
  return [
    { ...base, kind: "check21", date: check21 },
    { ...base, kind: "check42", date: check42 },
    { ...base, kind: "farrowDue", date: new Date(b.expected_farrow_date) },
  ];
};

const litterEvents = (l: EventLitter): CycleEvent[] =>
  litterStage(l) === "fattening" && l.saleable_at
    ? [{ kind: "saleable", sourceId: l.id, sowId: l.sow_id, sowName: l.sow_name, date: new Date(l.saleable_at) }]
    : [];

export const cycleEvents = (breedings: EventBreeding[], litters: EventLitter[]): CycleEvent[] =>
  [...breedings.flatMap(breedingEvents), ...litters.flatMap(litterEvents)].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
