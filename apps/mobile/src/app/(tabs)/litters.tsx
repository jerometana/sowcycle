import { useQuery } from "@powersync/react-native";
import { litterStage, type LitterStage } from "@sowcycle/core";
import { differenceInCalendarDays } from "date-fns";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { thaiDate } from "../../lib/date";
import { LITTER_STAGE_LABEL } from "../../lib/litterLabels";

type LitterRow = {
  id: string;
  sow_name: string;
  birth_date: string | null;
  piglets_born_count: number | null;
  fattening_at: string | null;
  saleable_at: string | null;
  sold_at: string | null;
};

const LITTERS = `
  select l.id, s.name as sow_name, l.birth_date, l.piglets_born_count, l.fattening_at, l.saleable_at, l.sold_at
  from litters l join sows s on s.id = l.sow_id
  order by l.birth_date desc`;

const detailOf = (l: LitterRow, stage: LitterStage) => {
  const today = new Date();
  if (stage === "sold" && l.sold_at) return `ขายเมื่อ ${thaiDate(l.sold_at, true)}`;
  if (stage === "fattening" && l.saleable_at) {
    const days = differenceInCalendarDays(new Date(l.saleable_at), today);
    return `กำหนดขาย ${thaiDate(l.saleable_at, true)} (${days >= 0 ? `อีก ${days} วัน` : `เลยมา ${-days} วัน`})`;
  }
  if (l.birth_date) return `อายุ ${differenceInCalendarDays(today, new Date(l.birth_date))} วัน`;
  return "";
};

export default function Litters() {
  const [showSold, setShowSold] = useState(false);
  const { data } = useQuery<LitterRow>(LITTERS);
  const litters = data.filter((l) => (litterStage(l) === "sold") === showSold);

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={s.root}
      data={litters}
      keyExtractor={(l) => l.id}
      ListHeaderComponent={
        <View style={s.segment}>
          {[false, true].map((sold) => (
            <Pressable key={String(sold)} onPress={() => setShowSold(sold)} style={[s.segItem, showSold === sold && s.segActive]}>
              <Text style={[s.segText, showSold === sold && s.segTextActive]}>{sold ? "ขายแล้ว" : "ยังไม่ขาย"}</Text>
            </Pressable>
          ))}
        </View>
      }
      ListEmptyComponent={<Text style={s.empty}>ไม่มีครอก</Text>}
      renderItem={({ item }) => {
        const stage = litterStage(item);
        const label = LITTER_STAGE_LABEL[stage];
        return (
          <Pressable
            style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: "/litters/[id]", params: { id: item.id } })}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.name}>แม่ {item.sow_name}</Text>
              <Text style={s.detail}>
                {item.birth_date ? `คลอด ${thaiDate(item.birth_date, true)} · ` : ""}
                {item.piglets_born_count ?? 0} ตัว
              </Text>
              <Text style={s.detail}>{detailOf(item, stage)}</Text>
            </View>
            <Text style={[s.chip, { color: label.color, borderColor: label.color }]}>{label.text}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: "#f5f5f4" },
  segment: { flexDirection: "row", margin: 16, marginBottom: 4, backgroundColor: "#e7e5e4", borderRadius: 12, padding: 3 },
  segItem: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  segActive: { backgroundColor: "#fff" },
  segText: { color: "#57534e" },
  segTextActive: { color: "#000", fontWeight: "600" },
  empty: { textAlign: "center", color: "#737373", marginTop: 48 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 16 },
  name: { fontSize: 18, fontWeight: "600" },
  detail: { color: "#525252", marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, overflow: "hidden" },
});
