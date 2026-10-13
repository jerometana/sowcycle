import { Pressable, StyleSheet, View } from "react-native";
import { haptic } from "../lib/haptics";
import { color, Text } from "../theme";

export type SummaryCard = { key: string; label: string; count: number; tint: string };

// Count cards over a list that double as shortcuts to its filter; the card matching the current filter is outlined.
export function SummaryCards(props: { cards: SummaryCard[]; unit: string; selected: string; onSelect: (key: string) => void }) {
  return (
    <View style={s.row}>
      {props.cards.map((card) => {
        const selected = props.selected === card.key;
        return (
          <Pressable
            key={card.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${card.label} ${card.count} ${props.unit}`}
            onPress={() => {
              haptic.select();
              props.onSelect(card.key);
            }}
            style={({ pressed }) => [s.card, selected && s.cardSelected, pressed && { opacity: 0.85 }]}
          >
            <Text style={s.label}>{card.label}</Text>
            <Text>
              <Text style={[s.number, { color: card.tint }]}>{card.count}</Text>
              <Text style={s.unit}>{` ${props.unit}`}</Text>
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  card: { flex: 1, backgroundColor: color.card, borderRadius: 16, padding: 14, gap: 4, borderWidth: 1.5, borderColor: "transparent" },
  cardSelected: { borderColor: color.primary },
  label: { fontSize: 14, color: color.mutedForeground },
  number: { fontSize: 24, fontWeight: "700" },
  unit: { fontSize: 14, color: color.mutedForeground },
});
