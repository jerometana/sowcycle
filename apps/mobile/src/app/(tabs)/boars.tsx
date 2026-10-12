import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@powersync/react-native";
import { router, Stack } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type BoarRow = { id: string; breed: string; description: string | null; breedings: number };

const BOARS = `
  select bo.id, bo.breed, bo.description, count(b.id) as breedings
  from boars bo left join breedings b on b.boar_id = bo.id
  group by bo.id order by bo.breed`;

export default function Boars() {
  const { data } = useQuery<BoarRow>(BOARS);
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              hitSlop={12}
              accessibilityLabel="เพิ่มพ่อพันธุ์"
              onPress={() => router.push({ pathname: "/boars/[id]", params: { id: "new" } })}
              style={{ paddingHorizontal: 16 }}
            >
              <Ionicons name="add" size={28} color="#ec4899" />
            </Pressable>
          ),
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={s.root}
        data={data}
        keyExtractor={(b) => b.id}
        ListEmptyComponent={<Text style={s.empty}>ยังไม่มีพ่อพันธุ์ กด + เพื่อเพิ่ม</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: "/boars/[id]", params: { id: item.id } })}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.breed}</Text>
              {!!item.description && <Text style={s.detail}>{item.description}</Text>}
            </View>
            <Text style={s.count}>{item.breedings > 0 ? `ใช้ผสม ${item.breedings} ครั้ง` : "ยังไม่เคยใช้"}</Text>
          </Pressable>
        )}
      />
    </>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: "#f5f5f4" },
  empty: { textAlign: "center", color: "#737373", marginTop: 48 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 16 },
  name: { fontSize: 18, fontWeight: "600" },
  detail: { color: "#525252", marginTop: 4 },
  count: { color: "#737373" },
});
