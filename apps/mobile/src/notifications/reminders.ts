import { reminderSchedule, type Reminder, type ReminderBreeding, type ReminderLitter } from "@sowcycle/core";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { db } from "../db";

// iOS keeps at most 64 pending local notifications per app.
const MAX_SCHEDULED = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const identifierOf = (r: Reminder) => `${r.key}@${r.fireAt.toISOString()}`;

const loadSchedule = async () => {
  const breedings = await db.getAll<Omit<ReminderBreeding, "is_aborted"> & { is_aborted: number | null }>(`
    select b.id, b.sow_id, s.name as sow_name, b.breed_date, b.expected_farrow_date, b.actual_farrow_date, b.is_aborted
    from breedings b join sows s on s.id = b.sow_id`);
  const litters = await db.getAll<ReminderLitter>(`
    select l.id, l.sow_id, s.name as sow_name, l.fattening_at, l.saleable_at, l.sold_at
    from litters l join sows s on s.id = l.sow_id`);
  return reminderSchedule(
    breedings.map((b) => ({ ...b, is_aborted: b.is_aborted === 1 })),
    litters,
    new Date()
  ).slice(0, MAX_SCHEDULED);
};

export const syncReminders = async () => {
  const wanted = new Map((await loadSchedule()).map((r) => [identifierOf(r), r]));
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set(scheduled.map((n) => n.identifier));

  await Promise.all(
    scheduled
      .filter((n) => !wanted.has(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
  await Promise.all(
    [...wanted]
      .filter(([id]) => !scheduledIds.has(id))
      .map(([identifier, r]) =>
        Notifications.scheduleNotificationAsync({
          identifier,
          content: { title: r.title, body: r.body, data: { sowId: r.sowId } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.fireAt },
        })
      )
  );
};

export function useReminders(auth: "unknown" | "signedIn" | "signedOut") {
  const signedIn = auth === "signedIn";
  useEffect(() => {
    if (auth === "signedOut") Notifications.cancelAllScheduledNotificationsAsync();
    if (!signedIn) return;
    Notifications.requestPermissionsAsync();
    syncReminders();
    return db.onChange(
      { onChange: () => syncReminders() },
      { tables: ["breedings", "litters", "sows"], throttleMs: 2000 }
    );
  }, [auth, signedIn]);

  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const sowId = response?.notification.request.content.data?.sowId;
    if (signedIn && typeof sowId === "string") {
      router.push({ pathname: "/sows/[id]", params: { id: sowId } });
    }
  }, [response, signedIn]);
}
