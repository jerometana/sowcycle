import { useQuery } from "@powersync/react-native";
import { breedingStage, pregnancyCheckDates, type BreedingStage } from "@sowcycle/core";
import { differenceInCalendarDays } from "date-fns";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useOnline } from "../../../db/useOnline";
import { thaiDate } from "../../../lib/date";

type BreedingRow = {
  id: string;
  breed_date: string;
  expected_farrow_date: string;
  actual_farrow_date: string | null;
  is_aborted: number | null;
  piglets_male_born_alive: number | null;
  piglets_female_born_alive: number | null;
  piglets_born_dead: number | null;
  boar_breed: string | null;
};

const BREEDINGS = `
  select b.*, bo.breed as boar_breed
  from breedings b left join boars bo on bo.id = b.boar_id
  where b.sow_id = ? order by b.breed_date desc`;

const stageOf = (b: BreedingRow): BreedingStage =>
  breedingStage({ actual_farrow_date: b.actual_farrow_date ?? undefined, is_aborted: b.is_aborted === 1 });

const thDate = (iso: string | Date) => thaiDate(iso, true);

export default function SowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useOnline();
  const { data: sows } = useQuery<{ name: string }>("select name from sows where id = ?", [id]);
  const { data: breedings } = useQuery<BreedingRow>(BREEDINGS, [id]);
  const openPregnancy = breedings.find((b) => stageOf(b) === "pregnant");

  return (
    <>
      <Stack.Screen options={{ title: sows[0]?.name ?? "" }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={s.root} contentContainerStyle={s.content}>
        <Pressable
          style={({ pressed }) => [s.action, pressed && { opacity: 0.85 }]}
          onPress={() =>
            openPregnancy
              ? router.push({ pathname: "/sows/[id]/farrow", params: { id, breedingId: openPregnancy.id } })
              : router.push({ pathname: "/sows/[id]/breed", params: { id } })
          }
        >
          <Text style={s.actionText}>{openPregnancy ? "บันทึกการคลอด" : "เพิ่มการผสม"}</Text>
        </Pressable>
        {!online && <Text style={s.offline}>ออฟไลน์ ดูข้อมูลได้ แต่ต้องมีสัญญาณเพื่อบันทึก</Text>}

        <Text style={s.section}>ประวัติการผสม</Text>
        {breedings.length === 0 && <Text style={s.empty}>ยังไม่มีประวัติการผสม</Text>}
        {breedings.map((b, i) => (
          <BreedingCard key={b.id} breeding={b} number={breedings.length - i} />
        ))}
      </ScrollView>
    </>
  );
}

function BreedingCard({ breeding: b, number }: { breeding: BreedingRow; number: number }) {
  const stage = stageOf(b);
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={[s.cardTitle, stage === "pregnant" && { color: "#ec4899" }]}>ผสมครั้งที่ {number}</Text>
        {stage === "aborted" && <Text style={s.aborted}>แท้ง</Text>}
      </View>
      <Text style={s.line}>
        ผสมเมื่อ {thDate(b.breed_date)}
        {b.boar_breed ? ` · ${b.boar_breed}` : ""}
      </Text>
      {stage === "pregnant" ? <PregnantDetail breeding={b} /> : <FarrowedDetail breeding={b} />}
    </View>
  );
}

function PregnantDetail({ breeding: b }: { breeding: BreedingRow }) {
  const today = new Date();
  const checks = pregnancyCheckDates(new Date(b.breed_date));
  const daysLeft = differenceInCalendarDays(new Date(b.expected_farrow_date), today);
  return (
    <>
      <Text style={s.line}>
        กำหนดคลอด {thDate(b.expected_farrow_date)} ({daysLeft >= 0 ? `อีก ${daysLeft} วัน` : `เลยมา ${-daysLeft} วัน`})
      </Text>
      {checks.map((date, i) => (
        <Text key={i} style={[s.line, { color: date <= today ? "#16a34a" : "#d97706" }]}>
          ตรวจท้อง {i === 0 ? 21 : 42} วัน: {thDate(date)}
        </Text>
      ))}
    </>
  );
}

function FarrowedDetail({ breeding: b }: { breeding: BreedingRow }) {
  if (!b.actual_farrow_date) return null;
  const alive = (b.piglets_male_born_alive ?? 0) + (b.piglets_female_born_alive ?? 0);
  return (
    <>
      <Text style={s.line}>
        {b.is_aborted === 1 ? "แท้งเมื่อ" : "คลอดเมื่อ"} {thDate(b.actual_farrow_date)}
      </Text>
      {b.is_aborted !== 1 && (
        <Text style={s.line}>
          มีชีวิต {alive} ตัว (ผู้ {b.piglets_male_born_alive ?? 0} เมีย {b.piglets_female_born_alive ?? 0}) · ตาย{" "}
          {b.piglets_born_dead ?? 0}
        </Text>
      )}
    </>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: "#f5f5f4" },
  content: { padding: 16, gap: 12 },
  action: { backgroundColor: "#ec4899", borderRadius: 999, paddingVertical: 16, alignItems: "center" },
  actionText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  offline: { backgroundColor: "#fef3c7", color: "#92400e", padding: 10, borderRadius: 10, textAlign: "center" },
  section: { fontSize: 18, fontWeight: "600", marginTop: 8 },
  empty: { color: "#737373" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 17, fontWeight: "600" },
  aborted: { color: "#dc2626", fontWeight: "600" },
  line: { color: "#404040" },
});
