import { describe, expect, it } from "vitest";
import type { EventBreeding as ReminderBreeding, EventLitter as ReminderLitter } from "./events";
import { reminderSchedule } from "./reminders";

const now = new Date(2026, 9, 11, 12, 0);

const pregnant: ReminderBreeding = {
  id: "7",
  sow_id: "1",
  sow_name: "Sow A",
  breed_date: new Date(2026, 9, 1).toISOString(),
  expected_farrow_date: new Date(2027, 0, 23).toISOString(),
  actual_farrow_date: null,
  is_aborted: false,
};

const fattening: ReminderLitter = {
  id: "9",
  sow_id: "2",
  sow_name: "Sow B",
  fattening_at: new Date(2026, 8, 1).toISOString(),
  saleable_at: new Date(2027, 0, 24).toISOString(),
  sold_at: null,
};

const keys = (rs: { key: string }[]) => rs.map((r) => r.key);

describe("reminderSchedule", () => {
  it("schedules both checks, a heads-up, and the due day for a pregnant sow, at 07:00 local", () => {
    const rs = reminderSchedule([pregnant], [], now);
    expect(keys(rs)).toEqual([
      "breeding:7:check21",
      "breeding:7:check42",
      "breeding:7:farrow-soon",
      "breeding:7:farrow-due",
    ]);
    expect(rs.map((r) => [r.fireAt.getFullYear(), r.fireAt.getMonth(), r.fireAt.getDate(), r.fireAt.getHours()])).toEqual([
      [2026, 9, 22, 7],
      [2026, 10, 12, 7],
      [2027, 0, 20, 7],
      [2027, 0, 23, 7],
    ]);
    expect(rs[3].body).toBe("Sow A: กำหนดคลอดวันนี้");
    expect(rs.every((r) => r.sowId === "1")).toBe(true);
  });

  it("drops reminders whose time has passed", () => {
    const later = new Date(2026, 9, 30, 12, 0);
    expect(keys(reminderSchedule([pregnant], [], later))).toEqual([
      "breeding:7:check42",
      "breeding:7:farrow-soon",
      "breeding:7:farrow-due",
    ]);
  });

  it("schedules nothing once a breeding has farrowed or aborted", () => {
    const farrowed = { ...pregnant, actual_farrow_date: new Date(2026, 9, 10).toISOString() };
    const aborted = { ...pregnant, is_aborted: true };
    expect(reminderSchedule([farrowed, aborted], [], now)).toEqual([]);
  });

  it("reminds on the saleable day only while a litter is fattening", () => {
    expect(keys(reminderSchedule([], [fattening], now))).toEqual(["litter:9:saleable"]);
    const sold = { ...fattening, sold_at: new Date(2026, 9, 5).toISOString() };
    const nursing = { ...fattening, fattening_at: null };
    expect(reminderSchedule([], [sold, nursing], now)).toEqual([]);
  });

  it("orders reminders across sows by when they fire", () => {
    const rs = reminderSchedule([pregnant], [fattening], now);
    const times = rs.map((r) => r.fireAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(rs.at(-1)?.key).toBe("litter:9:saleable");
  });
});
