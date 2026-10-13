import type { LucideIcon } from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, useAnimatedValue, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronRight, Dna, Search } from "../theme/icons";
import { color, Text, TextInput } from "../theme";
import { PressableScale } from "./motion";
import { haptic } from "../lib/haptics";

export function Card(props: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  if (!props.onPress) return <View style={[s.card, props.style]}>{props.children}</View>;
  return (
    <PressableScale onPress={props.onPress} style={({ pressed }) => [s.card, props.style, pressed && { opacity: 0.85 }]}>
      {props.children}
    </PressableScale>
  );
}

export function CardHeader(props: {
  title: string;
  tone?: "primary" | "muted" | "default";
  subtitle?: ReactNode;
  inline?: ReactNode;
  chevron?: boolean;
  small?: boolean;
}) {
  const tint = props.tone === "primary" ? color.primary : props.tone === "muted" ? color.mutedForeground : color.foreground;
  return (
    <View style={s.cardHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[props.small ? s.cardTitleSmall : s.cardTitle, { color: tint }]}>
          {props.title}
          {props.inline}
        </Text>
        {props.subtitle}
      </View>
      {props.chevron !== false && <ChevronRight size={20} color={color.mutedForeground} />}
    </View>
  );
}

export function InfoRow(props: { icon: LucideIcon; label: string; children: ReactNode; tint?: string }) {
  const Icon = props.icon;
  return (
    <View style={s.infoRow}>
      <View style={s.iconSquare}>
        <Icon size={24} color={props.tint ?? color.mutedForeground} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.infoLabel}>{props.label}</Text>
        {typeof props.children === "string" ? <Text style={s.infoValue}>{props.children}</Text> : props.children}
      </View>
    </View>
  );
}

export function Pill(props: { label: string; icon?: LucideIcon; background?: string }) {
  const Icon = props.icon ?? Dna;
  return (
    <View style={[s.pill, { backgroundColor: props.background ?? color.secondary }]}>
      <Icon size={16} color={color.mutedForeground} />
      <Text style={s.pillText}>{props.label}</Text>
    </View>
  );
}

export function Button(props: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "surface" | "destructive";
  icon?: LucideIcon;
  disabled?: boolean;
  busy?: boolean;
}) {
  const variant = props.variant ?? "primary";
  const fg = variant === "primary" ? color.primaryForeground : variant === "destructive" ? color.destructive : color.foreground;
  const Icon = props.icon;
  return (
    <PressableScale
      onPress={() => {
        haptic.tap();
        props.onPress();
      }}
      disabled={props.disabled || props.busy}
      style={({ pressed }) => [
        s.button,
        variant === "primary" ? s.buttonPrimary : variant === "surface" ? s.buttonSurface : s.buttonSecondary,
        (props.disabled || props.busy) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {props.busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {Icon && <Icon size={20} color={fg} />}
          <Text style={[s.buttonText, { color: fg }]}>{props.title}</Text>
        </>
      )}
    </PressableScale>
  );
}

export function SearchBar(props: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={s.search}>
      <Search size={20} color={color.mutedForeground} />
      <TextInput
        style={s.searchInput}
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

export function Segmented<T extends string>(props: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const [width, setWidth] = useState(0);
  const active = props.options.findIndex((o) => o.value === props.value);
  const slot = width / props.options.length;
  const x = useAnimatedValue(active);

  useEffect(() => {
    Animated.spring(x, { toValue: active, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  }, [x, active]);

  return (
    <View style={s.segment} onLayout={(e) => setWidth(e.nativeEvent.layout.width - SEGMENT_PAD * 2)}>
      {width > 0 && (
        <Animated.View
          style={[s.segThumb, { width: slot, transform: [{ translateX: Animated.multiply(x, slot) }] }]}
        />
      )}
      {props.options.map((o) => {
        const selected = o.value === props.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (selected) return;
              haptic.select();
              props.onChange(o.value);
            }}
            style={s.segItem}
          >
            <Text style={[s.segText, selected && s.segTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle(props: { children: ReactNode }) {
  return <Text style={s.sectionTitle}>{props.children}</Text>;
}

export function EmptyText(props: { children: ReactNode }) {
  return <Text style={s.empty}>{props.children}</Text>;
}

const SEGMENT_PAD = 4;

export const screen = StyleSheet.create({
  root: { backgroundColor: color.background, flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
});

const s = StyleSheet.create({
  card: { backgroundColor: color.card, borderRadius: 16, padding: 16, gap: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  cardTitleSmall: { fontSize: 16, fontWeight: "500" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  iconSquare: { width: 48, height: 48, borderRadius: 16, backgroundColor: color.iconSquare, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 14, color: color.mutedForeground },
  infoValue: { fontSize: 16, fontWeight: "600", color: color.gray900 },
  pill: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  pillText: { fontSize: 14, fontWeight: "500", color: color.mutedForeground },
  button: { height: 48, borderRadius: 999, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 },
  buttonPrimary: { backgroundColor: color.primary },
  buttonSecondary: { backgroundColor: color.secondary },
  buttonSurface: { backgroundColor: color.card },
  buttonText: { fontSize: 16, fontWeight: "500" },
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: color.card, borderRadius: 999, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: color.border },
  searchInput: { flex: 1, fontSize: 16 },
  segment: { flexDirection: "row", backgroundColor: "#e5e5e5", borderRadius: 999, padding: SEGMENT_PAD },
  segThumb: { position: "absolute", top: SEGMENT_PAD, bottom: SEGMENT_PAD, left: SEGMENT_PAD, borderRadius: 999, backgroundColor: color.card },
  segItem: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: "center" },
  segText: { color: color.mutedForeground, fontSize: 15, fontWeight: "500" },
  segTextActive: { color: color.foreground, fontWeight: "600" },
  sectionTitle: { fontSize: 20, fontWeight: "600", marginTop: 12 },
  empty: { textAlign: "center", color: color.mutedForeground, marginVertical: 24 },
});
