import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  useAnimatedValue,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, Text } from "../theme";
import { useReducedMotion } from "./motion";
import { Button } from "./ui";
import { haptic } from "../lib/haptics";

const DISMISS_DISTANCE = 80;
const CLOSE_MS = 220;

// Matches the web's vaul drawer: slides up from the bottom, drag the handle or title down to close.
// heightRatio gives the sheet a fixed share of the screen, for content like search that should not resize with its results.
// onClosed fires once the sheet has left the screen, which is when navigation can safely present.
export function Drawer(props: {
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
  title: string;
  heightRatio?: number;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(props.open);
  const offset = useAnimatedValue(height);
  const drag = useAnimatedValue(0);
  const dragStart = useRef(0);
  const onClosed = useRef(props.onClosed);

  useEffect(() => {
    onClosed.current = props.onClosed;
  });

  if (props.open && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    if (props.open) {
      drag.setValue(0);
      if (reduced) offset.setValue(0);
      else Animated.spring(offset, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 2 }).start();
      return;
    }
    if (reduced) offset.setValue(height);
    else Animated.timing(offset, { toValue: height, duration: CLOSE_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    const t = setTimeout(() => {
      setMounted(false);
      onClosed.current?.();
    }, reduced ? 0 : CLOSE_MS);
    return () => clearTimeout(t);
  }, [props.open, mounted, height, offset, drag, reduced]);

  const handlers = {
    onStartShouldSetResponder: () => true,
    onResponderGrant: (e: GestureResponderEvent) => {
      dragStart.current = e.nativeEvent.pageY;
    },
    onResponderMove: (e: GestureResponderEvent) => drag.setValue(Math.max(0, e.nativeEvent.pageY - dragStart.current)),
    onResponderRelease: (e: GestureResponderEvent) => {
      if (e.nativeEvent.pageY - dragStart.current > DISMISS_DISTANCE) props.onClose();
      else Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
    },
  };

  const translateY = Animated.add(offset, drag);
  const backdrop = offset.interpolate({ inputRange: [0, height], outputRange: [0.4, 0], extrapolate: "clamp" });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={props.onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} accessibilityLabel="ปิด" />
      </Animated.View>
      <View style={[s.frame, { paddingTop: insets.top + 24 }]} pointerEvents="box-none">
        <Animated.View
          style={[
            s.sheet,
            { maxHeight: "100%" },
            props.heightRatio ? { height: height * props.heightRatio } : null,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
          ]}
          accessibilityViewIsModal
        >
          <View {...handlers}>
            <View style={s.handle} />
            <Text style={s.title}>{props.title}</Text>
          </View>
          {props.children}
        </Animated.View>
      </View>
    </Modal>
  );
}

type ConfirmOptions = { title: string; message: string; confirmLabel: string; onConfirm: () => void };

// A drop-in for Alert.alert confirmations: render `element` once, call `confirm` from a handler.
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const element = (
    <Drawer open={open} onClose={close} title={options?.title ?? ""}>
      <Text style={s.message}>{options?.message}</Text>
      <View style={s.actions}>
        <Button
          title={options?.confirmLabel ?? ""}
          variant="destructive"
          onPress={() => {
            close();
            options?.onConfirm();
          }}
        />
        <Button title="ยกเลิก" variant="secondary" onPress={close} />
      </View>
    </Drawer>
  );

  const confirm = (next: ConfirmOptions) => {
    haptic.warning();
    setOptions(next);
    setOpen(true);
  };

  return [element, confirm] as const;
}

const s = StyleSheet.create({
  frame: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "#d4d4d4", marginTop: 10, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "600" },
  message: { fontSize: 16, color: color.mutedForeground },
  actions: { gap: 8, marginTop: 8 },
});
