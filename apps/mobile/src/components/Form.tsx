import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function NumberField(props: { label: string; value: string; onChange: (v: string) => void; decimal?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{props.label}</Text>
      <TextInput
        style={s.number}
        value={props.value}
        onChangeText={props.onChange}
        keyboardType={props.decimal ? "decimal-pad" : "number-pad"}
        selectTextOnFocus
        placeholder="0"
      />
    </View>
  );
}

export function SubmitButton(props: { title: string; online: boolean; busy: boolean; onPress: () => void }) {
  const disabled = !props.online || props.busy;
  return (
    <View style={{ marginTop: 16, gap: 8 }}>
      <Pressable
        style={({ pressed }) => [s.button, disabled && s.disabled, pressed && !disabled && { opacity: 0.85 }]}
        onPress={props.onPress}
        disabled={disabled}
      >
        {props.busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{props.title}</Text>}
      </Pressable>
      {!props.online && <Text style={s.hint}>ต้องมีสัญญาณเพื่อบันทึก</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  label: { fontSize: 16 },
  number: {
    minWidth: 88,
    textAlign: "right",
    fontSize: 18,
    backgroundColor: "#f5f5f4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  button: { backgroundColor: "#ec4899", borderRadius: 999, paddingVertical: 16, alignItems: "center" },
  disabled: { backgroundColor: "#d4d4d4" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  hint: { textAlign: "center", color: "#92400e" },
});
