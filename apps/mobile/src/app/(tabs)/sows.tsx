import { useStatus } from "@powersync/react-native";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { SowCard } from "../../components/SowCard";
import { EmptyText, SearchBar, screen } from "../../components/ui";
import { useSowCards } from "../../db/sowCards";
import { Text } from "../../theme";

export default function SowList() {
  const status = useStatus();
  const { sows, isLoading } = useSowCards();
  const [query, setQuery] = useState("");
  const shown = sows.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={screen.root}
      contentContainerStyle={screen.content}
      data={shown}
      keyExtractor={(sow) => sow.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {!status.connected && (
            <Text style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: 12, borderRadius: 12, textAlign: "center" }}>
              ออฟไลน์ ข้อมูลจะซิงก์เมื่อมีสัญญาณ
            </Text>
          )}
          <SearchBar value={query} onChange={setQuery} placeholder="ค้นหาด้วยชื่อแม่พันธุ์" />
        </View>
      }
      ListEmptyComponent={
        <EmptyText>{isLoading || !status.hasSynced ? "กำลังโหลด…" : query ? "ไม่พบแม่พันธุ์" : "ยังไม่มีแม่พันธุ์"}</EmptyText>
      }
      renderItem={({ item }) => <SowCard sow={item} />}
    />
  );
}
