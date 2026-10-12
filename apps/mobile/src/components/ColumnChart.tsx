import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ChartPoint = { key: string; label: string; value: number };

const SERIES = "#ec4899";
const INK = { primary: "#171717", secondary: "#525252", muted: "#a3a3a3" };
const GRID = "#e7e5e4";
const PLOT_HEIGHT = 140;
const MAX_COLUMN = 24;

const niceMax = (max: number) => {
  const step = max <= 10 ? 2 : max <= 50 ? 5 : 10;
  return Math.max(step, Math.ceil(max / step) * step);
};

const format = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export function ColumnChart(props: { title: string; unit: string; points: ChartPoint[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (props.points.length < 2) return null;

  const top = niceMax(Math.max(...props.points.map((p) => p.value)) * 1.1);
  const maxKey = props.points.reduce((a, b) => (b.value > a.value ? b : a)).key;
  const lastKey = props.points[props.points.length - 1].key;
  const labelled = new Set([maxKey, lastKey, ...(selected ? [selected] : [])]);
  const showAxisLabel = (i: number) =>
    props.points.length <= 6 || i === 0 || i === props.points.length - 1;

  return (
    <View
      style={s.card}
      accessible
      accessibilityLabel={`${props.title}: ${props.points.map((p) => `${p.label} ${format(p.value)} ${props.unit}`).join(", ")}`}
    >
      <Text style={s.title}>{props.title}</Text>
      <View style={s.plotRow}>
        <View style={s.yAxis}>
          <Text style={s.tick}>{top}</Text>
          <Text style={s.tick}>0</Text>
        </View>
        <View style={s.plot}>
          <View style={[s.grid, { top: 0 }]} />
          <View style={[s.grid, { bottom: 0 }]} />
          {props.points.map((p) => {
            const height = Math.max(2, (p.value / top) * PLOT_HEIGHT);
            const isSelected = selected === p.key;
            return (
              <Pressable
                key={p.key}
                style={s.slot}
                onPress={() => setSelected(isSelected ? null : p.key)}
                hitSlop={8}
              >
                {labelled.has(p.key) && <Text style={[s.value, isSelected && s.valueSelected]}>{format(p.value)}</Text>}
                <View style={[s.column, { height, opacity: selected && !isSelected ? 0.45 : 1 }]} />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={s.xRow}>
        {props.points.map((p, i) => (
          <Text key={p.key} style={s.xLabel} numberOfLines={1}>
            {showAxisLabel(i) ? p.label : ""}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: "600", color: INK.primary },
  plotRow: { flexDirection: "row", height: PLOT_HEIGHT + 20, paddingTop: 20 },
  yAxis: { width: 28, justifyContent: "space-between", marginTop: -8, marginBottom: -8 },
  tick: { color: INK.muted, fontSize: 11 },
  plot: { flex: 1, flexDirection: "row", alignItems: "flex-end" },
  grid: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: GRID },
  slot: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  column: {
    width: MAX_COLUMN,
    maxWidth: "70%",
    backgroundColor: SERIES,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  value: { color: INK.secondary, fontSize: 12, marginBottom: 4 },
  valueSelected: { color: INK.primary, fontWeight: "600" },
  xRow: { flexDirection: "row", marginLeft: 28 },
  xLabel: { flex: 1, textAlign: "center", color: INK.muted, fontSize: 11 },
});
