import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { thaiDate } from "../lib/date";
import { Text } from "../theme";

export function DateField(props: { label: string; value: Date; onChange: (date: Date) => void }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{props.label}</Text>
      {Platform.OS === "ios" ? (
        <DateTimePicker
          value={props.value}
          mode="date"
          display="compact"
          locale="th-TH"
          maximumDate={new Date()}
          onChange={(_, date) => date && props.onChange(date)}
        />
      ) : (
        <Pressable
          onPress={() =>
            DateTimePickerAndroid.open({
              value: props.value,
              mode: "date",
              maximumDate: new Date(),
              onChange: (_, date) => date && props.onChange(date),
            })
          }
        >
          <Text style={s.value}>{thaiDate(props.value, true)}</Text>
        </Pressable>
      )}
    </View>
  );
}

// For dates a record may leave blank: shows ไม่ระบุ until picked, and can be cleared again.
export function OptionalDateField(props: { label: string; value: Date | null; onChange: (date: Date | null) => void }) {
  if (!props.value) {
    return (
      <View style={s.row}>
        <Text style={s.label}>{props.label}</Text>
        <Pressable hitSlop={8} onPress={() => props.onChange(new Date())}>
          <Text style={s.value}>ไม่ระบุ</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View>
      <DateField label={props.label} value={props.value} onChange={props.onChange} />
      <Pressable hitSlop={8} onPress={() => props.onChange(null)} style={s.clear}>
        <Text style={s.clearText}>ล้าง</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  label: { fontSize: 16 },
  value: { fontSize: 16, color: "#ec4899" },
  clear: { alignSelf: "flex-end", marginTop: -4 },
  clearText: { fontSize: 14, color: "#737373" },
});
