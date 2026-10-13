import { useQuery } from "@powersync/react-native";
import { farrowFormSchema } from "@sowcycle/core";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { DateField } from "../../../components/DateField";
import { NumberField, SubmitButton } from "../../../components/Form";
import { recordFarrow, saveErrorMessage } from "../../../db/mutations";
import { useOnline } from "../../../db/useOnline";
import { Text } from "../../../theme";

export default function FarrowSheet() {
  const { breedingId } = useLocalSearchParams<{ id: string; breedingId: string }>();
  const online = useOnline();
  const { data } = useQuery<{ breed_date: string }>("select breed_date from breedings where id = ?", [breedingId]);
  const [farrowDate, setFarrowDate] = useState(new Date());
  const [male, setMale] = useState("");
  const [female, setFemale] = useState("");
  const [dead, setDead] = useState("");
  const [weight, setWeight] = useState("");
  const [aborted, setAborted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const parsed = farrowFormSchema.safeParse({
      breed_date: data[0] ? new Date(data[0].breed_date) : undefined,
      actual_farrow_date: farrowDate,
      piglets_male_born_alive: male || 0,
      piglets_female_born_alive: female || 0,
      piglets_born_dead: dead || 0,
      avg_weight: weight || undefined,
      is_aborted: aborted,
    });
    if (!parsed.success) return setError("กรุณาตรวจสอบตัวเลข");
    if (parsed.data.actual_farrow_date < parsed.data.breed_date) return setError("วันคลอดต้องไม่ก่อนวันผสม");
    setBusy(true);
    setError(null);
    try {
      await recordFarrow({
        breedingId,
        farrowDate,
        maleBornAlive: parsed.data.piglets_male_born_alive,
        femaleBornAlive: parsed.data.piglets_female_born_alive,
        bornDead: parsed.data.piglets_born_dead,
        avgWeight: parsed.data.avg_weight ?? null,
        isAborted: aborted,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(saveErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <DateField label={aborted ? "วันที่แท้ง" : "วันที่คลอด"} value={farrowDate} onChange={setFarrowDate} />
      <Pressable onPress={() => setAborted(!aborted)} style={[s.toggle, aborted && s.toggleOn]}>
        <Text style={[s.toggleText, aborted && { color: "#dc2626" }]}>{aborted ? "✓ แท้ง" : "แท้ง"}</Text>
      </Pressable>
      {!aborted && (
        <>
          <NumberField label="ลูกตัวผู้ (มีชีวิต)" value={male} onChange={setMale} />
          <NumberField label="ลูกตัวเมีย (มีชีวิต)" value={female} onChange={setFemale} />
          <NumberField label="ตายแรกคลอด" value={dead} onChange={setDead} />
          <NumberField label="น้ำหนักเฉลี่ย (กก.)" value={weight} onChange={setWeight} decimal />
          <Text style={s.total}>รวมมีชีวิต {Number(male || 0) + Number(female || 0)} ตัว</Text>
        </>
      )}
      {error && <Text style={s.error}>{error}</Text>}
      <SubmitButton title={aborted ? "บันทึกการแท้ง" : "บันทึกการคลอด"} online={online} busy={busy} onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 4 },
  toggle: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 8,
  },
  toggleOn: { borderColor: "#dc2626", backgroundColor: "#fef2f2" },
  toggleText: { fontSize: 15 },
  total: { textAlign: "right", color: "#737373", marginTop: 4 },
  error: { color: "#dc2626", textAlign: "center", marginTop: 8 },
});
