import { useQuery } from "@powersync/react-native";
import { litterStage, saleableDate } from "@sowcycle/core";
import { differenceInCalendarDays } from "date-fns";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { DateField } from "../../components/DateField";
import { Drawer } from "../../components/Drawer";
import { NumberField, SubmitButton } from "../../components/Form";
import { Button, InfoRow } from "../../components/ui";
import { recordSale, saveErrorMessage, startFattening } from "../../db/mutations";
import { useOnline } from "../../db/useOnline";
import { thaiDate, thaiDateLong } from "../../lib/date";
import { haptic } from "../../lib/haptics";
import { LITTER_STAGE_LABEL } from "../../lib/litterLabels";
import { color, Text } from "../../theme";
import { Banknote, Beef, Cake, Check, ChevronRight, Clock, Dna, Gauge, List, PiggyBank, Plus } from "../../theme/icons";

type LitterDetail = {
  sow_id: string;
  sow_name: string;
  boar_breed: string | null;
  birth_date: string | null;
  piglets_born_count: number | null;
  piglets_male_born_alive: number | null;
  piglets_female_born_alive: number | null;
  avg_weight: number | null;
  fattening_at: string | null;
  saleable_at: string | null;
  sold_at: string | null;
};

const LIME = "#84cc16";

// Mirrors the web's litter drawer: facts, parents, a dated timeline, then the one action the stage allows.
export default function LitterSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useOnline();
  const { data } = useQuery<LitterDetail>(
    `select l.*, s.name as sow_name, bo.breed as boar_breed
     from litters l join sows s on s.id = l.sow_id left join boars bo on bo.id = l.boar_id
     where l.id = ?`,
    [id]
  );
  const [action, setAction] = useState<"fattening" | "sale" | null>(null);
  const litter = data[0];
  if (!litter) return null;
  const stage = litterStage(litter);
  const age = litter.birth_date
    ? differenceInCalendarDays(litter.sold_at ? new Date(litter.sold_at) : new Date(), new Date(litter.birth_date))
    : null;
  const date = (iso: string | null) => (iso ? thaiDateLong(iso, true) : "ไม่ระบุ");

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.content}>
      <Stack.Screen options={{ title: `ครอกของ ${litter.sow_name}` }} />

      {age !== null && <InfoRow icon={Clock} label="อายุ">{`${age} วัน`}</InfoRow>}
      <InfoRow icon={List} label="สถานะ">
        <Text style={[s.badge, { backgroundColor: LITTER_STAGE_LABEL[stage].color }]}>{LITTER_STAGE_LABEL[stage].text}</Text>
      </InfoRow>
      <InfoRow icon={PiggyBank} label="จำนวน">
        <View style={s.row}>
          <Text style={s.value}>{`${litter.piglets_born_count ?? 0} ตัว`}</Text>
          <Text style={[s.chip, { backgroundColor: color.blue }]}>{`ผู้ ${litter.piglets_male_born_alive ?? 0}`}</Text>
          <Text style={[s.chip, { backgroundColor: color.primary }]}>{`เมีย ${litter.piglets_female_born_alive ?? 0}`}</Text>
        </View>
      </InfoRow>
      {stage === "sold" && (litter.avg_weight ?? 0) > 0 && (
        <InfoRow icon={Gauge} label="น้ำหนักขายเฉลี่ย">{`${litter.avg_weight} kg`}</InfoRow>
      )}

      <Pressable
        onPress={() => router.replace({ pathname: "/sows/[id]", params: { id: litter.sow_id } })}
        style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.7 }]}
      >
        <View style={{ flex: 1 }}>
          <InfoRow icon={PiggyBank} label="แม่พันธุ์">
            {litter.sow_name}
          </InfoRow>
        </View>
        <ChevronRight size={20} color={color.mutedForeground} />
      </Pressable>
      {litter.boar_breed && (
        <InfoRow icon={Dna} label="พ่อพันธุ์">
          {litter.boar_breed}
        </InfoRow>
      )}

      <View style={s.timeline}>
        {stage !== "nursing" && <View style={s.timelineLine} />}
        <TimelineRow icon={Cake} label="คลอดเมื่อ" value={date(litter.birth_date)} />
        {stage !== "nursing" && <TimelineRow icon={Beef} label="เริ่มขุนเมื่อ" value={date(litter.fattening_at)} />}
        {stage !== "nursing" && (
          <TimelineRow
            icon={Banknote}
            label={stage === "sold" ? "ขายแล้วเมื่อ" : "กำหนดขาย"}
            value={date(stage === "sold" ? litter.sold_at : litter.saleable_at)}
          />
        )}
      </View>

      {stage === "nursing" && (
        <Button title="เพิ่มวันเริ่มขุน" icon={Plus} variant="secondary" disabled={!online} onPress={() => setAction("fattening")} />
      )}
      {stage === "fattening" && (
        <Pressable
          disabled={!online}
          onPress={() => {
            haptic.tap();
            setAction("sale");
          }}
          style={({ pressed }) => [s.limeButton, !online && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
        >
          <Check size={20} color="#fff" />
          <Text style={s.limeText}>บันทึกวันขาย</Text>
        </Pressable>
      )}
      {!online && stage !== "sold" && <Text style={s.hint}>ต้องมีสัญญาณเพื่อบันทึก</Text>}

      <Drawer open={action !== null} onClose={() => setAction(null)} title={action === "sale" ? "บันทึกวันขาย" : "เพิ่มวันเริ่มขุน"}>
        {action && <ActionForm id={id} action={action} onDone={() => setAction(null)} />}
      </Drawer>
    </ScrollView>
  );
}

