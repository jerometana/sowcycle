import { useQuery } from "@powersync/react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { OptionalDateField } from "../../../components/DateField";
import { NumberField, SubmitButton } from "../../../components/Form";
import { createSow, saveErrorMessage, updateSow, type SowInput } from "../../../db/mutations";
import { useOnline } from "../../../db/useOnline";
import { haptic } from "../../../lib/haptics";
import { color, Text, TextInput } from "../../../theme";

type SowDetail = {
  name: string;
  breasts_count: number | null;
  birth_date: string | null;
  add_date: string | null;
  is_active: number | null;
};

// id "new" adds a sow; any other id edits that sow.
export default function SowSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { data } = useQuery<SowDetail>(
    "select name, breasts_count, birth_date, add_date, is_active from sows where id = ?",
    [id]
  );
  const sow = data[0];
  if (!isNew && !sow) return null;
  return <SowForm key={id} id={id} isNew={isNew} sow={sow} />;
}

// Form state starts from the saved row once; later syncs must not overwrite what the farmer is typing.
function SowForm({ id, isNew, sow }: { id: string; isNew: boolean; sow: SowDetail | undefined }) {
  const online = useOnline();
  const [name, setName] = useState(sow?.name ?? "");
  const [breasts, setBreasts] = useState(sow?.breasts_count ? String(sow.breasts_count) : "");
  const [birthDate, setBirthDate] = useState<Date | null>(sow?.birth_date ? new Date(sow.birth_date) : null);
  const [addDate, setAddDate] = useState<Date | null>(sow ? (sow.add_date ? new Date(sow.add_date) : null) : new Date());
  const [active, setActive] = useState(sow ? sow.is_active !== 0 : true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const breastsCount = breasts === "" ? null : Number(breasts);
    if (!name.trim()) return setError("กรุณากรอกชื่อแม่พันธุ์");
    if (breastsCount !== null && (!Number.isInteger(breastsCount) || breastsCount < 0)) return setError("กรุณาตรวจสอบจำนวนเต้านม");
    const input: SowInput = {
      name: name.trim(),
      breasts_count: breastsCount,
      birth_date: birthDate?.toISOString() ?? null,
      add_date: addDate?.toISOString() ?? null,
      is_active: active,
    };
    setBusy(true);
    setError(null);
    try {
      await (isNew ? createSow(input) : updateSow(id, input));
      haptic.success();
      router.back();
    } catch (e) {
      haptic.error();
      setError(saveErrorMessage(e, !isNew));
      setBusy(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isNew ? "เพิ่มแม่พันธุ์ใหม่" : "แก้ไขแม่พันธุ์" }} />
      <Text style={s.label}>ชื่อ</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="ชื่อแม่พันธุ์" autoCorrect={false} />
      <NumberField label="จำนวนเต้านม" value={breasts} onChange={setBreasts} />
      <OptionalDateField label="วันเกิด" value={birthDate} onChange={setBirthDate} />
      <OptionalDateField label="รับเข้าเมื่อ" value={addDate} onChange={setAddDate} />
      <View style={s.switchRow}>
        <Text style={s.switchLabel}>ยังอยู่</Text>
        <Switch
          value={active}
          onValueChange={(v) => {
            haptic.select();
            setActive(v);
          }}
          trackColor={{ true: color.primary }}
        />
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <SubmitButton title={isNew ? "เพิ่มแม่พันธุ์" : "บันทึก"} online={online} busy={busy} onPress={save} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  label: { fontSize: 16, marginTop: 8 },
  input: { backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  switchLabel: { fontSize: 16 },
  error: { color: "#dc2626", textAlign: "center", marginTop: 8 },
});
