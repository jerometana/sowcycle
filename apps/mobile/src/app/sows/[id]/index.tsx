import { useQuery } from "@powersync/react-native";
import { breedingStage, countsTowardLitterStats, pregnancyCheckDates, type BreedingStage } from "@sowcycle/core";
import { differenceInCalendarDays } from "date-fns";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ColumnChart, type ChartPoint } from "../../../components/ColumnChart";
import { useConfirm } from "../../../components/Drawer";
import { Button, Card, CardHeader, EmptyText, InfoRow, screen, Segmented } from "../../../components/ui";
import { deleteTreatment, saveErrorMessage } from "../../../db/mutations";
import { useOnline } from "../../../db/useOnline";
import { thaiDateLong, thaiMonthYear } from "../../../lib/date";
import { color, Text } from "../../../theme";
import {
  Activity,
  Cake,
  Calendar,
  Check,
  ChevronRight,
  CircleAlert,
  Dna,
  Heart,
  House,
  Milk,
  PiggyBank,
  Plus,
  Syringe,
} from "../../../theme/icons";
import { haptic } from "../../../lib/haptics";

type SowRow = { name: string; breasts_count: number | null; birth_date: string | null; add_date: string | null };

type BreedingRow = {
  id: string;
  breed_date: string;
  expected_farrow_date: string;
  actual_farrow_date: string | null;
  is_aborted: number | null;
  piglets_male_born_alive: number | null;
  piglets_female_born_alive: number | null;
  piglets_born_dead: number | null;
  piglets_born_count: number | null;
  boar_breed: string | null;
};

type TreatmentRow = { id: string; used_at: string; symptoms: string | null; notes: string | null; medicine: string | null };
type SoldLitterRow = { id: string; sold_at: string | null; avg_weight: number | null };

const BREEDINGS = `
  select b.*, bo.breed as boar_breed
  from breedings b left join boars bo on bo.id = b.boar_id
  where b.sow_id = ? order by b.breed_date desc`;

const TREATMENTS = `
  select r.id, r.used_at, r.symptoms, r.notes, m.title as medicine
  from medical_records r left join medicines m on m.id = r.medicine_id
  where r.sow_id = ? order by r.used_at desc`;

const stageOf = (b: BreedingRow): BreedingStage =>
  breedingStage({ actual_farrow_date: b.actual_farrow_date ?? undefined, is_aborted: b.is_aborted === 1 });

const daysUntil = (date: Date | string) => differenceInCalendarDays(new Date(date), new Date());

const pigletPoints = (breedings: BreedingRow[]): ChartPoint[] =>
  breedings
    .filter((b) =>
      countsTowardLitterStats({
        actual_farrow_date: b.actual_farrow_date ?? undefined,
        is_aborted: b.is_aborted === 1,
        piglets_born_count: b.piglets_born_count,
      })
    )
    .sort((a, b) => a.actual_farrow_date!.localeCompare(b.actual_farrow_date!))
    .map((b) => ({ key: b.id, label: thaiMonthYear(b.actual_farrow_date!), value: b.piglets_born_count ?? 0 }));

// avg_weight holds the birth weight until a sale overwrites it, so only sold litters carry a sale weight.
const saleWeightPoints = (litters: SoldLitterRow[]): ChartPoint[] =>
  litters
    .filter((l) => l.sold_at && (l.avg_weight ?? 0) > 0)
    .sort((a, b) => a.sold_at!.localeCompare(b.sold_at!))
    .map((l) => ({ key: l.id, label: thaiMonthYear(l.sold_at!), value: l.avg_weight! }));

type Tab = "details" | "history";
type HistoryFilter = "all" | "breedings" | "treatments";

