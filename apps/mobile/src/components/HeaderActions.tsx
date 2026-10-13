import { useNavigation } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { haptic } from "../lib/haptics";
import { color, Text } from "../theme";
import { Check, ChevronDown, ChevronRight, ListFilter, Search, User } from "../theme/icons";
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
  const matches = q ? props.items.filter((item) => `${item.title} ${item.subtitle ?? ""}`.toLowerCase().includes(q)) : props.items;

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
        {matches.length === 0 && <EmptyText>{props.emptyText}</EmptyText>}
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

const DROPDOWN_HEIGHT = 48;
const ROW_GAP = 12;

// One row per filter: label left, dropdown right. Options float over the drawer, which keeps a fixed height.
// The option list lives at body level, not inside its row: iOS only delivers touches inside a parent's bounds.
function FilterDrawer(props: FilterConfig & { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const openIndex = props.groups.findIndex((g) => g.key === expanded);
  const openGroup = props.groups[openIndex];
  const close = () => {
    setExpanded(null);
    props.onClose();
  };

  return (
    <Drawer open={props.open} onClose={close} title={props.title} heightRatio={0.5}>
      <View style={s.filterBody}>
        {expanded && <Pressable style={[StyleSheet.absoluteFill, { zIndex: 5 }]} onPress={() => setExpanded(null)} accessibilityLabel="ปิดตัวเลือก" />}
        {props.groups.map((g) => {
          const isOpen = g.key === expanded;
          const active = g.value !== g.defaultValue;
          const current = g.options.find((o) => o.key === g.value)?.label ?? "";
          return (
            <View key={g.key} style={s.filterRow}>
              <Text style={s.dropdownLabel}>{g.label ?? props.title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${g.label ?? props.title}: ${current}`}
                onPress={() => {
                  haptic.select();
                  setExpanded(isOpen ? null : g.key);
                }}
                style={[s.dropdown, isOpen && s.dropdownOpen, active && s.dropdownActive]}
              >
                <Text style={[s.dropdownValue, active && { color: color.primary }]} numberOfLines={1}>
                  {current}
                </Text>
                <ChevronDown size={18} color={color.mutedForeground} style={isOpen && { transform: [{ rotate: "180deg" }] }} />
              </Pressable>
            </View>
          );
        })}
        {openGroup && (
          <View style={[s.menu, { top: openIndex * (DROPDOWN_HEIGHT + ROW_GAP) + DROPDOWN_HEIGHT + 8 }]}>
            <ScrollView style={s.menuScroll} bounces={false}>
              {openGroup.options.map((option) => {
                const selected = option.key === openGroup.value;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      haptic.select();
                      openGroup.onChange(option.key);
                      setExpanded(null);
                    }}
                    style={({ pressed }) => [s.menuRow, pressed && s.rowPressed]}
                  >
                    <Text style={[s.menuText, selected && { color: color.primary, fontWeight: "600" }]}>{option.label}</Text>
                    {selected && <Check size={18} color={color.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
        <View style={{ marginTop: "auto" }}>
          <Button title="เสร็จ" onPress={close} />
        </View>
      </View>
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
  filterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  dropdownLabel: { flex: 1, fontSize: 16, fontWeight: "500" },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "55%",
    height: DROPDOWN_HEIGHT,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
  },
  dropdownOpen: { borderColor: color.foreground },
  dropdownActive: { borderColor: color.primary, backgroundColor: "#fdf2f8" },
  dropdownValue: { flexShrink: 1, fontSize: 16, fontWeight: "500" },
  filterBody: { flex: 1, gap: ROW_GAP },
  menu: {
    position: "absolute",
    right: 0,
    zIndex: 10,
    width: "55%",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    backgroundColor: color.card,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  menuScroll: { maxHeight: 260, borderRadius: 14 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  menuText: { fontSize: 16 },
});
