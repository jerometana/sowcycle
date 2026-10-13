import { useQuery } from "@powersync/react-native";
import type { CycleEvent, CycleEventKind } from "@sowcycle/core";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { router, Tabs } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkline } from "../../components/Sparkline";
import { SowCard } from "../../components/SowCard";
import { Card, EmptyText, screen, SectionTitle } from "../../components/ui";
import { useCycleEvents } from "../../db/cycleEvents";
import { useSowCards } from "../../db/sowCards";
import { haptic } from "../../lib/haptics";
import { thaiDate, thaiWeekdayDate } from "../../lib/date";
import { color, Text } from "../../theme";
import { Banknote, CircleAlert, Heart } from "../../theme/icons";
import { FadeIn, PressableScale } from "../../components/motion";

type LitterStat = {
  birth_date: string | null;
  sold_at: string | null;
  avg_weight: number | null;
  piglets_born_count: number | null;
  piglets_male_born_alive: number | null;
  piglets_female_born_alive: number | null;
};

const average = (xs: number[], digits: number) =>
  xs.length ? Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(digits)) : 0;

// Sum per calendar month, last six months that have data, as the web dashboard does.
const monthlyTotals = (items: { date: string | null; amount: number }[]) => {
  const byMonth = new Map<string, number>();
  for (const { date, amount } of items) {
    if (!date) continue;
    const d = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + amount);
  }
  return [...byMonth].sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, n]) => n);
};

const lastSix = (rows: LitterStat[], date: keyof LitterStat, value: keyof LitterStat) =>
  rows
    .filter((r) => r[date] && (r[value] as number) > 0)
    .sort((a, b) => String(a[date]).localeCompare(String(b[date])))
    .slice(-6)
    .map((r) => r[value] as number);

// What each cycle event asks of the farmer. A farrow or a sale is done only once it is recorded, so it stays
// on the list while overdue; a pregnancy check has nothing to record, so it drops off once its day has passed.
const TASKS: Record<
  CycleEventKind,
  {
    title: (e: CycleEvent) => string;
    icon: LucideIcon;
    tint: string;
    staysUntilDone: boolean;
    action?: { label: string; go: (e: CycleEvent) => void };
  }
> = {
  check21: { title: (e) => `ตรวจท้อง 21 วัน · ${e.sowName}`, icon: CircleAlert, tint: color.amber, staysUntilDone: false },
  check42: { title: (e) => `ตรวจท้อง 42 วัน · ${e.sowName}`, icon: CircleAlert, tint: color.amber, staysUntilDone: false },
  farrowDue: {
    title: (e) => `กำหนดคลอด · ${e.sowName}`,
    icon: Heart,
    tint: color.primary,
    staysUntilDone: true,
    action: {
      label: "บันทึกการคลอด",
      go: (e) => router.push({ pathname: "/sows/[id]/farrow", params: { id: e.sowId, breedingId: e.sourceId } }),
    },
  },
  saleable: {
    title: (e) => `กำหนดขาย · ครอกของ ${e.sowName}`,
    icon: Banknote,
    tint: color.blue,
    staysUntilDone: true,
    action: { label: "บันทึกวันขาย", go: (e) => router.push({ pathname: "/litters/[id]", params: { id: e.sourceId } }) },
  },
};

const UPCOMING_DAYS = 7;

type Task = { event: CycleEvent; days: number };

const tasksFrom = (events: CycleEvent[], today: Date): Task[] =>
  events
    .map((event) => ({ event, days: differenceInCalendarDays(event.date, today) }))
    .filter(({ event, days }) => days <= UPCOMING_DAYS && (days >= 0 || TASKS[event.kind].staysUntilDone));

const whenLabel = (days: number) => (days < 0 ? `เลยมา ${-days} วัน` : days === 0 ? "วันนี้" : `อีก ${days} วัน`);

