import { useQuery } from "@powersync/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Card, CardHeader, EmptyText, InfoRow, screen, Segmented } from "../../components/ui";
import { thaiDateLong } from "../../lib/date";
import { color, Text } from "../../theme";
import { Activity, Syringe } from "../../theme/icons";
import { FAB_CLEARANCE } from "../../components/Fab";
import { FadeIn } from "../../components/motion";
import { differenceInCalendarDays } from "date-fns";
import { matchesQuery, useHeaderTools, type FilterGroup } from "../../components/HeaderActions";

type MedicineRow = { id: string; title: string; description: string | null; stock_count: number | null; uses: number };
type UsageRow = {
  id: string;
  sow_id: string;
  sow_name: string;
  medicine_id: string | null;
  medicine: string | null;
  used_at: string;
  symptoms: string | null;
};

const MEDICINES = `
  select m.id, m.title, m.description, m.stock_count, count(r.id) as uses
  from medicines m left join medical_records r on r.medicine_id = m.id
  group by m.id order by m.title`;

const USAGE = `
  select r.id, r.sow_id, s.name as sow_name, r.medicine_id, m.title as medicine, r.used_at, r.symptoms
  from medical_records r join sows s on s.id = r.sow_id left join medicines m on m.id = r.medicine_id
  order by r.used_at desc`;

type Tab = "stock" | "usage";

const STOCK_FILTERS = {
  all: { label: "ทั้งหมด", test: () => true },
  inStock: { label: "มีอยู่", test: (m: MedicineRow) => (m.stock_count ?? 0) > 0 },
  out: { label: "หมด", test: (m: MedicineRow) => (m.stock_count ?? 0) <= 0 },
} as const;
type StockFilter = keyof typeof STOCK_FILTERS;

const PERIODS = {
  all: { label: "ทั้งหมด", days: null },
  d30: { label: "30 วันล่าสุด", days: 30 },
  d90: { label: "90 วันล่าสุด", days: 90 },
} as const;
type Period = keyof typeof PERIODS;

const ALL_MEDICINES = "all";

export default function Medicines() {
  const [tab, setTab] = useState<Tab>("stock");
  const { data: medicines } = useQuery<MedicineRow>(MEDICINES);
  const { data: usage } = useQuery<UsageRow>(USAGE);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [period, setPeriod] = useState<Period>("all");
  const [chosenMedicine, setMedicine] = useState(ALL_MEDICINES);
  // A medicine deleted since it was chosen falls back to all.
  const medicineId = medicines.some((m) => m.id === chosenMedicine) ? chosenMedicine : ALL_MEDICINES;

  const filters: FilterGroup[] =
    tab === "stock"
      ? [
          {
            key: "stock",
            label: "สต็อก",
            options: (Object.keys(STOCK_FILTERS) as StockFilter[]).map((key) => ({ key, label: STOCK_FILTERS[key].label })),
            value: stockFilter,
            defaultValue: "all",
            onChange: (key) => setStockFilter(key as StockFilter),
          },
        ]
      : [
          {
            key: "medicine",
            label: "ยาหรือวัคซีน",
            options: [{ key: ALL_MEDICINES, label: "ทั้งหมด" }, ...medicines.map((m) => ({ key: m.id, label: m.title }))],
            value: medicineId,
            defaultValue: ALL_MEDICINES,
            onChange: setMedicine,
          },
          {
            key: "period",
            label: "ช่วงเวลา",
            options: (Object.keys(PERIODS) as Period[]).map((key) => ({ key, label: PERIODS[key].label })),
            value: period,
            defaultValue: "all",
            onChange: (key) => setPeriod(key as Period),
          },
        ];

  const { query, searchBar, overlays } = useHeaderTools({
    add: { label: "เพิ่มยา", onPress: () => router.push({ pathname: "/medicines/[id]", params: { id: "new" } }) },
    filters,
    search: { placeholder: tab === "stock" ? "ค้นหาด้วยชื่อยาหรือวัคซีน" : "ค้นหาด้วยชื่อแม่พันธุ์หรือยา" },
  });

  const days = PERIODS[period].days;
  const shownMedicines = medicines.filter((m) => STOCK_FILTERS[stockFilter].test(m) && matchesQuery(query, m.title, m.description));
  const shownUsage = usage.filter(
    (u) =>
      (medicineId === ALL_MEDICINES || u.medicine_id === medicineId) &&
      (days === null || differenceInCalendarDays(new Date(), new Date(u.used_at)) <= days) &&
      matchesQuery(query, u.medicine, u.sow_name)
  );

  const header = (
    <View style={{ gap: 12 }}>
      {searchBar}
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "stock", label: "คลังยา" },
          { value: "usage", label: "ประวัติใช้ยา" },
        ]}
      />
    </View>
  );

  return (
    <View style={screen.root}>
      {tab === "stock" ? (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[screen.content, { paddingBottom: FAB_CLEARANCE }]}
          data={shownMedicines}
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyText>{medicines.length ? "ไม่พบยาหรือวัคซีน" : "ยังไม่มียาหรือวัคซีน"}</EmptyText>}
          renderItem={({ item, index }) => {
            const stock = item.stock_count ?? 0;
            return (
              <FadeIn index={index}>
                <Card onPress={() => router.push({ pathname: "/medicines/[id]", params: { id: item.id } })}>
                  <CardHeader
                    title={item.title}
                    subtitle={!!item.description && <Text style={s.muted}>{item.description}</Text>}
                  />
                  <View style={s.row}>
                    <Text style={[s.stock, stock <= 0 && { color: color.destructive }]}>{stock > 0 ? `มีอยู่ ${stock}` : "หมด"}</Text>
                    <Text style={s.muted}>{item.uses > 0 ? `ใช้ไป ${item.uses} ครั้ง` : "ยังไม่เคยใช้"}</Text>
                  </View>
                </Card>
              </FadeIn>
            );
          }}
        />
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[screen.content, { paddingBottom: FAB_CLEARANCE }]}
          data={shownUsage}
          keyExtractor={(u) => u.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyText>{usage.length ? "ไม่พบประวัติการใช้ยา" : "ยังไม่มีประวัติการใช้ยา"}</EmptyText>}
          renderItem={({ item, index }) => (
            <FadeIn index={index}>
              <Card onPress={() => router.push({ pathname: "/sows/[id]", params: { id: item.sow_id } })}>
                <CardHeader title={item.medicine ?? "ไม่ระบุยา"} subtitle={<Text style={s.muted}>{`${item.sow_name} · ${thaiDateLong(item.used_at, true)}`}</Text>} />
                {item.symptoms ? <InfoRow icon={Activity} label="อาการ">{item.symptoms}</InfoRow> : <InfoRow icon={Syringe} label="อาการ">-</InfoRow>}
              </Card>
            </FadeIn>
          )}
        />
      )}
      {overlays}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muted: { fontSize: 14, color: color.mutedForeground, marginTop: 2 },
  stock: { fontSize: 15, fontWeight: "600", color: color.green },
});
