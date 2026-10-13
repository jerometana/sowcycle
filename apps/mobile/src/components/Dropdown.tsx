import { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { haptic } from "../lib/haptics";
import { color, Text } from "../theme";
import { Check, ChevronDown } from "../theme/icons";

// A text trigger ("ทั้งหมด ⌄") whose options float in a Modal, so they stay tappable over any scroll view.
export function Dropdown<K extends string>(props: { value: K; options: { key: K; label: string }[]; onChange: (key: K) => void }) {
  const trigger = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const current = props.options.find((o) => o.key === props.value)?.label ?? "";

  const open = () => {
    haptic.select();
    trigger.current?.measureInWindow((x, y, _w, h) => setAnchor({ x, y: y + h + 6 }));
  };
  const close = () => setAnchor(null);

  return (
    <>
      <Pressable ref={trigger} onPress={open} hitSlop={8} style={s.trigger} accessibilityRole="button" accessibilityLabel={current}>
        <Text style={s.triggerText}>{current}</Text>
        <ChevronDown size={18} color={color.foreground} style={anchor && { transform: [{ rotate: "180deg" }] }} />
      </Pressable>
      <Modal visible={!!anchor} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="ปิดตัวเลือก" />
        {anchor && (
          <View style={[s.menu, { top: anchor.y, left: anchor.x }]}>
            {props.options.map((option, i) => {
              const selected = option.key === props.value;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    haptic.select();
                    props.onChange(option.key);
                    close();
                  }}
                  style={({ pressed }) => [s.row, i > 0 && s.rowDivider, pressed && { backgroundColor: color.muted }]}
                >
                  <Text style={[s.rowText, selected && { color: color.primary, fontWeight: "600" }]}>{option.label}</Text>
                  {selected && <Check size={18} color={color.primary} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingVertical: 4 },
  triggerText: { fontSize: 18, fontWeight: "600" },
  menu: {
    position: "absolute",
    minWidth: 220,
    borderRadius: 14,
    backgroundColor: color.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingHorizontal: 16, paddingVertical: 12 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border },
  rowText: { fontSize: 16 },
});
