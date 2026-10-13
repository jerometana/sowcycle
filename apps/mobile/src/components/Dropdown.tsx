import type { LucideIcon } from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useAnimatedValue,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { haptic } from "../lib/haptics";
import { color, Text } from "../theme";
import { Check, ChevronDown } from "../theme/icons";
import { useReducedMotion } from "./motion";

export type MenuItem = { key: string; label: string; icon?: LucideIcon; selected?: boolean; onPress: () => void };

// A list that floats under its trigger in a Modal, so it stays tappable over scroll views and headers.
// The chosen item runs after the Modal is gone, because iOS will not present a sheet while it is still on screen.
export function Menu(props: {
  items: MenuItem[];
  align?: "left" | "right";
  renderTrigger: (open: (e: GestureResponderEvent) => void, isOpen: boolean) => ReactNode;
}) {
  const { width } = useWindowDimensions();
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left?: number; right?: number } | null>(null);

  const open = (e: GestureResponderEvent) => {
    haptic.select();
    (e.currentTarget as unknown as View).measureInWindow((x, y, w, h) =>
      setAnchor(props.align === "right" ? { top: y + h + 6, right: width - (x + w) } : { top: y + h + 6, left: x })
    );
  };
  const runPending = () => {
    pending?.();
    setPending(null);
  };
  const choose = (item: MenuItem) => {
    haptic.select();
    setAnchor(null);
    if (Platform.OS === "ios") setPending(() => item.onPress);
    else item.onPress();
  };

  return (
    <>
      {props.renderTrigger(open, !!anchor)}
      <Modal visible={!!anchor} transparent animationType="fade" onRequestClose={() => setAnchor(null)} onDismiss={runPending} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setAnchor(null)} accessibilityLabel="ปิดตัวเลือก" />
        {anchor && (
          <MenuPanel anchor={anchor} origin={props.align === "right" ? "top right" : "top left"}>
            {props.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole={item.selected === undefined ? "button" : "radio"}
                  accessibilityState={item.selected === undefined ? undefined : { selected: item.selected }}
                  onPress={() => choose(item)}
                  style={({ pressed }) => [s.row, i > 0 && s.rowDivider, pressed && { backgroundColor: color.muted }]}
                >
                  {Icon && <Icon size={20} color={color.foreground} />}
                  <Text style={[s.rowText, item.selected && { color: color.primary, fontWeight: "600" }]}>{item.label}</Text>
                  {item.selected && <Check size={18} color={color.primary} />}
                </Pressable>
              );
            })}
          </MenuPanel>
        )}
      </Modal>
    </>
  );
}

// Grows out of the corner nearest its trigger, so the menu reads as coming from what was tapped.
function MenuPanel(props: { anchor: ViewStyle; origin: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const pop = useAnimatedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 4 }).start();
  }, [pop, reduced]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  return (
    <Animated.View style={[s.menu, props.anchor, { opacity: pop, transformOrigin: props.origin, transform: [{ scale }] }]}>
      {props.children}
    </Animated.View>
  );
}

// A text trigger ("ทั้งหมด ⌄") that picks one of its options.
export function Dropdown<K extends string>(props: { value: K; options: { key: K; label: string }[]; onChange: (key: K) => void }) {
  const current = props.options.find((o) => o.key === props.value)?.label ?? "";
  return (
    <Menu
      items={props.options.map((o) => ({ key: o.key, label: o.label, selected: o.key === props.value, onPress: () => props.onChange(o.key) }))}
      renderTrigger={(open, isOpen) => (
        <Pressable onPress={open} hitSlop={8} style={s.trigger} accessibilityRole="button" accessibilityLabel={current}>
          <Text style={s.triggerText}>{current}</Text>
          <ChevronDown size={18} color={color.foreground} style={isOpen && { transform: [{ rotate: "180deg" }] }} />
        </Pressable>
      )}
    />
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
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.border },
  rowText: { flex: 1, fontSize: 16 },
});
