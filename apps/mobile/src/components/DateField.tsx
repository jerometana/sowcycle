import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { thaiDate } from "../lib/date";

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

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  label: { fontSize: 16 },
  value: { fontSize: 16, color: "#ec4899" },
});
