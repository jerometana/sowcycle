import { useQuery } from "@powersync/react-native";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useConfirm } from "../../components/Drawer";
import { NumberField, SubmitButton } from "../../components/Form";
import { createMedicine, deleteMedicine, saveErrorMessage, updateMedicine } from "../../db/mutations";
import { useOnline } from "../../db/useOnline";
import { Text, TextInput } from "../../theme";

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
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

  const [confirmDrawer, confirm] = useConfirm();
  const confirmDelete = () =>
    confirm({ title: "ลบยา", message: `ต้องการลบ ${medicine?.title} หรือไม่`, confirmLabel: "ลบยา", onConfirm: () => run(() => deleteMedicine(id)) });

  const inUse = (medicine?.uses ?? 0) > 0;

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
        <>
          <Pressable
            onPress={confirmDelete}
            disabled={inUse || !online || busy}
            style={({ pressed }) => [s.delete, (inUse || !online) && { opacity: 0.4 }, pressed && { opacity: 0.6 }]}
          >
            <Text style={s.deleteText}>ลบยา</Text>
          </Pressable>
          {inUse && <Text style={s.hint}>ลบไม่ได้ เพราะมีประวัติการรักษาที่ใช้ยานี้ {medicine.uses} ครั้ง</Text>}
        </>
      )}
      {confirmDrawer}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  label: { fontSize: 16, marginTop: 8 },
  input: { backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  error: { color: "#dc2626", textAlign: "center", marginTop: 8 },
  delete: { alignItems: "center", paddingVertical: 14, marginTop: 8 },
  deleteText: { color: "#dc2626", fontSize: 16, fontWeight: "600" },
  hint: { textAlign: "center", color: "#737373" },
});
