import { useQuery } from "@powersync/react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { DeleteButton, NumberField, SubmitButton } from "../../components/Form";
import { createMedicine, deleteMedicine, saveErrorMessage, updateMedicine } from "../../db/mutations";
import { useOnline } from "../../db/useOnline";
import { Text, TextInput } from "../../theme";
import { haptic } from "../../lib/haptics";

type MedicineDetail = { title: string; description: string | null; stock_count: number | null; uses: number };

export default function MedicineSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { data } = useQuery<MedicineDetail>(
    `select m.title, m.description, m.stock_count,
       (select count(*) from medical_records r where r.medicine_id = m.id) as uses
     from medicines m where m.id = ?`,
    [id]
  );
  const medicine = data[0];
  if (!isNew && !medicine) return null;
  return <MedicineForm key={id} id={id} isNew={isNew} medicine={medicine} />;
}

// Form state starts from the saved row once; later syncs must not overwrite what the farmer is typing.
function MedicineForm({ id, isNew, medicine }: { id: string; isNew: boolean; medicine: MedicineDetail | undefined }) {
  const online = useOnline();
  const [title, setTitle] = useState(medicine?.title ?? "");
  const [description, setDescription] = useState(medicine?.description ?? "");
  const [stock, setStock] = useState(String(medicine?.stock_count ?? 0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const run = async (write: () => Promise<void>, retrySafe = true) => {
    setBusy(true);
    setError(null);
    try {
      await write();
      haptic.success();
      router.back();
    } catch (e) {
      haptic.error();
      setError(saveErrorMessage(e, retrySafe));
      setBusy(false);
    }
  };

  const save = () => {
    const stockCount = stock === "" ? 0 : Number(stock);
    if (!title.trim()) return setError("กรุณากรอกชื่อยาหรือวัคซีน");
    if (!Number.isInteger(stockCount) || stockCount < 0) return setError("กรุณาตรวจสอบจำนวนที่มี");
    const input = { title: title.trim(), description: description.trim(), stock_count: stockCount };
    run(() => (isNew ? createMedicine(input) : updateMedicine(id, input)), !isNew);
  };


  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isNew ? "เพิ่มยาหรือวัคซีน" : "แก้ไขยาหรือวัคซีน" }} />
      <Text style={s.label}>ชื่อยาหรือวัคซีน</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="พิมพ์ชื่อยาหรือวัคซีน" autoCorrect={false} />
      <Text style={s.label}>คำอธิบาย</Text>
      <TextInput style={[s.input, s.multiline]} value={description} onChangeText={setDescription} placeholder="ไม่บังคับ" multiline />
      <NumberField label="จำนวนที่มี" value={stock} onChange={setStock} />
      {error && <Text style={s.error}>{error}</Text>}
      <SubmitButton title={isNew ? "เพิ่มยา" : "บันทึก"} online={online} busy={busy} onPress={save} />
      {!isNew && medicine && (
        <DeleteButton
          label="ลบยา"
          title="ลบยา"
          message={`ต้องการลบ ${medicine.title} หรือไม่`}
          online={online}
          busy={busy}
          blockedReason={medicine.uses > 0 ? `ลบไม่ได้ เพราะมีประวัติการรักษาที่ใช้ยานี้ ${medicine.uses} ครั้ง` : undefined}
          onConfirm={() => run(() => deleteMedicine(id))}
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  label: { fontSize: 16, marginTop: 8 },
  input: { backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  error: { color: "#dc2626", textAlign: "center", marginTop: 8 },
});
