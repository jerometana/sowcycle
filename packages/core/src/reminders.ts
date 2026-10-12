import { addDays, set } from "date-fns";
import { cycleEvents, type CycleEvent, type EventBreeding, type EventLitter } from "./events";

export const REMINDER_HOUR = 7;
export const FARROW_HEADS_UP_DAYS = 3;

export type Reminder = {
  key: string;
  sowId: string;
  fireAt: Date;
  title: string;
  body: string;
};

const atReminderHour = (day: Date) =>
  set(day, { hours: REMINDER_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });

const remindersFor = (e: CycleEvent): Reminder[] => {
  const base = { sowId: e.sowId };
  switch (e.kind) {
    case "check21":
    case "check42": {
      const days = e.kind === "check21" ? 21 : 42;
      return [
        {
          ...base,
          key: `breeding:${e.sourceId}:check${days}`,
          fireAt: atReminderHour(e.date),
          title: `ตรวจท้อง ${days} วัน`,
          body: `${e.sowName}: ครบ ${days} วันหลังผสมวันนี้`,
        },
      ];
    }
    case "farrowDue":
      return [
        {
          ...base,
          key: `breeding:${e.sourceId}:farrow-soon`,
          fireAt: atReminderHour(addDays(e.date, -FARROW_HEADS_UP_DAYS)),
          title: "ใกล้คลอด",
          body: `${e.sowName}: กำหนดคลอดอีก ${FARROW_HEADS_UP_DAYS} วัน`,
        },
        {
          ...base,
          key: `breeding:${e.sourceId}:farrow-due`,
          fireAt: atReminderHour(e.date),
          title: "ถึงกำหนดคลอด",
          body: `${e.sowName}: กำหนดคลอดวันนี้`,
        },
      ];
    case "saleable":
      return [
        {
          ...base,
          key: `litter:${e.sourceId}:saleable`,
          fireAt: atReminderHour(e.date),
          title: "ถึงกำหนดขาย",
          body: `ครอกของ ${e.sowName} ครบกำหนดขุนวันนี้`,
        },
      ];
  }
};

export const reminderSchedule = (
  breedings: EventBreeding[],
  litters: EventLitter[],
  now: Date
): Reminder[] =>
  cycleEvents(breedings, litters)
    .flatMap(remindersFor)
    .filter((r) => r.fireAt > now)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