const greeting = (hour: number) => (hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น");

export default function Home() {
  const insets = useSafeAreaInsets();
  const { sows } = useSowCards();
  const events = useCycleEvents();
  const { data: breedDates } = useQuery<{ breed_date: string | null }>("select breed_date from breedings");
  const { data: litters } = useQuery<LitterStat>(
    "select birth_date, sold_at, avg_weight, piglets_born_count, piglets_male_born_alive, piglets_female_born_alive from litters"
  );

  const pregnant = sows
    .filter((s) => s.pregnancy)
    .sort((a, b) => a.pregnancy!.expectedFarrow.localeCompare(b.pregnancy!.expectedFarrow));
  const fatteningPiglets = litters
    .filter((l) => !l.sold_at)
    .reduce((n, l) => n + (l.piglets_male_born_alive ?? 0) + (l.piglets_female_born_alive ?? 0), 0);
  const sold = litters.filter((l) => l.sold_at && (l.avg_weight ?? 0) > 0);

  const today = startOfDay(new Date());
  const tasks = tasksFrom(events, today);
  const dueNow = tasks.filter((t) => t.days === 0).length;
  const overdue = tasks.filter((t) => t.days < 0).length;

  const stats = [
    {
      title: "ตั้งครรภ์",
      value: pregnant.length,
      unit: "ตัว",
      tint: color.primary,
      wash: "#fce7f3",
      trend: monthlyTotals(breedDates.map((b) => ({ date: b.breed_date, amount: 1 }))),
      go: () => router.push("/sows"),
    },
    {
      title: "ลูกสุกรขุน",
      value: fatteningPiglets,
      unit: "ตัว",
      tint: color.blue,
      wash: "#dbeafe",
      trend: monthlyTotals(
        litters.map((l) => ({ date: l.birth_date, amount: (l.piglets_male_born_alive ?? 0) + (l.piglets_female_born_alive ?? 0) }))
      ),
      go: () => router.push("/litters"),
    },
    {
      title: "น้ำหนักขายเฉลี่ย",
      value: average(sold.map((l) => l.avg_weight!), 2),
      unit: "กก.",
      tint: color.purple,
      wash: "#f3e8ff",
      trend: lastSix(sold, "sold_at", "avg_weight"),
      go: () => router.push("/litters"),
    },
    {
      title: "ลูกเกิดเฉลี่ย",
      value: average(litters.filter((l) => (l.piglets_born_count ?? 0) > 0).map((l) => l.piglets_born_count!), 1),
      unit: "ตัว",
      tint: "#22c55e",
      wash: "#dcfce7",
      trend: lastSix(litters, "birth_date", "piglets_born_count"),
      go: () => router.push("/litters"),
    },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={screen.root} contentContainerStyle={screen.content}>
      <Tabs.Screen
        options={{
          headerStyle: { backgroundColor: color.background, height: insets.top + 72 },
          headerTitle: () => (
            <View>
              <Text style={s.eyebrow}>{greeting(new Date().getHours())}</Text>
              <Text style={s.title}>{thaiWeekdayDate(today)}</Text>
            </View>
          ),
        }}
      />
      {tasks.length > 0 && (
        <FadeIn index={0}>
          <Text style={s.headline}>
            {dueNow > 0 ? `วันนี้มี ${dueNow} งาน` : "วันนี้ไม่มีงาน"}
            {overdue > 0 && <Text style={s.overdue}>{` · เลยกำหนด ${overdue}`}</Text>}
          </Text>
        </FadeIn>
      )}

      {tasks.length > 0 && (
        <FadeIn index={1}>
          <Card style={s.taskList}>
            {tasks.map((t, i) => (
              <TaskRow key={`${t.event.kind}:${t.event.sourceId}`} task={t} divider={i > 0} />
            ))}
          </Card>
        </FadeIn>
      )}

      <FadeIn index={2} style={s.statGrid}>
        {stats.map((st) => (
          <Pressable
            key={st.title}
            onPress={st.go}
            accessibilityRole="button"
            accessibilityLabel={`${st.title} ${st.value} ${st.unit}`}
            style={({ pressed }) => [s.statTile, pressed && { opacity: 0.85 }]}
          >
            <View style={s.statTop}>
              <Text style={s.statTitle} numberOfLines={1}>
                {st.title}
              </Text>
              <Sparkline values={st.trend} stroke={st.tint} fill={st.wash} width={44} height={24} />
            </View>
            <Text>
              <Text style={[s.statNumber, { color: st.tint }]}>{st.value}</Text>
              <Text style={s.statUnit}>{` ${st.unit}`}</Text>
            </Text>
          </Pressable>
        ))}
      </FadeIn>

      <SectionTitle>{`แม่พันธุ์ตั้งครรภ์ (${pregnant.length})`}</SectionTitle>
      {pregnant.length === 0 && <EmptyText>ไม่มีแม่พันธุ์ตั้งครรภ์</EmptyText>}
      {pregnant.map((sow, i) => (
        <FadeIn key={sow.id} index={i + 3}>
          <SowCard sow={sow} />
        </FadeIn>
      ))}
    </ScrollView>
  );
}

function TaskRow({ task: { event, days }, divider }: { task: Task; divider: boolean }) {
  const kind = TASKS[event.kind];
  const Icon = kind.icon;
  const late = days < 0;
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/sows/[id]", params: { id: event.sowId } })}
      style={({ pressed }) => [s.task, divider && s.taskDivider, pressed && { backgroundColor: color.muted }]}
    >
      <View style={[s.taskIcon, { backgroundColor: late ? "#fee2e2" : color.muted }]}>
        <Icon size={20} color={late ? color.destructive : kind.tint} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.taskTitle} numberOfLines={1}>
          {kind.title(event)}
        </Text>
        <Text style={[s.taskWhen, late && { color: color.destructive }, days === 0 && { color: color.primary }]}>
          {`${whenLabel(days)} · ${thaiDate(event.date)}`}
        </Text>
      </View>
      {kind.action && (
        <PressableScale
          hitSlop={6}
          onPress={() => {
            haptic.tap();
            kind.action!.go(event);
          }}
          style={s.taskAction}
        >
          <Text style={s.taskActionText}>{kind.action.label}</Text>
        </PressableScale>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  eyebrow: { fontSize: 14, fontWeight: "500", color: color.mutedForeground },
  title: { fontSize: 26, fontWeight: "700", color: color.foreground },
  headline: { fontSize: 22, fontWeight: "700", color: color.foreground },
  overdue: { fontSize: 22, fontWeight: "700", color: color.destructive },
  taskList: { padding: 0, gap: 0, overflow: "hidden" },
  task: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  taskDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border },
  taskIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  taskTitle: { fontSize: 16, fontWeight: "600", color: color.foreground },
  taskWhen: { fontSize: 14, color: color.mutedForeground },
  taskAction: { paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: color.primary, justifyContent: "center" },
  taskActionText: { fontSize: 14, fontWeight: "600", color: color.primaryForeground },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statTile: { flexBasis: "47%", flexGrow: 1, backgroundColor: color.card, borderRadius: 16, padding: 14, gap: 6 },
  statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  statTitle: { flex: 1, fontSize: 14, color: color.mutedForeground },
  statNumber: { fontSize: 24, fontWeight: "700" },
  statUnit: { fontSize: 14, color: color.mutedForeground },
});
