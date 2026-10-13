import { Pressable, StyleSheet } from "react-native";
import { color } from "../theme";
import { Plus } from "../theme/icons";

export function Fab(props: { onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={({ pressed }) => [s.fab, pressed && { opacity: 0.85 }]}
    >
      <Plus size={28} color={color.primaryForeground} />
    </Pressable>
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
});
