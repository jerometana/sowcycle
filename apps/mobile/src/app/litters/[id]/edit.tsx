import { useQuery } from "@powersync/react-native";
import { saleableDate } from "@sowcycle/core";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { DateField, OptionalDateField } from "../../../components/DateField";
import { NumberField, SubmitButton } from "../../../components/Form";
import { saveErrorMessage, updateLitter } from "../../../db/mutations";
import { useOnline } from "../../../db/useOnline";
import { thaiDate } from "../../../lib/date";
import { haptic } from "../../../lib/haptics";
import { color, Text } from "../../../theme";

type LitterDetail = {
  birth_date: string | null;
  piglets_male_born_alive: number | null;
  piglets_female_born_alive: number | null;
  fattening_at: string | null;
  sold_at: string | null;
  avg_weight: number | null;
};

export default function EditLitterSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useQuery<LitterDetail>(
    "select birth_date, piglets_male_born_alive, piglets_female_born_alive, fattening_at, sold_at, avg_weight from litters where id = ?",
    [id]
  );
  if (!data[0]) return null;
  return <EditLitterForm key={id} id={id} litter={data[0]} />;
}

const toDate = (iso: string | null) => (iso ? new Date(iso) : null);
const count = (v: string) => (v === "" ? 0 : Number(v));

// Same fields as the web's แก้ไขข้อมูล; form state starts from the saved row once so a sync cannot overwrite typing.
function EditLitterForm({ id, litter }: { id: string; litter: LitterDetail }) {
  const online = useOnline();
  const [birthDate, setBirthDate] = useState(toDate(litter.birth_date) ?? new Date());
  const [male, setMale] = useState(String(litter.piglets_male_born_alive ?? 0));
  const [female, setFemale] = useState(String(litter.piglets_female_born_alive ?? 0));
  const [fatteningAt, setFatteningAt] = useState(toDate(litter.fattening_at));
  const [soldAt, setSoldAt] = useState(toDate(litter.sold_at));
  const [weight, setWeight] = useState(litter.avg_weight ? String(litter.avg_weight) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const maleCount = count(male);
    const femaleCount = count(female);
    const avgWeight = weight === "" ? null : Number(weight);
    if (![maleCount, femaleCount].every((n) => Number.isInteger(n) && n >= 0)) return setError("กรุณาตรวจสอบจำนวนลูก");
    if (avgWeight !== null && !(avgWeight >= 0)) return setError("กรุณาตรวจสอบน้ำหนัก");
    setBusy(true);
    setError(null);
    try {
      await updateLitter(id, { birthDate, male: maleCount, female: femaleCount, fatteningAt, soldAt, avgWeight });
      haptic.success();
      router.back();
    } catch (e) {
      haptic.error();
      setError(saveErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <DateField label="วันที่คลอด" value={birthDate} onChange={setBirthDate} />
      <NumberField label="ตัวผู้" value={male} onChange={setMale} />
      <NumberField label="ตัวเมีย" value={female} onChange={setFemale} />
      <Text style={s.hint}>รวม {count(male) + count(female) || 0} ตัว</Text>

      <Text style={s.section}>การขุน</Text>
      <OptionalDateField label="เริ่มขุนเมื่อ" value={fatteningAt} onChange={setFatteningAt} />
      {fatteningAt && <Text style={s.hint}>จะพร้อมขายช่วง {thaiDate(saleableDate(fatteningAt), true)}</Text>}

      <Text style={s.section}>การขาย</Text>
      <OptionalDateField label="ขายแล้วเมื่อ (ถ้ามี)" value={soldAt} onChange={setSoldAt} />
      <NumberField label="น้ำหนักขายเฉลี่ย (กก.)" value={weight} onChange={setWeight} decimal />

      {error && <Text style={s.error}>{error}</Text>}
      <SubmitButton title="บันทึก" online={online} busy={busy} onPress={save} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 6 },
  section: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  hint: { color: color.mutedForeground },
  error: { color: "#dc2626", textAlign: "center", marginTop: 8 },
});
