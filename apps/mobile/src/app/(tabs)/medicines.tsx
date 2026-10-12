import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@powersync/react-native";
import { router, Stack } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type MedicineRow = { id: string; title: string; description: string | null; stock_count: number | null; uses: number };

const MEDICINES = `
  select m.id, m.title, m.description, m.stock_count, count(r.id) as uses
  from medicines m left join medical_records r on r.medicine_id = m.id
  group by m.id order by m.title`;

export default function Medicines() {
  const { data } = useQuery<MedicineRow>(MEDICINES);
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              hitSlop={12}
              accessibilityLabel="เพิ่มยา"
              onPress={() => router.push({ pathname: "/medicines/[id]", params: { id: "new" } })}
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
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<Text style={s.empty}>ยังไม่มียาหรือวัคซีน กด + เพื่อเพิ่ม</Text>}
        renderItem={({ item }) => {
          const stock = item.stock_count ?? 0;
          return (
            <Pressable
              style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
              onPress={() => router.push({ pathname: "/medicines/[id]", params: { id: item.id } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.title}</Text>
                {!!item.description && <Text style={s.detail}>{item.description}</Text>}
                <Text style={s.detail}>{item.uses > 0 ? `ใช้ไป ${item.uses} ครั้ง` : "ยังไม่เคยใช้"}</Text>
              </View>
              <Text style={[s.stock, stock <= 0 && s.out]}>{stock > 0 ? `มีอยู่ ${stock}` : "หมด"}</Text>
            </Pressable>
          );
        }}
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
  stock: { color: "#16a34a", fontWeight: "600" },
  out: { color: "#dc2626" },
});
