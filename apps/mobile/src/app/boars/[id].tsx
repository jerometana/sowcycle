import { useQuery } from "@powersync/react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { DeleteButton, SubmitButton } from "../../components/Form";
import { createBoar, deleteBoar, saveErrorMessage, updateBoar } from "../../db/mutations";
import { useOnline } from "../../db/useOnline";
import { Text, TextInput } from "../../theme";
import { haptic } from "../../lib/haptics";

type BoarDetail = { breed: string; description: string | null; breedings: number; litters: number };

export default function BoarSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { data } = useQuery<BoarDetail>(
    `select bo.breed, bo.description,
       (select count(*) from breedings b where b.boar_id = bo.id) as breedings,
       (select count(*) from litters l where l.boar_id = bo.id) as litters
     from boars bo where bo.id = ?`,
    [id]
  );
  const boar = data[0];
  if (!isNew && !boar) return null;
  return <BoarForm key={id} id={id} isNew={isNew} boar={boar} />;
}

// Form state starts from the saved row once; later syncs must not overwrite what the farmer is typing.
function BoarForm({ id, isNew, boar }: { id: string; isNew: boolean; boar: BoarDetail | undefined }) {
  const online = useOnline();
  const [breed, setBreed] = useState(boar?.breed ?? "");
  const [description, setDescription] = useState(boar?.description ?? "");
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
    const input = { breed: breed.trim(), description: description.trim() };
    if (!input.breed) return setError("กรุณากรอกสายพันธุ์");
    run(() => (isNew ? createBoar(input) : updateBoar(id, input)), !isNew);
  };

  const uses = (boar?.breedings ?? 0) + (boar?.litters ?? 0);

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
        <DeleteButton
          label="ลบพ่อพันธุ์"
          title="ลบพ่อพันธุ์"
          message={`ต้องการลบ ${boar.breed} หรือไม่`}
          online={online}
          busy={busy}
          blockedReason={uses > 0 ? `ลบไม่ได้ เพราะมีประวัติการผสมหรือครอกที่ใช้พ่อพันธุ์นี้ (${uses} รายการ)` : undefined}
          onConfirm={() => run(() => deleteBoar(id))}
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
