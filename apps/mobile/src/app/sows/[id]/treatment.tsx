import { useQuery } from "@powersync/react-native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { DateField } from "../../../components/DateField";
import { SubmitButton } from "../../../components/Form";
import { recordTreatment, saveErrorMessage } from "../../../db/mutations";
import { useOnline } from "../../../db/useOnline";
import { Text, TextInput } from "../../../theme";

export default function TreatmentSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useOnline();
  const { data: medicines } = useQuery<{ id: string; title: string; stock_count: number | null }>(
    "select id, title, stock_count from medicines order by title"
  );
  const [medicineId, setMedicineId] = useState<string | null>(null);
  const [usedAt, setUsedAt] = useState(new Date());
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!medicineId) return setError("กรุณาเลือกยาที่ใช้");
    setBusy(true);
    setError(null);
    try {
      await recordTreatment({ sowId: id, medicineId, usedAt, symptoms: symptoms.trim(), notes: notes.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(saveErrorMessage(e, false));
      setBusy(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <DateField label="วันที่ใช้ยา" value={usedAt} onChange={setUsedAt} />
      <Text style={s.label}>ยาที่ใช้</Text>
      {medicines.length === 0 && <Text style={s.hint}>ยังไม่มียา เพิ่มได้ที่แท็บยา</Text>}
      <View style={s.chips}>
        {medicines.map((m) => (
          <Pressable key={m.id} onPress={() => setMedicineId(m.id)} style={[s.chip, medicineId === m.id && s.chipActive]}>
            <Text style={[s.chipText, medicineId === m.id && s.chipTextActive]}>
              {m.title} · {(m.stock_count ?? 0) > 0 ? `มี ${m.stock_count}` : "หมด"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.label}>อาการ</Text>
      <TextInput style={s.input} value={symptoms} onChangeText={setSymptoms} placeholder="เช่น ไข้ ไม่กินอาหาร" />
      <Text style={s.label}>หมายเหตุ</Text>
      <TextInput style={[s.input, s.multiline]} value={notes} onChangeText={setNotes} placeholder="ไม่บังคับ" multiline />
      {error && <Text style={s.error}>{error}</Text>}
      <SubmitButton title="บันทึกการใช้ยา" online={online} busy={busy} onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  label: { fontSize: 16, marginTop: 8 },
  hint: { color: "#737373" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  chipActive: { borderColor: "#ec4899", backgroundColor: "#fdf2f8" },
  chipText: { fontSize: 15 },
  chipTextActive: { color: "#ec4899", fontWeight: "600" },
  input: { backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  error: { color: "#dc2626", textAlign: "center", marginTop: 8 },
});
