import { useQuery, useStatus } from "@powersync/react-native";
import { breedingStage, type BreedingStage } from "@sowcycle/core";
import { differenceInCalendarDays, format } from "date-fns";
import { th } from "date-fns/locale";
import { FlatList, StyleSheet, Text, View } from "react-native";

type SowRow = {
  id: string;
  name: string;
  breed_date: string | null;
  expected_farrow_date: string | null;
  actual_farrow_date: string | null;
  is_aborted: number | null;
};

type SowListItem = {
  id: string;
  name: string;
  stage: BreedingStage | "open";
  farrowDate: Date | null;
};

const SOWS_WITH_LATEST_BREEDING = `
  select s.id, s.name, b.breed_date, b.expected_farrow_date, b.actual_farrow_date, b.is_aborted
  from sows s
  left join breedings b on b.id = (
    select id from breedings where sow_id = s.id order by breed_date desc limit 1
  )
  where coalesce(s.is_active, 1) = 1
  order by s.name`;

const toListItem = (row: SowRow): SowListItem => {
  if (!row.breed_date) return { id: row.id, name: row.name, stage: "open", farrowDate: null };
  const stage = breedingStage({
    actual_farrow_date: row.actual_farrow_date ?? undefined,
    is_aborted: row.is_aborted === 1,
  });
  const farrow = stage === "pregnant" ? row.expected_farrow_date : row.actual_farrow_date;
  return { id: row.id, name: row.name, stage, farrowDate: farrow ? new Date(farrow) : null };
};

const STAGE_LABEL: Record<SowListItem["stage"], { text: string; color: string }> = {
  pregnant: { text: "ตั้งท้อง", color: "#ec4899" },
  farrowed: { text: "คลอดแล้ว", color: "#16a34a" },
  aborted: { text: "แท้ง", color: "#dc2626" },
  open: { text: "ว่าง", color: "#737373" },
};

export default function SowList() {
  const status = useStatus();
  const { data, isLoading } = useQuery<SowRow>(SOWS_WITH_LATEST_BREEDING);
  const sows = data.map(toListItem);

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={s.root}
      data={sows}
      keyExtractor={(sow) => sow.id}
      ListHeaderComponent={
        !status.connected ? <Text style={s.offline}>ออฟไลน์ ข้อมูลจะซิงก์เมื่อมีสัญญาณ</Text> : null
      }
      ListEmptyComponent={
        <Text style={s.empty}>{isLoading || !status.hasSynced ? "กำลังโหลด…" : "ยังไม่มีแม่พันธุ์"}</Text>
      }
      renderItem={({ item }) => <SowRowView sow={item} />}
    />
  );
}

function SowRowView({ sow }: { sow: SowListItem }) {
  const label = STAGE_LABEL[sow.stage];
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{sow.name}</Text>
        {sow.farrowDate && <Text style={s.detail}>{farrowDetail(sow.stage, sow.farrowDate)}</Text>}
      </View>
      <Text style={[s.chip, { color: label.color, borderColor: label.color }]}>{label.text}</Text>
    </View>
  );
}

const farrowDetail = (stage: SowListItem["stage"], date: Date) => {
  const formatted = format(date, "d MMM", { locale: th });
  if (stage !== "pregnant") return `คลอดเมื่อ ${formatted}`;
  const days = differenceInCalendarDays(date, new Date());
  return days >= 0 ? `กำหนดคลอด ${formatted} (อีก ${days} วัน)` : `กำหนดคลอด ${formatted} (เลยมา ${-days} วัน)`;
};

const s = StyleSheet.create({
  root: { backgroundColor: "#f5f5f4" },
  offline: { backgroundColor: "#fef3c7", color: "#92400e", padding: 12, textAlign: "center" },
  empty: { textAlign: "center", color: "#737373", marginTop: 48 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
  },
  name: { fontSize: 18, fontWeight: "600" },
  detail: { color: "#525252", marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, overflow: "hidden" },
});
