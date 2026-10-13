import { useQuery } from "@powersync/react-native";
import { cycleEvents, type CycleEventKind, type EventLitter } from "@sowcycle/core";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View, type GestureResponderEvent } from "react-native";
import { FadeIn, PressableScale } from "../../components/motion";
import { Card, CardHeader, EmptyText, InfoRow, screen } from "../../components/ui";
import { EVENT_BREEDINGS, toEventBreeding } from "../../db/cycleEvents";
import { thaiDateLong } from "../../lib/date";
import { color, Text } from "../../theme";
import { Calendar as CalendarIcon, ChevronRight, CircleAlert, Heart, PiggyBank } from "../../theme/icons";

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const SWIPE_DISTANCE = 50;

type CalendarEvent = { kind: CycleEventKind; sowId: string; sowName: string; date: Date; done: boolean; count?: number };

const KINDS: Record<
  CycleEventKind,
  { dot: string; icon: LucideIcon; title: (e: CalendarEvent) => string; label: (done: boolean) => string }
> = {
  check21: { dot: color.amber, icon: CircleAlert, title: (e) => `กลับสัดครั้งที่ 1 แม่${e.sowName}`, label: () => "วันเช็คกลับสัด" },
  check42: { dot: color.amber, icon: CircleAlert, title: (e) => `กลับสัดครั้งที่ 2 แม่${e.sowName}`, label: () => "วันเช็คกลับสัด" },
  farrowDue: {
    dot: color.primary,
    icon: Heart,
    title: (e) => `${e.done ? "คลอดแล้ว" : "กำหนดคลอด"} แม่${e.sowName}`,
    label: (done) => (done ? "คลอดเมื่อ" : "กำหนดคลอด"),
  },
  saleable: {
    dot: "#84cc16",
    icon: CalendarIcon,
    title: (e) => `${e.done ? "ขายแล้ว" : "กำหนดขาย"} ลูกขุนแม่${e.sowName}`,
    label: (done) => (done ? "ขายแล้วเมื่อ" : "กำหนดขาย"),
  },
};
const DOT_ORDER: CycleEventKind[] = ["farrowDue", "saleable", "check21", "check42"];

type LitterRow = EventLitter & { piglets_born_count: number | null };
const LITTERS = `
  select l.id, l.sow_id, s.name as sow_name, l.fattening_at, l.saleable_at, l.sold_at, l.piglets_born_count
  from litters l join sows s on s.id = l.sow_id`;

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

// Upcoming events come from the shared cycleEvents rules; finished farrows and sales are added so the calendar keeps history.
const useEventsByDay = () => {
  const { data: breedingRows } = useQuery<Parameters<typeof toEventBreeding>[0]>(EVENT_BREEDINGS);
  const { data: litters } = useQuery<LitterRow>(LITTERS);

  return useMemo(() => {
    const breedings = breedingRows.map(toEventBreeding);
    const counts = new Map(litters.map((l) => [l.id, l.piglets_born_count ?? 0]));
    const events: CalendarEvent[] = [
      ...cycleEvents(breedings, litters).map((e) => ({
        ...e,
        date: startOfDay(e.date),
        done: false,
        count: e.kind === "saleable" ? counts.get(e.sourceId) : undefined,
      })),
      ...breedings
        .filter((b) => b.actual_farrow_date && !b.is_aborted)
        .map((b) => ({ kind: "farrowDue" as const, sowId: b.sow_id, sowName: b.sow_name, date: startOfDay(new Date(b.actual_farrow_date!)), done: true })),
      ...litters
        .filter((l) => l.sold_at)
        .map((l) => ({
          kind: "saleable" as const,
          sowId: l.sow_id,
          sowName: l.sow_name,
          date: startOfDay(new Date(l.sold_at!)),
          done: true,
          count: l.piglets_born_count ?? 0,
        })),
    ];
    const byDay = new Map<string, CalendarEvent[]>();
    for (const e of events) byDay.set(dayKey(e.date), [...(byDay.get(dayKey(e.date)) ?? []), e]);
    return byDay;
  }, [breedingRows, litters]);
};

