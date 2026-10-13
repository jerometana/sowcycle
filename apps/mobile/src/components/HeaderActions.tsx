import { useNavigation } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { haptic } from "../lib/haptics";
import { color, Text } from "../theme";
import { Check, ChevronRight, ListFilter, Search, User } from "../theme/icons";
import { AccountDrawer } from "./AccountDrawer";
import { Drawer } from "./Drawer";
import { PressableScale } from "./motion";
import { Button, EmptyText, SearchBar } from "./ui";

// The header's right side: optional search and filter buttons, then the account button.
export function HeaderActions(props: { onSearch?: () => void; onFilter?: () => void; filterActive?: boolean }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const press = (action: () => void) => () => {
    haptic.tap();
    action();
  };
  return (
    <View style={s.actions}>
      {props.onSearch && (
        <PressableScale hitSlop={8} accessibilityLabel="ค้นหา" onPress={press(props.onSearch)} style={s.button}>
          <Search size={20} color={color.gray600} />
        </PressableScale>
      )}
      {props.onFilter && (
        <PressableScale
          hitSlop={8}
          accessibilityLabel="กรอง"
          accessibilityState={{ selected: !!props.filterActive }}
          onPress={press(props.onFilter)}
          style={[s.button, props.filterActive && s.buttonActive]}
        >
          <ListFilter size={20} color={props.filterActive ? color.primary : color.gray600} />
        </PressableScale>
      )}
      <PressableScale hitSlop={8} accessibilityLabel="บัญชี" onPress={press(() => setAccountOpen(true))} style={s.button}>
        <User size={20} color={color.gray600} />
      </PressableScale>
      <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />
    </View>
  );
}

export type SearchItem = { key: string; title: string; subtitle?: string; onPress: () => void };
type SearchConfig = { placeholder: string; items: SearchItem[]; emptyText: string };
export type FilterGroup = {
  key: string;
  label?: string;
  options: { key: string; label: string }[];
  value: string;
  defaultValue: string;
  onChange: (key: string) => void;
};
type FilterConfig = { title: string; groups: FilterGroup[] };

// Puts search and filter buttons in the screen's header, each opening its own drawer.
// Returns the drawers for the screen to render.
export function useHeaderTools(tools: { search?: SearchConfig; filter?: FilterConfig }) {
  const navigation = useNavigation();
  const [openDrawer, setOpenDrawer] = useState<"search" | "filter" | null>(null);
  const hasSearch = !!tools.search;
  const hasFilter = !!tools.filter;
  const filterActive = !!tools.filter?.groups.some((group) => group.value !== group.defaultValue);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderActions
          onSearch={hasSearch ? () => setOpenDrawer("search") : undefined}
          onFilter={hasFilter ? () => setOpenDrawer("filter") : undefined}
          filterActive={filterActive}
        />
      ),
    });
  }, [navigation, hasSearch, hasFilter, filterActive]);

  const close = () => setOpenDrawer(null);
  return (
    <>
      {tools.search && <SearchDrawer open={openDrawer === "search"} onClose={close} {...tools.search} />}
      {tools.filter && <FilterDrawer open={openDrawer === "filter"} onClose={close} {...tools.filter} />}
    </>
  );
}

function SearchDrawer(props: SearchConfig & { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const pending = useRef<(() => void) | null>(null);
  const q = query.trim().toLowerCase();
  const matches = q ? props.items.filter((item) => `${item.title} ${item.subtitle ?? ""}`.toLowerCase().includes(q)) : [];

  return (
    <Drawer
      open={props.open}
      onClose={props.onClose}
      onClosed={() => {
        setQuery("");
        pending.current?.();
        pending.current = null;
      }}
      title="ค้นหา"
      heightRatio={0.85}
    >
      <SearchBar value={query} onChange={setQuery} placeholder={props.placeholder} autoFocus />
      <ScrollView style={[s.list, { flex: 1 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {!q && <EmptyText>พิมพ์เพื่อค้นหา</EmptyText>}
        {q && matches.length === 0 && <EmptyText>{props.emptyText}</EmptyText>}
        {matches.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => {
              haptic.select();
              pending.current = item.onPress;
              props.onClose();
            }}
            style={({ pressed }) => [s.row, pressed && s.rowPressed]}
          >
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

// One group closes on pick; with several groups the drawer stays open until เสร็จ.
function FilterDrawer(props: FilterConfig & { open: boolean; onClose: () => void }) {
  const single = props.groups.length === 1;
  return (
    <Drawer open={props.open} onClose={props.onClose} title={props.title}>
      <ScrollView style={[s.list, { flexShrink: 1 }]} bounces={false}>
        {props.groups.map((group) => (
          <View key={group.key}>
            {!!group.label && <Text style={s.groupLabel}>{group.label}</Text>}
            {group.options.map((option) => {
              const selected = option.key === group.value;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    haptic.select();
                    group.onChange(option.key);
                    if (single) props.onClose();
                  }}
                  style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                >
                  <Text style={[s.rowTitle, { flex: 1 }, selected && { color: color.primary }]}>{option.label}</Text>
                  {selected && <Check size={20} color={color.primary} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
      {!single && <Button title="เสร็จ" onPress={props.onClose} />}
    </Drawer>
  );
}

const s = StyleSheet.create({
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 16 },
  button: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e5e5", alignItems: "center", justifyContent: "center" },
  buttonActive: { backgroundColor: "#fce7f3" },
  list: { marginHorizontal: -20 },
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
  groupLabel: { fontSize: 14, color: color.mutedForeground, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
});
