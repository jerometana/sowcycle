import { useNavigation } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { haptic } from "../lib/haptics";
import { color, Text } from "../theme";
import { ChevronRight, Search, User } from "../theme/icons";
import { AccountDrawer } from "./AccountDrawer";
import { Drawer } from "./Drawer";
import { PressableScale } from "./motion";
import { EmptyText, SearchBar } from "./ui";

// The header's right side: an optional search button, then the account button.
export function HeaderActions(props: { onSearch?: () => void }) {
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <View style={s.actions}>
      {props.onSearch && (
        <PressableScale
          hitSlop={8}
          accessibilityLabel="ค้นหา"
          onPress={() => {
            haptic.tap();
            props.onSearch?.();
          }}
          style={s.button}
        >
          <Search size={20} color={color.gray600} />
        </PressableScale>
      )}
      <PressableScale
        hitSlop={8}
        accessibilityLabel="บัญชี"
        onPress={() => {
          haptic.tap();
          setAccountOpen(true);
        }}
        style={s.button}
      >
        <User size={20} color={color.gray600} />
      </PressableScale>
      <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />
    </View>
  );
}

export type SearchItem = { key: string; title: string; subtitle?: string; onPress: () => void };

// Puts a search button in the screen's header that opens a drawer listing matching items.
// Returns the drawer element for the screen to render.
export function useHeaderSearch(options: { placeholder: string; items: SearchItem[]; emptyText: string }) {
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pending = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderActions onSearch={() => setOpen(true)} /> });
  }, [navigation]);

  const q = query.trim().toLowerCase();
  const matches = q
    ? options.items.filter((item) => `${item.title} ${item.subtitle ?? ""}`.toLowerCase().includes(q))
    : [];

  const choose = (item: SearchItem) => {
    haptic.select();
    pending.current = item.onPress;
    setOpen(false);
  };

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      onClosed={() => {
        setQuery("");
        pending.current?.();
        pending.current = null;
      }}
      title="ค้นหา"
      heightRatio={0.85}
    >
      <SearchBar value={query} onChange={setQuery} placeholder={options.placeholder} autoFocus />
      <ScrollView style={s.results} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {!q && <EmptyText>พิมพ์เพื่อค้นหา</EmptyText>}
        {q && matches.length === 0 && <EmptyText>{options.emptyText}</EmptyText>}
        {matches.map((item) => (
          <Pressable key={item.key} onPress={() => choose(item)} style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.rowTitle}>{item.title}</Text>
              {!!item.subtitle && <Text style={s.rowSubtitle}>{item.subtitle}</Text>}
            </View>
            <ChevronRight size={20} color={color.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>
    </Drawer>
  );
}

const s = StyleSheet.create({
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 16 },
  button: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e5e5", alignItems: "center", justifyContent: "center" },
  results: { flex: 1, marginHorizontal: -20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  rowPressed: { backgroundColor: color.muted },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowSubtitle: { fontSize: 14, color: color.mutedForeground },
});
