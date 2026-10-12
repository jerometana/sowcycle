import { useQuery } from "@powersync/react-native";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SubmitButton } from "../../components/Form";
import { createBoar, deleteBoar, saveErrorMessage, updateBoar } from "../../db/mutations";
import { useOnline } from "../../db/useOnline";

type BoarDetail = { breed: string; description: string | null; breedings: number };

export default function BoarSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const online = useOnline();
  const { data } = useQuery<BoarDetail>(
    `select bo.breed, bo.description, (select count(*) from breedings b where b.boar_id = bo.id) as breedings
     from boars bo where bo.id = ?`,
    [id]
  );
  const boar = data[0];
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (boar) {
      setBreed(boar.breed);
      setDescription(boar.description ?? "");
    }
  }, [boar?.breed, boar?.description]);

  const run = async (write: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await write();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(saveErrorMessage(e));
      setBusy(false);
    }
  };

  const save = () => {
    const input = { breed: breed.trim(), description: description.trim() };
    if (!input.breed) return setError("กรุณากรอกสายพันธุ์");
    run(() => (isNew ? createBoar(input) : updateBoar(id, input)));
  };

  const confirmDelete = () =>
    Alert.alert("ลบพ่อพันธุ์", `ต้องการลบ ${boar?.breed} หรือไม่`, [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: () => run(() => deleteBoar(id)) },
    ]);

  const inUse = (boar?.breedings ?? 0) > 0;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isNew ? "เพิ่มพ่อพันธุ์" : "แก้ไขพ่อพันธุ์" }} />
      <Text style={s.label}>สายพันธุ์</Text>
      <TextInput style={s.input} value={breed} onChangeText={setBreed} placeholder="เช่น Duroc" autoCorrect={false} />
      <Text style={s.label}>คำอธิบาย</Text>
      <TextInput
        style={[s.input, s.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="ไม่บังคับ"
        multiline
      />
      {error && <Text style={s.error}>{error}</Text>}
      <SubmitButton title={isNew ? "เพิ่มพ่อพันธุ์" : "บันทึก"} online={online} busy={busy} onPress={save} />
      {!isNew && boar && (
        <>
          <Pressable
            onPress={confirmDelete}
            disabled={inUse || !online || busy}
            style={({ pressed }) => [s.delete, (inUse || !online) && { opacity: 0.4 }, pressed && { opacity: 0.6 }]}
          >
            <Text style={s.deleteText}>ลบพ่อพันธุ์</Text>
          </Pressable>
          {inUse && <Text style={s.hint}>ลบไม่ได้ เพราะใช้ผสมไปแล้ว {boar.breedings} ครั้ง</Text>}
        </>
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
  delete: { alignItems: "center", paddingVertical: 14, marginTop: 8 },
  deleteText: { color: "#dc2626", fontSize: 16, fontWeight: "600" },
  hint: { textAlign: "center", color: "#737373" },
});