export default function CalendarScreen() {
  const eventsByDay = useEventsByDay();
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(startOfMonth(today));
  const [selected, setSelected] = useState(today);

  const gridStart = startOfWeek(startOfMonth(month));
  const weeks = Math.ceil((differenceInCalendarDays(endOfMonth(month), gridStart) + 1) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));
  const selectedEvents = eventsByDay.get(dayKey(selected)) ?? [];
  const awayFromToday = !isSameDay(selected, today) || !isSameMonth(month, today);

  const select = (d: Date) => {
    setSelected(d);
    if (!isSameMonth(d, month)) setMonth(startOfMonth(d));
  };
  const goToday = () => {
    setSelected(today);
    setMonth(startOfMonth(today));
  };

  // Touch events instead of PanResponder: the ScrollView cancels child responders, and iOS can send cancel and end for one gesture.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: GestureResponderEvent) => {
    touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  };
  const onTouchEnd = (e: GestureResponderEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.nativeEvent.pageX - start.x;
    const dy = e.nativeEvent.pageY - start.y;
    if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 2) setMonth((m) => addMonths(m, dx < 0 ? 1 : -1));
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={screen.root} contentContainerStyle={screen.content}>
      <View style={s.calendar} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
        <View style={s.monthRow}>
          <PressableScale hitSlop={12} accessibilityLabel="เดือนก่อนหน้า" onPress={() => setMonth(addMonths(month, -1))}>
            <View style={{ transform: [{ rotate: "180deg" }] }}>
              <ChevronRight size={20} color={color.mutedForeground} />
            </View>
          </PressableScale>
          <View style={s.titleGroup}>
            <Text style={s.monthTitle}>{month.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</Text>
            {awayFromToday && (
              <PressableScale hitSlop={8} onPress={goToday} style={s.todayPill} accessibilityLabel="กลับไปวันนี้">
                <Text style={s.todayPillText}>วันนี้</Text>
              </PressableScale>
            )}
          </View>
          <PressableScale hitSlop={12} accessibilityLabel="เดือนถัดไป" onPress={() => setMonth(addMonths(month, 1))}>
            <ChevronRight size={20} color={color.mutedForeground} />
          </PressableScale>
        </View>
        <View style={s.week}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={s.weekday}>{w}</Text>
          ))}
        </View>
        <View style={s.grid}>
          {days.map((d) => {
            const onDay = eventsByDay.get(dayKey(d)) ?? [];
            const kinds = DOT_ORDER.filter((k) => onDay.some((e) => e.kind === k));
            const isSelected = isSameDay(d, selected);
            const isToday = isSameDay(d, today);
            const inMonth = isSameMonth(d, month);
            return (
              <PressableScale
                key={d.toISOString()}
                style={s.cell}
                onPress={() => select(d)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${thaiDateLong(d)}${isToday ? " วันนี้" : ""}${onDay.length ? ` ${onDay.length} รายการ` : ""}`}
              >
                <View style={[s.day, isToday && s.today, isSelected && s.selected]}>
                  <Text
                    style={[
                      s.dayText,
                      !inMonth && { color: "#d4d4d4" },
                      isToday && { color: color.primary, fontWeight: "700" },
                      isSelected && { color: color.primaryForeground },
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </View>
                <View style={s.dots}>
                  {kinds.map((k) => {
                    const overdue = onDay.filter((e) => e.kind === k).every((e) => !e.done && e.date < today);
                    return <View key={k} style={[s.dot, { backgroundColor: KINDS[k].dot, opacity: overdue ? 0.4 : 1 }]} />;
                  })}
                </View>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <Text style={s.selectedTitle}>{thaiDateLong(selected, true)}</Text>
      {selectedEvents.length === 0 && <EmptyText>ไม่มีรายการในวันนี้</EmptyText>}
      {selectedEvents.map((e, i) => {
        const kind = KINDS[e.kind];
        return (
          <FadeIn key={`${dayKey(selected)}:${i}`} index={i}>
            <Card onPress={() => router.push({ pathname: "/sows/[id]", params: { id: e.sowId } })}>
              <CardHeader title={kind.title(e)} tone={e.kind === "farrowDue" ? "primary" : "default"} />
              {e.count !== undefined && <InfoRow icon={PiggyBank} label="จำนวน">{`${e.count} ตัว`}</InfoRow>}
              <InfoRow icon={kind.icon} tint={e.done ? color.mutedForeground : kind.dot} label={kind.label(e.done)}>
                <Text style={s.value}>
                  {thaiDateLong(e.date)}
                  {!e.done && (
                    <Text style={s.days}>
                      {(() => {
                        const n = differenceInCalendarDays(e.date, today);
                        return n >= 0 ? `  อีก ${n} วัน` : `  เลยมา ${-n} วัน`;
                      })()}
                    </Text>
                  )}
                </Text>
              </InfoRow>
            </Card>
          </FadeIn>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  calendar: { backgroundColor: color.card, borderRadius: 16, padding: 12 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  titleGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  monthTitle: { fontSize: 16, fontWeight: "600" },
  todayPill: { backgroundColor: "#fce7f3", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  todayPillText: { color: color.primary, fontSize: 13, fontWeight: "600" },
  week: { flexDirection: "row", marginTop: 4 },
  weekday: { flex: 1, textAlign: "center", color: color.mutedForeground, fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingTop: 4, paddingBottom: 2 },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "transparent" },
  today: { borderColor: color.primary },
  selected: { backgroundColor: "#a3a3a3", borderColor: "#a3a3a3" },
  dayText: { fontSize: 15, color: color.foreground },
  dots: { flexDirection: "row", gap: 3, height: 6, marginTop: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  selectedTitle: { fontSize: 20, fontWeight: "600", marginTop: 8 },
  value: { fontSize: 16, fontWeight: "600", color: color.gray900 },
  days: { fontSize: 14, fontWeight: "500", color: color.mutedForeground },
});
