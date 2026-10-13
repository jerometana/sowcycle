import { useEffect } from "react";
import { Animated, StyleSheet, useAnimatedValue } from "react-native";
import { haptic } from "../lib/haptics";
import { color } from "../theme";
import { Plus } from "../theme/icons";
import { PressableScale, useReducedMotion } from "./motion";

// Clears the FAB so the last card in a list can scroll out from under it.
export const FAB_CLEARANCE = 96;

export function Fab(props: { onPress: () => void; label: string }) {
  const reduced = useReducedMotion();
  const pop = useAnimatedValue(reduced ? 1 : 0.6);
  useEffect(() => {
    if (!reduced) Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
  }, [pop, reduced]);

  return (
    <Animated.View style={[s.fab, { transform: [{ scale: pop }] }]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={props.label}
        onPress={() => {
          haptic.tap();
          props.onPress();
        }}
        style={({ pressed }) => [s.hit, pressed && { opacity: 0.85 }]}
      >
        <Plus size={28} color={color.primaryForeground} />
      </PressableScale>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.primary,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  hit: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 28 },
});