function TimelineRow(props: { icon: typeof Cake; label: string; value: string }) {
  const Icon = props.icon;
  return (
    <View style={s.timelineRow}>
      <View style={s.timelineIcon}>
        <Icon size={24} color={color.mutedForeground} />
      </View>
      <View style={{ gap: 2 }}>
        <Text style={s.label}>{props.label}</Text>
        <Text style={s.value}>{props.value}</Text>
      </View>
    </View>
  );
}

function ActionForm(props: { id: string; action: "fattening" | "sale"; onDone: () => void }) {
  const online = useOnline();
  const [date, setDate] = useState(new Date());
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (write: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await write();
      haptic.success();
      props.onDone();
    } catch (e) {
      haptic.error();
      setError(saveErrorMessage(e));
      setBusy(false);
    }
  };

  if (props.action === "fattening") {
    return (
      <View style={{ gap: 6 }}>
        <DateField label="วันเริ่มขุน" value={date} onChange={setDate} />
        <Text style={s.hint}>กำหนดขาย {thaiDate(saleableDate(date), true)}</Text>
        {error && <Text style={s.error}>{error}</Text>}
        <SubmitButton title="บันทึกวันเริ่มขุน" online={online} busy={busy} onPress={() => save(() => startFattening(props.id, date))} />
      </View>
    );
  }
  return (
    <View style={{ gap: 6 }}>
      <DateField label="วันที่ขาย" value={date} onChange={setDate} />
      <NumberField label="น้ำหนักขายเฉลี่ย (กก.)" value={weight} onChange={setWeight} decimal />
      {error && <Text style={s.error}>{error}</Text>}
      <SubmitButton
        title="บันทึกวันขาย"
        online={online}
        busy={busy}
        onPress={() => {
          const avg = weight === "" ? null : Number(weight);
          if (avg !== null && !(avg >= 0)) return setError("กรุณาตรวจสอบน้ำหนัก");
          save(() => recordSale(props.id, date, avg));
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  label: { fontSize: 14, color: color.mutedForeground },
  value: { fontSize: 16, fontWeight: "600", color: color.gray900 },
  badge: { alignSelf: "flex-start", color: "#fff", fontSize: 14, fontWeight: "600", paddingHorizontal: 12, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  chip: { color: color.primaryForeground, fontSize: 12, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, overflow: "hidden" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeline: { backgroundColor: color.secondary, borderRadius: 16, padding: 16, gap: 16 },
  timelineLine: { position: "absolute", left: 39, top: 40, bottom: 40, width: 2, backgroundColor: "#e5e7eb" },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  timelineIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: color.card, alignItems: "center", justifyContent: "center" },
  limeButton: { height: 48, borderRadius: 999, backgroundColor: LIME, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  limeText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  hint: { color: color.mutedForeground, textAlign: "center" },
  error: { color: "#dc2626", textAlign: "center", marginTop: 8 },
});
