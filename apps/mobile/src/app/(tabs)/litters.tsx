import { useQuery } from "@powersync/react-native";
import { litterStage } from "@sowcycle/core";
import { differenceInCalendarDays } from "date-fns";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button, Card, CardHeader, EmptyText, InfoRow, screen, Segmented } from "../../components/ui";
import { thaiDateLong } from "../../lib/date";
import { color, Text } from "../../theme";
import { Cake, Calendar, Check, PiggyBank, Plus } from "../../theme/icons";
import { FadeIn } from "../../components/motion";
import { useHeaderSearch } from "../../components/HeaderActions";

type LitterRow = {
  id: string;
  sow_name: string;
  birth_date: string | null;
  piglets_born_count: number | null;
  piglets_male_born_alive: number | null;
  piglets_female_born_alive: number | null;
  avg_weight: number | null;
  fattening_at: string | null;
  saleable_at: string | null;
  sold_at: string | null;
};

const LITTERS = `
  select l.*, s.name as sow_name
  from litters l join sows s on s.id = l.sow_id
  order by l.birth_date desc`;

type Filter = "unsold" | "sold";

export default function Litters() {
  const [filter, setFilter] = useState<Filter>("unsold");
  const { query, field } = useHeaderSearch("ค้นหาด้วยชื่อแม่พันธุ์");
  const { data } = useQuery<LitterRow>(LITTERS);
  const q = query.trim().toLowerCase();
  const litters = data
    .filter((l) => (litterStage(l) === "sold") === (filter === "sold"))
    .filter((l) => !q || l.sow_name.toLowerCase().includes(q));

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={screen.root}
      contentContainerStyle={screen.content}
      data={litters}
      keyExtractor={(l) => l.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {field}
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "unsold", label: "ยังไม่ขาย" },
              { value: "sold", label: "ขายแล้ว" },
            ]}
          />
        </View>
      }
      ListEmptyComponent={<EmptyText>ไม่มีครอก</EmptyText>}
      renderItem={({ item, index }) => (
        <FadeIn index={index}>
          <LitterCard litter={item} />
        </FadeIn>
      )}
    />
  );
}

function LitterCard({ litter: l }: { litter: LitterRow }) {
  const stage = litterStage(l);
  const open = () => router.push({ pathname: "/litters/[id]", params: { id: l.id } });
  const age = l.birth_date ? differenceInCalendarDays(l.sold_at ? new Date(l.sold_at) : new Date(), new Date(l.birth_date)) : null;
  const saleDays = l.saleable_at ? differenceInCalendarDays(new Date(l.saleable_at), new Date()) : null;
  return (
    <Card>
      <Card onPress={open} style={s.flush}>
        <CardHeader
          title={`ลูกขุนแม่${l.sow_name}`}
          tone={stage === "sold" ? "default" : stage === "fattening" ? "primary" : "default"}
          subtitle={
            <Text style={s.muted}>
              {stage === "sold" ? "ขายแล้ว · " : stage === "fattening" ? "กำลังขุน · " : ""}
              {age !== null ? `อายุ ${age} วัน` : ""}
            </Text>
          }
        />
        <InfoRow icon={PiggyBank} label="จำนวน">
          <View style={s.row}>
            <Text style={s.value}>{`${l.piglets_born_count ?? 0} ตัว`}</Text>
            <Text style={[s.chip, { backgroundColor: color.blue }]}>{`ผู้ ${l.piglets_male_born_alive ?? 0}`}</Text>
            <Text style={[s.chip, { backgroundColor: color.primary }]}>{`เมีย ${l.piglets_female_born_alive ?? 0}`}</Text>
          </View>
        </InfoRow>
        {l.birth_date && <InfoRow icon={Cake} label="คลอดเมื่อ">{thaiDateLong(l.birth_date)}</InfoRow>}
        {stage !== "nursing" && (
          <InfoRow icon={Calendar} label={stage === "sold" ? "ขายแล้วเมื่อ" : "กำหนดขาย"} tint={stage === "fattening" ? color.orange : color.mutedForeground}>
            <Text style={s.value}>
              {stage === "sold" ? thaiDateLong(l.sold_at!) : l.saleable_at ? thaiDateLong(l.saleable_at) : "-"}
              {stage === "fattening" && saleDays !== null && (
                <Text style={saleDays >= 0 ? s.soon : s.late}>{saleDays >= 0 ? `  อีก ${saleDays} วัน` : `  เลยมา ${-saleDays} วัน`}</Text>
              )}
            </Text>
          </InfoRow>
        )}
        {stage === "sold" && (l.avg_weight ?? 0) > 0 && <InfoRow icon={PiggyBank} label="น้ำหนักขายเฉลี่ย">{`${l.avg_weight} kg`}</InfoRow>}
      </Card>
      {stage === "nursing" && <Button title="เพิ่มวันเริ่มขุน" icon={Plus} variant="secondary" onPress={open} />}
      {stage === "fattening" && <Button title="บันทึกวันขาย" icon={Check} onPress={open} />}
    </Card>
  );
}

const s = StyleSheet.create({
  flush: { padding: 0, borderRadius: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  value: { fontSize: 16, fontWeight: "600", color: color.gray900 },
  muted: { fontSize: 14, color: color.mutedForeground, marginTop: 2 },
  chip: { color: color.primaryForeground, fontSize: 12, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, overflow: "hidden" },
  soon: { fontSize: 14, fontWeight: "500", color: color.orange },
  late: { fontSize: 14, fontWeight: "500", color: color.destructive },
});
