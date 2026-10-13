import { useStatus } from "@powersync/react-native";
import { FlatList, View } from "react-native";
import { FAB_CLEARANCE } from "../../components/Fab";
import { SowCard } from "../../components/SowCard";
import { EmptyText, screen } from "../../components/ui";
import { useSowCards } from "../../db/sowCards";
import { color, Text } from "../../theme";
import { SummaryCards } from "../../components/SummaryCards";
import { FadeIn } from "../../components/motion";
import { matchesQuery, useHeaderTools } from "../../components/HeaderActions";
import { router } from "expo-router";
import { useState } from "react";
import type { SowCardData } from "../../db/sowCards";

// Same choices as the web's กรองแม่พันธุ์ filter, with ยังอยู่ as the default.
const SOW_FILTERS = {
  active: { label: "ยังอยู่", test: (s: SowCardData) => s.active },
  pregnant: { label: "ตั้งครรภ์", test: (s: SowCardData) => !!s.pregnancy },
  open: { label: "พร้อมผสม", test: (s: SowCardData) => s.active && !s.pregnancy },
  inactive: { label: "ไม่อยู่", test: (s: SowCardData) => !s.active },
  all: { label: "ทั้งหมด", test: () => true },
} as const;
type SowFilter = keyof typeof SOW_FILTERS;

// Shortcut cards over the list. ทั้งหมด counts the sows still on the farm, the default ยังอยู่ view.
const SUMMARY: { key: SowFilter; label: string; tint: string }[] = [
  { key: "active", label: "ทั้งหมด", tint: color.foreground },
  { key: "pregnant", label: "ตั้งครรภ์", tint: color.primary },
];

export default function SowList() {
  const status = useStatus();
  const { sows, isLoading } = useSowCards();
  const [filter, setFilter] = useState<SowFilter>("active");
  const { query, searchBar, overlays } = useHeaderTools({
    add: { label: "เพิ่มแม่พันธุ์", onPress: () => router.push({ pathname: "/sows/[id]/edit", params: { id: "new" } }) },
    filters: [
      {
        key: "status",
        label: "สถานะ",
        options: (Object.keys(SOW_FILTERS) as SowFilter[]).map((key) => ({ key, label: SOW_FILTERS[key].label })),
        value: filter,
        defaultValue: "active",
        onChange: (key) => setFilter(key as SowFilter),
      },
    ],
    search: { placeholder: "ค้นหาด้วยชื่อแม่พันธุ์หรือสายพันธุ์" },
  });
  const shown = sows.filter(SOW_FILTERS[filter].test).filter((sow) => matchesQuery(query, sow.name, sow.breed));

  return (
    <View style={{ flex: 1 }}>
      <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={screen.root}
      contentContainerStyle={[screen.content, { paddingBottom: FAB_CLEARANCE }]}
      data={shown}
      keyExtractor={(sow) => sow.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {searchBar}
          <SummaryCards
            unit="ตัว"
            selected={filter}
            onSelect={(key) => setFilter(key as SowFilter)}
            cards={SUMMARY.map((card) => ({ ...card, count: sows.filter(SOW_FILTERS[card.key].test).length }))}
          />
          {!status.connected && (
            <Text style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: 12, borderRadius: 12, textAlign: "center" }}>
              ออฟไลน์ ข้อมูลจะซิงก์เมื่อมีสัญญาณ
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <EmptyText>{isLoading || !status.hasSynced ? "กำลังโหลด…" : query ? "ไม่พบแม่พันธุ์" : sows.length ? "ไม่มีแม่พันธุ์ตามตัวกรองนี้" : "ยังไม่มีแม่พันธุ์"}</EmptyText>
      }
      renderItem={({ item, index }) => (
        <FadeIn index={index}>
          <SowCard sow={item} />
        </FadeIn>
      )}
      />
      {overlays}
    </View>
  );
}

