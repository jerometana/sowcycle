import { useNavigation } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { haptic } from "../lib/haptics";
import { color, Text } from "../theme";
import { Check, ChevronDown, ChevronRight, Ellipsis, ListFilter, Plus, Search } from "../theme/icons";
import { AccountDrawer } from "./AccountDrawer";
import { Drawer } from "./Drawer";
import { FadeIn, PressableScale } from "./motion";
import { EmptyText, SearchBar } from "./ui";

// The header's right side: the search button, the screen's add button, and the account button on หน้าหลัก.
export function HeaderActions(props: {
  onSearch?: () => void;
  searchActive?: boolean;
  add?: { label: string; onPress: () => void };
  account?: boolean;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const press = (action: () => void) => () => {
    haptic.tap();
    action();
  };
  return (
    <View style={s.actions}>
      {props.onSearch && (
        <PressableScale
          hitSlop={8}
          accessibilityLabel="ค้นหาและกรอง"
          accessibilityState={{ selected: !!props.searchActive }}
          onPress={press(props.onSearch)}
          style={[s.button, props.searchActive && s.buttonActive]}
        >
          <Search size={20} color={props.searchActive ? color.primary : color.gray600} />
        </PressableScale>
      )}
      {props.add && (
        <PressableScale hitSlop={8} accessibilityLabel={props.add.label} onPress={press(props.add.onPress)} style={[s.button, s.buttonPrimary]}>
          <Plus size={22} color={color.primaryForeground} />
        </PressableScale>
      )}
      {props.account && (
        <>
          <PressableScale hitSlop={8} accessibilityLabel="บัญชี" onPress={press(() => setAccountOpen(true))} style={s.button}>
            <Ellipsis size={20} color={color.gray600} />
          </PressableScale>
          <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />
        </>
      )}
    </View>
  );
}

export type SearchItem = { key: string; title: string; subtitle?: string; onPress: () => void };
type SearchConfig = { placeholder: string; items: SearchItem[]; emptyText: string };
export type FilterGroup = {
  key: string;
  label: string;
  options: { key: string; label: string }[];
  value: string;
  defaultValue: string;
  onChange: (key: string) => void;
};

// Puts one search button in the screen's header. It opens a drawer that searches and filters together:
// screens pass items already narrowed by their filters, so results and the list behind always agree.
// Returns the drawer for the screen to render.
export function useHeaderTools(tools: { search: SearchConfig; filters?: FilterGroup[]; add?: { label: string; onPress: () => void } }) {
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const filterActive = !!tools.filters?.some((group) => group.value !== group.defaultValue);
  const addLabel = tools.add?.label;
  const addPress = useRef(tools.add?.onPress);
  useLayoutEffect(() => {
    addPress.current = tools.add?.onPress;
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderActions
          onSearch={() => setOpen(true)}
          searchActive={filterActive}
          add={addLabel ? { label: addLabel, onPress: () => addPress.current?.() } : undefined}
        />
      ),
    });
  }, [navigation, filterActive, addLabel]);

  return <SearchDrawer open={open} onClose={() => setOpen(false)} search={tools.search} filters={tools.filters ?? []} />;
}

const DROPDOWN_HEIGHT = 48;
const ROW_GAP = 12;

// A filter button beside the search field shows or hides the filter rows; an open dropdown floats its options over the results.
// The options live at body level, not inside their row, because iOS only delivers touches inside a parent's bounds.
function SearchDrawer(props: { open: boolean; onClose: () => void; search: SearchConfig; filters: FilterGroup[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const filterActive = props.filters.some((g) => g.value !== g.defaultValue);
  const openIndex = props.filters.findIndex((g) => g.key === expanded);
  const openGroup = props.filters[openIndex];
  const q = query.trim().toLowerCase();
  const matches = q
    ? props.search.items.filter((item) => `${item.title} ${item.subtitle ?? ""}`.toLowerCase().includes(q))
    : props.search.items;

  return (
    <Drawer
      open={props.open}
      onClose={() => {
        setExpanded(null);
        setShowFilters(false);
        props.onClose();
      }}
      onClosed={() => {
        setQuery("");
        pending.current?.();
        pending.current = null;
      }}
      title="ค้นหา"
      heightRatio={0.85}
    >
      <View style={s.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar value={query} onChange={setQuery} placeholder={props.search.placeholder} />
        </View>
        {props.filters.length > 0 && (
          <PressableScale
            accessibilityLabel="ตัวกรอง"
            accessibilityState={{ expanded: showFilters, selected: filterActive }}
            onPress={() => {
              haptic.tap();
              setExpanded(null);
              setShowFilters(!showFilters);
            }}
            style={[s.filterButton, filterActive && s.filterButtonActive, showFilters && s.filterButtonOpen]}
          >
            <ListFilter size={20} color={filterActive ? color.primary : color.gray600} />
          </PressableScale>
        )}
      </View>
      <View style={s.body}>
        {expanded && <Pressable style={[StyleSheet.absoluteFill, { zIndex: 5 }]} onPress={() => setExpanded(null)} accessibilityLabel="ปิดตัวเลือก" />}
        {showFilters && props.filters.map((g, i) => {
          const isOpen = g.key === expanded;
          const active = g.value !== g.defaultValue;
          const current = g.options.find((o) => o.key === g.value)?.label ?? "";
          return (
            <FadeIn key={g.key} index={i} style={s.filterRow}>
              <Text style={s.filterLabel}>{g.label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${g.label}: ${current}`}
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
            </FadeIn>
          );
        })}
        <ScrollView style={s.results} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {matches.length === 0 && <EmptyText>{props.search.emptyText}</EmptyText>}
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
      </View>
    </Drawer>
  );
}

const s = StyleSheet.create({
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 16 },
  button: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e5e5", alignItems: "center", justifyContent: "center" },
  buttonActive: { backgroundColor: "#fce7f3" },
  buttonPrimary: { backgroundColor: color.primary },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: { borderColor: color.primary, backgroundColor: "#fdf2f8" },
  filterButtonOpen: { borderColor: color.foreground },
  body: { flex: 1, gap: ROW_GAP },
  filterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  filterLabel: { flex: 1, fontSize: 16, fontWeight: "500" },
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
