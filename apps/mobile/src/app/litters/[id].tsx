import { useQuery } from "@powersync/react-native";
import { litterStage, saleableDate } from "@sowcycle/core";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { DateField } from "../../components/DateField";
import { NumberField, SubmitButton } from "../../components/Form";
import { recordSale, saveErrorMessage, startFattening } from "../../db/mutations";
import { useOnline } from "../../db/useOnline";
import { thaiDate } from "../../lib/date";
import { LITTER_STAGE_LABEL } from "../../lib/litterLabels";

type LitterDetail = {
  sow_name: string;
  birth_date: string | null;
  piglets_born_count: number | null;
  piglets_male_born_alive: number | null;
  piglets_female_born_alive: number | null;
  avg_weight: number | null;
  fattening_at: string | null;
  saleable_at: string | null;
  sold_at: string | null;
};

export default function LitterSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useOnline();
  const { data } = useQuery<LitterDetail>(
    "select l.*, s.name as sow_name from litters l join sows s on s.id = l.sow_id where l.id = ?",
    [id]
  );
  const [date, setDate] = useState(new Date());
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const litter = data[0];
  if (!litter) return null;
  const stage = litterStage(litter);

  const save = async (write: () => Promise<void>) => {
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

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: `ครอกของ ${litter.sow_name}` }} />
      <Text style={[s.stage, { color: LITTER_STAGE_LABEL[stage].color }]}>{LITTER_STAGE_LABEL[stage].text}</Text>
      {litter.birth_date && <Text style={s.line}>คลอด {thaiDate(litter.birth_date, true)}</Text>}
      <Text style={s.line}>
        {litter.piglets_born_count ?? 0} ตัว (ผู้ {litter.piglets_male_born_alive ?? 0} เมีย {litter.piglets_female_born_alive ?? 0})
      </Text>
      {litter.fattening_at && <Text style={s.line}>เริ่มขุน {thaiDate(litter.fattening_at, true)}</Text>}
      {stage === "fattening" && litter.saleable_at && <Text style={s.line}>กำหนดขาย {thaiDate(litter.saleable_at, true)}</Text>}
      {stage === "sold" && litter.sold_at && <Text style={s.line}>ขายเมื่อ {thaiDate(litter.sold_at, true)}</Text>}
      {stage === "sold" && litter.avg_weight != null && <Text style={s.line}>น้ำหนักขายเฉลี่ย {litter.avg_weight} กก.</Text>}

      {stage === "nursing" && (
        <>
          <Text style={s.section}>เริ่มขุน</Text>
          <DateField label="วันเริ่มขุน" value={date} onChange={setDate} />
          <Text style={s.hint}>กำหนดขาย {thaiDate(saleableDate(date), true)}</Text>
          {error && <Text style={s.error}>{error}</Text>}
          <SubmitButton title="บันทึกวันเริ่มขุน" online={online} busy={busy} onPress={() => save(() => startFattening(id, date))} />
        </>
      )}
      {stage === "fattening" && (
        <>
          <Text style={s.section}>บันทึกการขาย</Text>
          <DateField label="วันที่ขาย" value={date} onChange={setDate} />
          <NumberField label="น้ำหนักขายเฉลี่ย (กก.)" value={weight} onChange={setWeight} decimal />
          {error && <Text style={s.error}>{error}</Text>}
          <SubmitButton
            title="บันทึกการขาย"
            online={online}
            busy={busy}
            onPress={() => {
              const avg = weight === "" ? null : Number(weight);
              if (avg !== null && !(avg >= 0)) return setError("กรุณาตรวจสอบน้ำหนัก");
              save(() => recordSale(id, date, avg));
            }}
          />
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 6 },
  stage: { fontSize: 18, fontWeight: "600" },
  line: { color: "#404040", fontSize: 16 },
  section: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  hint: { color: "#737373" },
  error: { color: "#dc2626", textAlign: "center", marginTop: 8 },
});
