import { useQuery } from "@powersync/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Fab } from "../../components/Fab";
import { Card, CardHeader, EmptyText, InfoRow, screen, SearchBar, Segmented } from "../../components/ui";
import { thaiDateLong } from "../../lib/date";
import { color, Text } from "../../theme";
import { Activity, Syringe } from "../../theme/icons";
import { FadeIn } from "../../components/motion";

type MedicineRow = { id: string; title: string; description: string | null; stock_count: number | null; uses: number };
type UsageRow = { id: string; sow_id: string; sow_name: string; medicine: string | null; used_at: string; symptoms: string | null };

const MEDICINES = `
  select m.id, m.title, m.description, m.stock_count, count(r.id) as uses
  from medicines m left join medical_records r on r.medicine_id = m.id
  group by m.id order by m.title`;

const USAGE = `
  select r.id, r.sow_id, s.name as sow_name, m.title as medicine, r.used_at, r.symptoms
  from medical_records r join sows s on s.id = r.sow_id left join medicines m on m.id = r.medicine_id
  order by r.used_at desc`;

type Tab = "stock" | "usage";

export default function Medicines() {
  const [tab, setTab] = useState<Tab>("stock");
  const [query, setQuery] = useState("");
  const { data: medicines } = useQuery<MedicineRow>(MEDICINES);
  const { data: usage } = useQuery<UsageRow>(USAGE);
  const q = query.trim().toLowerCase();

  const header = (
    <View style={{ gap: 12 }}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "stock", label: "คลังยา" },
          { value: "usage", label: "ประวัติใช้ยา" },
        ]}
      />
      <SearchBar value={query} onChange={setQuery} placeholder={tab === "stock" ? "ค้นหาด้วยชื่อยาหรือวัคซีน" : "ค้นหาด้วยชื่อแม่พันธุ์หรือยา"} />
    </View>
  );

  return (
    <View style={screen.root}>
      {tab === "stock" ? (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[screen.content, { paddingBottom: 96 }]}
          data={medicines.filter((m) => !q || m.title.toLowerCase().includes(q))}
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyText>ยังไม่มียาหรือวัคซีน</EmptyText>}
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
          contentContainerStyle={screen.content}
          data={usage.filter((u) => !q || u.sow_name.toLowerCase().includes(q) || (u.medicine ?? "").toLowerCase().includes(q))}
          keyExtractor={(u) => u.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyText>ยังไม่มีประวัติการใช้ยา</EmptyText>}
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
      {tab === "stock" && <Fab label="เพิ่มยา" onPress={() => router.push({ pathname: "/medicines/[id]", params: { id: "new" } })} />}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muted: { fontSize: 14, color: color.mutedForeground, marginTop: 2 },
  stock: { fontSize: 15, fontWeight: "600", color: color.green },
});
