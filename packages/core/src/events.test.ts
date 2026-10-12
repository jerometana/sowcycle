import { describe, expect, it } from "vitest";
import { cycleEvents, type EventBreeding, type EventLitter } from "./events";

const overdue: EventBreeding = {
  id: "3",
  sow_id: "1",
  sow_name: "Sow A",
  breed_date: new Date(2026, 5, 1).toISOString(),
  expected_farrow_date: new Date(2026, 8, 23).toISOString(),
  actual_farrow_date: null,
  is_aborted: false,
};

const litter: EventLitter = {
  id: "8",
  sow_id: "2",
  sow_name: "Sow B",
  fattening_at: new Date(2026, 5, 1).toISOString(),
  saleable_at: new Date(2026, 9, 24).toISOString(),
  sold_at: null,
};

describe("cycleEvents", () => {
  it("keeps past events so an overdue farrow still shows on the calendar", () => {
    const kinds = cycleEvents([overdue], []).map((e) => e.kind);
    expect(kinds).toEqual(["check21", "check42", "farrowDue"]);
  });

  it("orders breeding and litter events together by date", () => {
    const events = cycleEvents([overdue], [litter]);
    expect(events.map((e) => `${e.kind}:${e.sowName}`)).toEqual([
      "check21:Sow A",
      "check42:Sow A",
      "farrowDue:Sow A",
      "saleable:Sow B",
    ]);
  });

  it("drops a litter once it is sold", () => {
    expect(cycleEvents([], [{ ...litter, sold_at: new Date(2026, 9, 1).toISOString() }])).toEqual([]);
  });
});
