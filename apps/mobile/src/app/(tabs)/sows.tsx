import { useStatus } from "@powersync/react-native";
import { FlatList } from "react-native";
import { SowCard } from "../../components/SowCard";
import { EmptyText, screen } from "../../components/ui";
import { useSowCards } from "../../db/sowCards";
import { Text } from "../../theme";
import { FadeIn } from "../../components/motion";
import { useHeaderSearch } from "../../components/HeaderActions";
import { router } from "expo-router";

export default function SowList() {
  const status = useStatus();
  const { sows, isLoading } = useSowCards();
  const search = useHeaderSearch({
    placeholder: "ค้นหาด้วยชื่อแม่พันธุ์",
    emptyText: "ไม่พบแม่พันธุ์",
    items: sows.map((sow) => ({
      key: sow.id,
      title: sow.name,
      subtitle: sow.breed ?? undefined,
      onPress: () => router.push({ pathname: "/sows/[id]", params: { id: sow.id } }),
    })),
  });

  return (
    <>
      {search}
      <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={screen.root}
      contentContainerStyle={screen.content}
      data={sows}
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
        <EmptyText>{isLoading || !status.hasSynced ? "กำลังโหลด…" : "ยังไม่มีแม่พันธุ์"}</EmptyText>
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
