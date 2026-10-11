import { useQuery } from "@powersync/react-native";
import { expectedFarrowDate, newBreedingFormSchema } from "@sowcycle/core";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DateField } from "../../../components/DateField";
import { SubmitButton } from "../../../components/Form";
import { recordBreeding, SaveTimeoutError } from "../../../db/mutations";
import { useOnline } from "../../../db/useOnline";
import { thaiDate } from "../../../lib/date";

export default function BreedSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useOnline();
  const { data: boars } = useQuery<{ id: string; breed: string }>("select id, breed from boars order by breed");
  const [boarId, setBoarId] = useState<string | null>(null);
  const [breedDate, setBreedDate] = useState(new Date());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const parsed = newBreedingFormSchema.safeParse({
      sow_id: id,
      boar_id: boarId === null ? null : Number(boarId),
      breed_date: breedDate,
    });
    if (!parsed.success) return setError("กรุณาตรวจสอบข้อมูล");
    setBusy(true);
    setError(null);
    try {
      await recordBreeding({ sowId: id, boarId, breedDate });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(
        e instanceof SaveTimeoutError ? "สัญญาณไม่พอ กดบันทึกอีกครั้งได้ ข้อมูลจะไม่ซ้ำ" : "บันทึกไม่สำเร็จ ลองอีกครั้ง"
      );
      setBusy(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.content}>
      <DateField label="วันที่ผสม" value={breedDate} onChange={setBreedDate} />
      <Text style={s.hint}>
        กำหนดคลอด {thaiDate(expectedFarrowDate(breedDate), true)}
      </Text>
      <Text style={s.label}>พ่อพันธุ์</Text>
      <View style={s.chips}>
        {[{ id: null, breed: "ไม่ระบุ" }, ...boars].map((boar) => (
          <Pressable
            key={boar.id ?? "none"}
            onPress={() => setBoarId(boar.id)}
            style={[s.chip, boarId === boar.id && s.chipActive]}
          >
            <Text style={[s.chipText, boarId === boar.id && s.chipTextActive]}>{boar.breed}</Text>
          </Pressable>
        ))}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <SubmitButton title="บันทึกการผสม" online={online} busy={busy} onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  hint: { color: "#737373" },
  label: { fontSize: 16, marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  chipActive: { borderColor: "#ec4899", backgroundColor: "#fdf2f8" },
  chipText: { fontSize: 15 },
  chipTextActive: { color: "#ec4899", fontWeight: "600" },
  error: { color: "#dc2626", textAlign: "center" },
});
