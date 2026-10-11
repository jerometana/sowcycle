import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  breedingStage,
  countsTowardLitterStats,
  expectedFarrowDate,
  litterStage,
  pregnancyCheckDates,
  saleableDate,
} from "./cycle";

const legacy = {
  addDaysViaSetDate: (from: Date, days: number) => {
    const d = new Date(from);
    d.setDate(d.getDate() + days);
    return d;
  },
  isPregnant: (b: any) => !b.actual_farrow_date && !b.is_aborted,
  validForStats: (b: any) =>
    b.actual_farrow_date && b.piglets_born_count !== null && !b.is_aborted,
  isSold: (l: any) => !!l.sold_at,
  isFattening: (l: any) => !!l.fattening_at && !l.sold_at,
};

const dates = [
  "2026-01-01T00:00:00.000Z",
  "2026-03-08T17:30:00.000Z",
  "2025-10-26T01:00:00.000Z",
  "2024-02-29T12:00:00.000Z",
  "2026-12-31T23:59:59.000Z",
].map((s) => new Date(s));

const breedings = [
  {},
  { is_aborted: false },
  { is_aborted: true },
  { is_aborted: true, actual_farrow_date: "2026-04-01" },
  { actual_farrow_date: "2026-04-01", piglets_born_count: 12 },
  { actual_farrow_date: "2026-04-01", piglets_born_count: null },
  { actual_farrow_date: "2026-04-01" },
  { actual_farrow_date: "2026-04-01", is_aborted: false, piglets_born_count: 0 },
] as any[];

const litters = [
  {},
  { fattening_at: null, sold_at: null },
  { fattening_at: "2026-05-01" },
  { fattening_at: "2026-05-01", sold_at: "2026-09-01" },
  { sold_at: "2026-09-01" },
] as any[];

describe("cycle date math matches the web app's inline setDate math", () => {
  it.each(dates)("expected farrow from %s is breed date + 114 days", (d) => {
    expect(expectedFarrowDate(d)).toEqual(legacy.addDaysViaSetDate(d, 114));
  });

  it.each(dates)("saleable date from %s is fattening date + 145 days", (d) => {
    expect(saleableDate(d)).toEqual(legacy.addDaysViaSetDate(d, 145));
  });

  it.each(dates)("pregnancy checks from %s land on day 21 and 42", (d) => {
    expect(pregnancyCheckDates(d)).toEqual([addDays(d, 21), addDays(d, 42)]);
  });
});

describe("breedingStage agrees with the components' boolean flags", () => {
  it.each(breedings)("pregnant iff legacy isPregnant for %o", (b) => {
    expect(breedingStage(b) === "pregnant").toBe(legacy.isPregnant(b));
  });

  it.each(breedings)("litter stats filter unchanged for %o", (b) => {
    expect(countsTowardLitterStats(b)).toBe(!!legacy.validForStats(b));
  });

  it("aborted wins over a recorded farrow date", () => {
    expect(
      breedingStage({ is_aborted: true, actual_farrow_date: "2026-04-01" })
    ).toBe("aborted");
  });
});

describe("litterStage agrees with the components' boolean flags", () => {
  it.each(litters)("sold and fattening flags unchanged for %o", (l) => {
    const stage = litterStage(l);
    expect(stage === "sold").toBe(legacy.isSold(l));
    expect(stage === "fattening").toBe(legacy.isFattening(l));
  });

  it("a litter sold without a fattening date is sold, not nursing", () => {
    expect(litterStage({ fattening_at: null, sold_at: "2026-09-01" })).toBe(
      "sold"
    );
  });
});
