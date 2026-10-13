import { useStatus } from "@powersync/react-native";
import { FlatList } from "react-native";
import { SowCard } from "../../components/SowCard";
import { EmptyText, screen } from "../../components/ui";
import { useSowCards } from "../../db/sowCards";
import { Text } from "../../theme";
import { FadeIn } from "../../components/motion";
import { useHeaderTools } from "../../components/HeaderActions";
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

export default function SowList() {
  const status = useStatus();
  const { sows, isLoading } = useSowCards();
  const [filter, setFilter] = useState<SowFilter>("active");
  const shown = sows.filter(SOW_FILTERS[filter].test);
  const tools = useHeaderTools({
    filter: {
      title: "กรองแม่พันธุ์",
      groups: [
        {
          key: "status",
          options: (Object.keys(SOW_FILTERS) as SowFilter[]).map((key) => ({ key, label: SOW_FILTERS[key].label })),
          value: filter,
          defaultValue: "active",
          onChange: (key) => setFilter(key as SowFilter),
        },
      ],
    },
    search: {
      placeholder: "ค้นหาด้วยชื่อแม่พันธุ์",
      emptyText: "ไม่พบแม่พันธุ์",
      items: sows.map((sow) => ({
        key: sow.id,
        title: sow.name,
        subtitle: sow.breed ?? undefined,
        onPress: () => router.push({ pathname: "/sows/[id]", params: { id: sow.id } }),
      })),
    },
  });

  return (
    <>
      {tools}
      <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={screen.root}
      contentContainerStyle={screen.content}
      data={shown}
      keyExtractor={(sow) => sow.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        !status.connected ? (
          <Text style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: 12, borderRadius: 12, textAlign: "center" }}>
            ออฟไลน์ ข้อมูลจะซิงก์เมื่อมีสัญญาณ
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <EmptyText>{isLoading || !status.hasSynced ? "กำลังโหลด…" : sows.length ? "ไม่มีแม่พันธุ์ตามตัวกรองนี้" : "ยังไม่มีแม่พันธุ์"}</EmptyText>
      }
      renderItem={({ item, index }) => (
        <FadeIn index={index}>
          <SowCard sow={item} />
        </FadeIn>
      )}
      />
    </>
  );
}
