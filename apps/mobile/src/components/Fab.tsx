import { useEffect } from "react";
import { Animated, StyleSheet, useAnimatedValue } from "react-native";
import { color } from "../theme";
import { Plus } from "../theme/icons";
import { PressableScale } from "./motion";

export function Fab(props: { onPress: () => void; label: string }) {
  const pop = useAnimatedValue(0.6);
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
  }, [pop]);

  return (
    <Animated.View style={[s.fab, { transform: [{ scale: pop }] }]}>
      <PressableScale
        accessibilityLabel={props.label}
        onPress={props.onPress}
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
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  hit: { flex: 1, alignSelf: "stretch", alignItems: "center", justifyContent: "center", borderRadius: 28 },
});
