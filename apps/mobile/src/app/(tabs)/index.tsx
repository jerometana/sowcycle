import { useQuery } from "@powersync/react-native";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Sparkline } from "../../components/Sparkline";
import { SowCard } from "../../components/SowCard";
import { Card, CardHeader, EmptyText, InfoRow, screen, SectionTitle } from "../../components/ui";
import { useCycleEvents } from "../../db/cycleEvents";
import { useSowCards } from "../../db/sowCards";
import { thaiDateLong } from "../../lib/date";
import { color, Text } from "../../theme";
import { Calendar, CircleAlert, Heart } from "../../theme/icons";

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

function Stat(props: {
  title: string;
  value: number;
  unit: string;
  tint: string;
  wash: string;
  trend: number[];
  onPress: () => void;
  stacked?: boolean;
}) {
  return (
    <Card onPress={props.onPress} style={props.stacked ? { flex: 1 } : undefined}>
      <CardHeader title={props.title} tone="muted" small />
      <View style={props.stacked ? { gap: 12 } : s.statRow}>
        <Text style={s.statValue}>
          <Text style={[s.statNumber, { color: props.tint }]}>{props.value}</Text>
          <Text style={s.statUnit}>{`  ${props.unit}`}</Text>
        </Text>
        <Sparkline values={props.trend} stroke={props.tint} fill={props.wash} width={props.stacked ? 130 : 150} />
      </View>
    </Card>
  );
}

export default function Home() {
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
  const avgSaleWeight = average(sold.map((l) => l.avg_weight!), 2);
  const avgBorn = average(litters.filter((l) => (l.piglets_born_count ?? 0) > 0).map((l) => l.piglets_born_count!), 1);

  const today = startOfDay(new Date());
  const soon = events.filter((e) => {
    const days = differenceInCalendarDays(e.date, today);
    return days >= 0 && days <= 7;
  });

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={screen.root} contentContainerStyle={screen.content}>
      <Stat
        title="แม่พันธุ์ตั้งครรภ์"
        value={pregnant.length}
        unit="ตัว"
        tint={color.primary}
        wash="#fce7f3"
        trend={monthlyTotals(breedDates.map((b) => ({ date: b.breed_date, amount: 1 })))}
        onPress={() => router.push("/sows")}
      />
      <Stat
        title="ลูกสุกรขุน"
        value={fatteningPiglets}
        unit="ตัว"
        tint={color.blue}
        wash="#dbeafe"
        trend={monthlyTotals(
          litters.map((l) => ({
            date: l.birth_date,
            amount: (l.piglets_male_born_alive ?? 0) + (l.piglets_female_born_alive ?? 0),
          }))
        )}
        onPress={() => router.push("/litters")}
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Stat
          stacked
          title="น้ำหนักขายเฉลี่ย"
          value={avgSaleWeight}
          unit="กก."
          tint={color.purple}
          wash="#f3e8ff"
          trend={lastSix(sold, "sold_at", "avg_weight")}
          onPress={() => router.push("/litters")}
        />
        <Stat
          stacked
          title="ลูกเกิดเฉลี่ย"
          value={avgBorn}
          unit="ตัว"
          tint="#22c55e"
          wash="#dcfce7"
          trend={lastSix(litters, "birth_date", "piglets_born_count")}
          onPress={() => router.push("/litters")}
        />
      </View>

      <SectionTitle>{`แม่พันธุ์ตั้งครรภ์ (${pregnant.length})`}</SectionTitle>
      {pregnant.length === 0 && <EmptyText>ไม่มีแม่พันธุ์ตั้งครรภ์</EmptyText>}
      {pregnant.map((sow) => (
        <SowCard key={sow.id} sow={sow} />
      ))}

      <SectionTitle>ครบกำหนดใน 7 วัน</SectionTitle>
      {soon.length === 0 && <EmptyText>ไม่มีรายการใน 7 วันข้างหน้า</EmptyText>}
      {soon.map((e) => (
        <Card key={`${e.kind}:${e.sourceId}`} onPress={() => router.push({ pathname: "/sows/[id]", params: { id: e.sowId } })}>
          <InfoRow
            icon={e.kind === "farrowDue" ? Heart : e.kind === "saleable" ? Calendar : CircleAlert}
            tint={e.kind === "farrowDue" ? color.primary : color.amber}
            label={
              e.kind === "farrowDue"
                ? `กำหนดคลอด · ${e.sowName}`
                : e.kind === "saleable"
                  ? `กำหนดขาย · ครอกของ ${e.sowName}`
                  : `กลับสัดครั้งที่ ${e.kind === "check21" ? 1 : 2} · ${e.sowName}`
            }
          >
            {thaiDateLong(e.date)}
          </InfoRow>
        </Card>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  statRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  statValue: {},
  statNumber: { fontSize: 32, fontWeight: "700" },
  statUnit: { fontSize: 16, color: color.mutedForeground },
});
