import { addDays, set } from "date-fns";
import { breedingStage, litterStage, pregnancyCheckDates, PREGNANCY_CHECK_DAYS } from "./cycle";

export const REMINDER_HOUR = 7;
export const FARROW_HEADS_UP_DAYS = 3;

export type ReminderBreeding = {
  id: string;
  sow_id: string;
  sow_name: string;
  breed_date: string;
  expected_farrow_date: string;
  actual_farrow_date: string | null;
  is_aborted: boolean;
};

export type ReminderLitter = {
  id: string;
  sow_id: string;
  sow_name: string;
  fattening_at: string | null;
  saleable_at: string | null;
  sold_at: string | null;
};

export type Reminder = {
  key: string;
  sowId: string;
  fireAt: Date;
  title: string;
  body: string;
};

const atReminderHour = (day: Date) =>
  set(day, { hours: REMINDER_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });

const breedingReminders = (b: ReminderBreeding): Reminder[] => {
  if (breedingStage({ actual_farrow_date: b.actual_farrow_date ?? undefined, is_aborted: b.is_aborted }) !== "pregnant") {
    return [];
  }
  const farrowDay = new Date(b.expected_farrow_date);
  const checks = pregnancyCheckDates(new Date(b.breed_date)).map((day, i) => ({
    key: `breeding:${b.id}:check${PREGNANCY_CHECK_DAYS[i]}`,
    sowId: b.sow_id,
    fireAt: atReminderHour(day),
    title: `ตรวจท้อง ${PREGNANCY_CHECK_DAYS[i]} วัน`,
    body: `${b.sow_name}: ครบ ${PREGNANCY_CHECK_DAYS[i]} วันหลังผสมวันนี้`,
  }));
  return [
    ...checks,
    {
      key: `breeding:${b.id}:farrow-soon`,
      sowId: b.sow_id,
      fireAt: atReminderHour(addDays(farrowDay, -FARROW_HEADS_UP_DAYS)),
      title: "ใกล้คลอด",
      body: `${b.sow_name}: กำหนดคลอดอีก ${FARROW_HEADS_UP_DAYS} วัน`,
    },
    {
      key: `breeding:${b.id}:farrow-due`,
      sowId: b.sow_id,
      fireAt: atReminderHour(farrowDay),
      title: "ถึงกำหนดคลอด",
      body: `${b.sow_name}: กำหนดคลอดวันนี้`,
    },
  ];
};

const litterReminders = (l: ReminderLitter): Reminder[] => {
  if (litterStage(l) !== "fattening" || !l.saleable_at) return [];
  return [
    {
      key: `litter:${l.id}:saleable`,
      sowId: l.sow_id,
      fireAt: atReminderHour(new Date(l.saleable_at)),
      title: "ถึงกำหนดขาย",
      body: `ครอกของ ${l.sow_name} ครบกำหนดขุนวันนี้`,
    },
  ];
};

export const reminderSchedule = (
  breedings: ReminderBreeding[],
  litters: ReminderLitter[],
  now: Date
): Reminder[] =>
  [...breedings.flatMap(breedingReminders), ...litters.flatMap(litterReminders)]
    .filter((r) => r.fireAt > now)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
