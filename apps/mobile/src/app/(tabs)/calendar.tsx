import { useQuery } from "@powersync/react-native";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card, CardHeader, EmptyText, InfoRow, screen } from "../../components/ui";
import { thaiDateLong } from "../../lib/date";
import { color, Text } from "../../theme";
import { Calendar as CalendarIcon, ChevronRight, Heart, PiggyBank } from "../../theme/icons";

const LIME = "#84cc16";
const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

type FarrowRow = { sow_id: string; sow_name: string; expected_farrow_date: string; actual_farrow_date: string | null; is_aborted: number | null };
type SaleRow = { sow_id: string; sow_name: string; saleable_at: string; sold_at: string | null; piglets_born_count: number | null };

type DayEvent =
  | { kind: "farrow"; sowId: string; sowName: string; date: Date; done: boolean }
  | { kind: "sale"; sowId: string; sowName: string; date: Date; done: boolean; count: number };

// Same rule as the web calendar: a farrow sits on its actual date once recorded, else on the expected date; a sale on its sold date, else the saleable date.
const useDayEvents = (): DayEvent[] => {
  const { data: farrows } = useQuery<FarrowRow>(`
    select b.sow_id, s.name as sow_name, b.expected_farrow_date, b.actual_farrow_date, b.is_aborted
    from breedings b join sows s on s.id = b.sow_id where coalesce(b.is_aborted, 0) = 0`);
  const { data: sales } = useQuery<SaleRow>(`
    select l.sow_id, s.name as sow_name, l.saleable_at, l.sold_at, l.piglets_born_count
    from litters l join sows s on s.id = l.sow_id where l.saleable_at is not null`);
  return [
    ...farrows.map((f) => ({
      kind: "farrow" as const,
      sowId: f.sow_id,
      sowName: f.sow_name,
      date: startOfDay(new Date(f.actual_farrow_date ?? f.expected_farrow_date)),
      done: !!f.actual_farrow_date,
    })),
    ...sales.map((l) => ({
      kind: "sale" as const,
      sowId: l.sow_id,
      sowName: l.sow_name,
      date: startOfDay(new Date(l.sold_at ?? l.saleable_at)),
      done: !!l.sold_at,
      count: l.piglets_born_count ?? 0,
    })),
  ];
};

export default function CalendarScreen() {
  const events = useDayEvents();
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(startOfMonth(today));
  const [selected, setSelected] = useState(today);

  const gridStart = startOfWeek(startOfMonth(month));
  const weeks = Math.ceil((differenceInCalendarDays(endOfMonth(month), gridStart) + 1) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));

  const dayStyle = (d: Date) => {
    const onDay = events.filter((e) => isSameDay(e.date, d));
    const farrow = onDay.find((e) => e.kind === "farrow");
    const sale = onDay.find((e) => e.kind === "sale");
    const overdue = (e?: DayEvent) => !!e && !e.done && e.date < today;
    if (farrow) return { backgroundColor: color.primary, opacity: overdue(farrow) ? 0.5 : 1 };
    if (sale) return { backgroundColor: LIME, opacity: overdue(sale) ? 0.5 : 1 };
    return null;
  };

  const selectedEvents = events.filter((e) => isSameDay(e.date, selected));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={screen.root} contentContainerStyle={screen.content}>
      <View style={s.calendar}>
        <View style={s.monthRow}>
          <Pressable hitSlop={12} onPress={() => setMonth(addMonths(month, -1))} style={{ transform: [{ rotate: "180deg" }] }}>
            <ChevronRight size={20} color={color.mutedForeground} />
          </Pressable>
          <Text style={s.monthTitle}>{month.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</Text>
          <Pressable hitSlop={12} onPress={() => setMonth(addMonths(month, 1))}>
            <ChevronRight size={20} color={color.mutedForeground} />
          </Pressable>
        </View>
        <View style={s.week}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={s.weekday}>{w}</Text>
          ))}
        </View>
        <View style={s.grid}>
          {days.map((d) => {
            const marked = dayStyle(d);
            const isSelected = isSameDay(d, selected);
            const inMonth = isSameMonth(d, month);
            return (
              <Pressable key={d.toISOString()} style={s.cell} onPress={() => setSelected(d)}>
                <View style={[s.dayDot, isSelected ? s.selected : marked && { backgroundColor: marked.backgroundColor, opacity: marked.opacity }]}>
                  <Text style={[s.dayText, !inMonth && { color: "#d4d4d4" }, (marked || isSelected) && { color: color.primaryForeground }]}>
                    {d.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={s.selectedTitle}>{thaiDateLong(selected, true)}</Text>
      {selectedEvents.length === 0 && <EmptyText>ไม่มีรายการในวันนี้</EmptyText>}
      {selectedEvents.map((e, i) => (
        <Card key={i} onPress={() => router.push({ pathname: "/sows/[id]", params: { id: e.sowId } })}>
          <CardHeader
            title={e.kind === "farrow" ? `${e.done ? "คลอดแล้ว" : "กำหนดคลอด"} แม่${e.sowName}` : `${e.done ? "ขายแล้ว" : "กำหนดขาย"} ลูกขุนแม่${e.sowName}`}
            tone={e.kind === "farrow" ? "primary" : "default"}
          />
          {e.kind === "sale" && <InfoRow icon={PiggyBank} label="จำนวน">{`${e.count} ตัว`}</InfoRow>}
          <InfoRow
            icon={e.kind === "farrow" ? Heart : CalendarIcon}
            tint={e.kind === "farrow" ? color.primary : color.mutedForeground}
            label={e.kind === "farrow" ? (e.done ? "คลอดเมื่อ" : "กำหนดคลอด") : e.done ? "ขายแล้วเมื่อ" : "กำหนดขาย"}
          >
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
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  calendar: { backgroundColor: color.card, borderRadius: 16, padding: 12 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  monthTitle: { fontSize: 16, fontWeight: "600" },
  week: { flexDirection: "row", marginTop: 4 },
  weekday: { flex: 1, textAlign: "center", color: color.mutedForeground, fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 4 },
  dayDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: "#a3a3a3" },
  dayText: { fontSize: 15, color: color.foreground },
  selectedTitle: { fontSize: 20, fontWeight: "600", marginTop: 8 },
  value: { fontSize: 16, fontWeight: "600", color: color.gray900 },
  days: { fontSize: 14, fontWeight: "500", color: color.mutedForeground },
});
