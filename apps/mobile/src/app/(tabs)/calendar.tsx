import type { CycleEvent, CycleEventKind } from "@sowcycle/core";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { router } from "expo-router";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useCycleEvents } from "../../db/cycleEvents";

const KIND: Record<CycleEventKind, { title: string; color: string }> = {
  check21: { title: "ตรวจท้อง 21 วัน", color: "#d97706" },
  check42: { title: "ตรวจท้อง 42 วัน", color: "#d97706" },
  farrowDue: { title: "กำหนดคลอด", color: "#ec4899" },
  saleable: { title: "กำหนดขาย", color: "#ea580c" },
};

const OVERDUE_KINDS: CycleEventKind[] = ["farrowDue", "saleable"];

const monthTitle = (date: Date) => date.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

const sectionsOf = (events: CycleEvent[]) => {
  const today = startOfDay(new Date());
  const overdue = events.filter((e) => e.date < today && OVERDUE_KINDS.includes(e.kind));
  const upcoming = events.filter((e) => e.date >= today);
  const byMonth = new Map<string, CycleEvent[]>();
  for (const e of upcoming) {
    const title = monthTitle(e.date);
    byMonth.set(title, [...(byMonth.get(title) ?? []), e]);
  }
  return [
    ...(overdue.length ? [{ title: "เลยกำหนด", data: overdue }] : []),
    ...[...byMonth].map(([title, data]) => ({ title, data })),
  ];
};

export default function Calendar() {
  const sections = sectionsOf(useCycleEvents());
  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      style={s.root}
      sections={sections}
      keyExtractor={(e) => `${e.kind}:${e.sourceId}`}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={<Text style={s.empty}>ไม่มีนัดหมาย</Text>}
      renderSectionHeader={({ section }) => (
        <Text style={[s.section, section.title === "เลยกำหนด" && { color: "#dc2626" }]}>{section.title}</Text>
      )}
      renderItem={({ item }) => <EventRow event={item} />}
    />
  );
}

function EventRow({ event }: { event: CycleEvent }) {
  const days = differenceInCalendarDays(event.date, new Date());
  const kind = KIND[event.kind];
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
      onPress={() => router.push({ pathname: "/sows/[id]", params: { id: event.sowId } })}
    >
      <View style={s.day}>
        <Text style={s.dayNumber}>{event.date.getDate()}</Text>
        <Text style={s.weekday}>{event.date.toLocaleDateString("th-TH", { weekday: "short" })}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.title, { color: kind.color }]}>{kind.title}</Text>
        <Text style={s.sow}>{event.kind === "saleable" ? `ครอกของ ${event.sowName}` : event.sowName}</Text>
      </View>
      <Text style={[s.when, days < 0 && { color: "#dc2626" }]}>
        {days === 0 ? "วันนี้" : days > 0 ? `อีก ${days} วัน` : `เลย ${-days} วัน`}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: "#f5f5f4" },
  empty: { textAlign: "center", color: "#737373", marginTop: 48 },
  section: { fontSize: 17, fontWeight: "600", marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 16 },
  day: { width: 44, alignItems: "center" },
  dayNumber: { fontSize: 22, fontWeight: "700" },
  weekday: { color: "#737373", fontSize: 12 },
  title: { fontSize: 16, fontWeight: "600" },
  sow: { color: "#404040", marginTop: 2 },
  when: { color: "#525252" },
});