export default function SowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useOnline();
  const [tab, setTab] = useState<Tab>("details");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const { data: sows } = useQuery<SowRow>("select name, breasts_count, birth_date, add_date from sows where id = ?", [id]);
  const { data: breedings } = useQuery<BreedingRow>(BREEDINGS, [id]);
  const { data: treatments } = useQuery<TreatmentRow>(TREATMENTS, [id]);
  const { data: litters } = useQuery<SoldLitterRow>("select id, sold_at, avg_weight from litters where sow_id = ?", [id]);
  const sow = sows[0];
  const openPregnancy = breedings.find((b) => stageOf(b) === "pregnant");
  const breed = breedings.find((b) => b.boar_breed)?.boar_breed;

  const history = [
    ...(filter !== "treatments" ? breedings.map((b, i) => ({ kind: "breeding" as const, date: b.breed_date, b, n: breedings.length - i })) : []),
    ...(filter !== "breedings" ? treatments.map((t) => ({ kind: "treatment" as const, date: t.used_at, t })) : []),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={screen.root} contentContainerStyle={screen.content}>
      <Stack.Screen options={{ title: sow?.name ?? "" }} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "details", label: "รายละเอียด" },
          { value: "history", label: "บันทึกประวัติ" },
        ]}
      />

      {tab === "details" && sow && (
        <>
          <Card>
            <InfoRow icon={Heart} label="สถานะ" tint={openPregnancy ? color.primary : color.mutedForeground}>
              {openPregnancy ? (
                <View style={s.statusRow}>
                  <Text style={[s.value, { color: color.primary }]}>ตั้งครรภ์</Text>
                  <Text style={s.badge}>{`คลอดใน ${daysUntil(openPregnancy.expected_farrow_date)} วัน`}</Text>
                </View>
              ) : (
                "ว่าง"
              )}
            </InfoRow>
            <InfoRow icon={Milk} label="จำนวนเต้านม">{sow.breasts_count ? `${sow.breasts_count} เต้า` : "-"}</InfoRow>
            <InfoRow icon={Cake} label="วันเกิด">{sow.birth_date ? thaiDateLong(sow.birth_date, true) : "-"}</InfoRow>
            <InfoRow icon={House} label="รับเข้าเมื่อ">{sow.add_date ? thaiDateLong(sow.add_date, true) : "-"}</InfoRow>
            {breed && (
              <Pressable onPress={() => router.push("/boars")} style={s.breedBox}>
                <View style={s.whiteSquare}>
                  <Dna size={24} color={color.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>สายพันธุ์</Text>
                  <Text>{breed}</Text>
                </View>
                <ChevronRight size={20} color={color.mutedForeground} />
              </Pressable>
            )}
          </Card>
          <ColumnChart title="จำนวนลูกมีชีวิตต่อครอก" unit="ตัว" points={pigletPoints(breedings)} />
          <ColumnChart title="น้ำหนักขายเฉลี่ยต่อครอก (กก.)" unit="กก." points={saleWeightPoints(litters)} />
        </>
      )}

      {tab === "history" && (
        <>
          <View style={s.filters}>
            {(
              [
                ["all", "ทั้งหมด", null],
                ["breedings", `การผสม (${breedings.length})`, Heart],
                ["treatments", `การใช้ยา (${treatments.length})`, Syringe],
              ] as const
            ).map(([value, label, Icon]) => (
              <Pressable key={value} onPress={() => setFilter(value)} style={[s.filter, filter === value && s.filterActive]}>
                {Icon && <Icon size={14} color={filter === value ? color.primary : color.foreground} />}
                <Text style={[s.filterText, filter === value && { color: color.primary }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ gap: 8 }}>
            {openPregnancy ? (
              <Button
                title="บันทึกการคลอด"
                icon={Check}
                disabled={!online}
                onPress={() => router.push({ pathname: "/sows/[id]/farrow", params: { id, breedingId: openPregnancy.id } })}
              />
            ) : (
              <Button title="เพิ่มประวัติผสม" icon={Plus} variant="surface" disabled={!online} onPress={() => router.push({ pathname: "/sows/[id]/breed", params: { id } })} />
            )}
            <Button title="บันทึกการใช้ยา" icon={Syringe} variant="surface" disabled={!online} onPress={() => router.push({ pathname: "/sows/[id]/treatment", params: { id } })} />
            {!online && <Text style={s.offline}>ออฟไลน์ ดูข้อมูลได้ แต่ต้องมีสัญญาณเพื่อบันทึก</Text>}
          </View>
          {history.length === 0 && <EmptyText>ยังไม่มีประวัติ</EmptyText>}
          {history.map((h) =>
            h.kind === "breeding" ? <BreedingCard key={`b${h.b.id}`} breeding={h.b} number={h.n} /> : <TreatmentCard key={`t${h.t.id}`} treatment={h.t} />
          )}
        </>
      )}
    </ScrollView>
  );
}

function BreedingCard({ breeding: b, number }: { breeding: BreedingRow; number: number }) {
  const stage = stageOf(b);
  const pregnant = stage === "pregnant";
  const [check1, check2] = pregnancyCheckDates(new Date(b.breed_date));
  const checkRow = (date: Date, n: number) => {
    const days = daysUntil(date);
    return (
      <InfoRow key={n} icon={CircleAlert} tint={days > 0 ? color.amber : color.green} label={`กลับสัดครั้งที่ ${n}`}>
        <Text style={s.value}>
          {thaiDateLong(date, true)}
          {days > 0 && <Text style={s.amber}>{`  อีก ${days} วัน`}</Text>}
        </Text>
      </InfoRow>
    );
  };
  const earlyLate = b.actual_farrow_date ? differenceInCalendarDays(new Date(b.expected_farrow_date), new Date(b.actual_farrow_date)) : 0;
  return (
    <Card>
      <CardHeader
        title={`ผสมครั้งที่ ${number}`}
        tone={pregnant ? "primary" : "default"}
        chevron={false}
        inline={
          pregnant ? (
            <Text style={s.subtitlePink}>{`  (คลอดภายใน ${daysUntil(b.expected_farrow_date)} วัน)`}</Text>
          ) : stage === "aborted" ? (
            <Text style={s.subtitleRed}>{"  (แท้ง)"}</Text>
          ) : null
        }
      />
      <InfoRow icon={Heart} label="ผสมเมื่อ" tint={pregnant ? color.primary : color.mutedForeground}>
        {thaiDateLong(b.breed_date, true)}
      </InfoRow>
      {pregnant && [checkRow(check1, 1), checkRow(check2, 2)]}
      {pregnant ? (
        <InfoRow icon={Calendar} label="กำหนดคลอด" tint={color.primary}>
          {thaiDateLong(b.expected_farrow_date, true)}
        </InfoRow>
      ) : (
        b.actual_farrow_date && (
          <InfoRow icon={Calendar} label={stage === "aborted" ? "แท้งเมื่อ" : "คลอดเมื่อ"}>
            <Text style={s.value}>
              {thaiDateLong(b.actual_farrow_date, true)}
              {stage === "farrowed" && earlyLate !== 0 && (
                <Text style={s.muted}>{earlyLate > 0 ? `  ก่อนกำหนด ${earlyLate} วัน` : `  หลังกำหนด ${-earlyLate} วัน`}</Text>
              )}
            </Text>
          </InfoRow>
        )
      )}
      {b.boar_breed && (
        <View style={s.breedBox}>
          <View style={s.whiteSquare}>
            <Dna size={24} color={color.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>พ่อพันธุ์</Text>
            <Text style={s.value}>{b.boar_breed}</Text>
          </View>
        </View>
      )}
      {stage === "farrowed" && (
        <View style={s.breedBox}>
          <View style={s.whiteSquare}>
            <PiggyBank size={24} color={color.mutedForeground} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.label}>จำนวนลูกเกิดรอด</Text>
            <View style={s.statusRow}>
              <Text style={s.value}>{`${(b.piglets_male_born_alive ?? 0) + (b.piglets_female_born_alive ?? 0)} ตัว`}</Text>
              <Text style={[s.sexChip, { backgroundColor: color.blue }]}>{`ผู้ ${b.piglets_male_born_alive ?? 0}`}</Text>
              <Text style={[s.sexChip, { backgroundColor: color.primary }]}>{`เมีย ${b.piglets_female_born_alive ?? 0}`}</Text>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}

function TreatmentCard({ treatment: t }: { treatment: TreatmentRow }) {
  const [confirmDrawer, confirm] = useConfirm();
  const confirmDelete = () => {
    haptic.longPress();
    confirm({
      title: "ลบประวัติการรักษา",
      message: `ลบการใช้ ${t.medicine ?? "ยา"} วันที่ ${thaiDateLong(t.used_at, true)} หรือไม่`,
      confirmLabel: "ลบ",
      onConfirm: () =>
        deleteTreatment(t.id)
          .then(haptic.success)
          .catch((e) => {
            haptic.error();
            Alert.alert("ลบไม่สำเร็จ", saveErrorMessage(e));
          }),
    });
  };
  return (
    <Pressable onLongPress={confirmDelete} delayLongPress={400}>
      <Card>
        <CardHeader
          title={t.medicine ?? "ไม่ระบุยา"}
          chevron={false}
          subtitle={<Text style={s.muted}>{thaiDateLong(t.used_at, true)}</Text>}
        />
        {!!t.symptoms && <InfoRow icon={Activity} label="อาการ">{t.symptoms}</InfoRow>}
        {!!t.notes && <Text style={s.muted}>{t.notes}</Text>}
      </Card>
      {confirmDrawer}
    </Pressable>
  );
}

const s = StyleSheet.create({
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  value: { fontSize: 16, fontWeight: "600", color: color.gray900 },
  badge: { backgroundColor: color.primary, color: color.primaryForeground, fontSize: 13, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  label: { fontSize: 14, color: color.mutedForeground },
  muted: { fontSize: 14, fontWeight: "400", color: color.mutedForeground },
  amber: { fontSize: 14, fontWeight: "500", color: color.amber },
  subtitlePink: { fontSize: 14, fontWeight: "400", color: color.primary },
  subtitleRed: { fontSize: 14, fontWeight: "400", color: color.destructive },
  breedBox: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: color.secondary, borderRadius: 16, padding: 12 },
  whiteSquare: { width: 48, height: 48, borderRadius: 14, backgroundColor: color.card, alignItems: "center", justifyContent: "center" },
  sexChip: { color: color.primaryForeground, fontSize: 12, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, overflow: "hidden" },
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filter: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: color.card, borderWidth: 1, borderColor: color.card },
  filterActive: { borderColor: color.primary, backgroundColor: "#fdf2f8" },
  filterText: { fontSize: 14, fontWeight: "500", color: color.foreground },
  offline: { backgroundColor: "#fef3c7", color: "#92400e", padding: 10, borderRadius: 12, textAlign: "center" },
});
