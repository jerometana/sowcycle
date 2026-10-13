import { differenceInCalendarDays } from "date-fns";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import type { SowCardData } from "../db/sowCards";
import { thaiDateLong } from "../lib/date";
import { color, Text } from "../theme";
import { Check, Heart, PiggyBank, Plus, X } from "../theme/icons";
import { Button, Card, CardHeader, InfoRow, Pill } from "./ui";

export function SowCard({ sow }: { sow: SowCardData }) {
  const pregnant = sow.pregnancy;
  const open = () => router.push({ pathname: "/sows/[id]", params: { id: sow.id } });

  return (
    <Card>
      <View style={{ gap: 16 }}>
        <Card onPress={open} style={s.flush}>
          <CardHeader title={sow.name} tone={!sow.active ? "muted" : pregnant ? "primary" : "default"} />
          {sow.breed && <Pill label={sow.breed} />}
          <InfoRow
            icon={!sow.active ? X : pregnant ? Heart : PiggyBank}
            tint={pregnant ? color.primary : color.mutedForeground}
            label={pregnant ? "กำหนดคลอด" : "คลอดล่าสุด"}
          >
            <Text style={s.value}>
              {pregnant ? thaiDateLong(pregnant.expectedFarrow) : sow.lastFarrow ? thaiDateLong(sow.lastFarrow) : "ไม่มีประวัติคลอด"}
              {pregnant && (
                <Text style={s.soon}>{`  ภายใน ${differenceInCalendarDays(new Date(pregnant.expectedFarrow), new Date())} วัน`}</Text>
              )}
              {!pregnant && sow.lastFarrow && (
                <Text style={s.ago}>{`  ${differenceInCalendarDays(new Date(), new Date(sow.lastFarrow))} วันที่แล้ว`}</Text>
              )}
            </Text>
          </InfoRow>
        </Card>
        {pregnant ? (
          <Button
            title="บันทึกการคลอด"
            icon={Check}
            onPress={() => router.push({ pathname: "/sows/[id]/farrow", params: { id: sow.id, breedingId: pregnant.breedingId } })}
          />
        ) : (
          <Button
            title="เพิ่มประวัติผสม"
            icon={Plus}
            variant="secondary"
            disabled={!sow.active}
            onPress={() => router.push({ pathname: "/sows/[id]/breed", params: { id: sow.id } })}
          />
        )}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  flush: { padding: 0, borderRadius: 0 },
  value: { fontSize: 16, fontWeight: "600", color: color.gray900 },
  soon: { fontSize: 14, fontWeight: "500", color: color.primary },
  ago: { fontSize: 14, fontWeight: "400", color: color.mutedForeground },
});
