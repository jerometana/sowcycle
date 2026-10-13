import { useNavigation } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { haptic } from "../lib/haptics";
import { color, Text } from "../theme";
import { Check, ChevronDown, Ellipsis, ListFilter, Plus, Search } from "../theme/icons";
import { AccountDrawer } from "./AccountDrawer";
import { Drawer } from "./Drawer";
import { FadeIn, PressableScale } from "./motion";
import { SearchBar } from "./ui";

// The header's right side: search, filter, the screen's add button, and the account button on หน้าหลัก.
export function HeaderActions(props: {
  onSearch?: () => void;
  searchActive?: boolean;
  onFilter?: () => void;
  filterActive?: boolean;
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
        <View style={s.pill}>
          <PressableScale
            hitSlop={8}
            accessibilityLabel="ค้นหา"
            accessibilityState={{ expanded: !!props.searchActive }}
            onPress={press(props.onSearch)}
            style={[s.pillHalf, props.searchActive && s.pillHalfActive]}
          >
            <Search size={20} color={props.searchActive ? color.primary : color.gray600} />
          </PressableScale>
          {props.onFilter && (
            <>
              <PressableScale
                hitSlop={8}
                accessibilityLabel="ตัวกรอง"
                accessibilityState={{ selected: !!props.filterActive }}
                onPress={press(props.onFilter)}
                style={[s.pillHalf, props.filterActive && s.pillHalfActive]}
              >
                <ListFilter size={20} color={props.filterActive ? color.primary : color.gray600} />
              </PressableScale>
            </>
          )}
        </View>
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

type SearchConfig = { placeholder: string };
export type FilterGroup = {
  key: string;
  label: string;
  options: { key: string; label: string }[];
  value: string;
  defaultValue: string;
  onChange: (key: string) => void;
};

export const matchesQuery = (query: string, ...texts: (string | null | undefined)[]) => {
  const q = query.trim().toLowerCase();
  return !q || texts.some((t) => t?.toLowerCase().includes(q));
};

// Puts search, filter and add buttons in the screen's header. Search opens a field the screen renders above its
// list and filters that list in place by `query`; filter opens a drawer of the screen's filter groups.
export function useHeaderTools(tools: { search: SearchConfig; filters?: FilterGroup[]; add?: { label: string; onPress: () => void } }) {
  const navigation = useNavigation();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filters = tools.filters ?? [];
  const hasFilters = filters.length > 0;
  const filterActive = filters.some((group) => group.value !== group.defaultValue);
  const addLabel = tools.add?.label;
  const addPress = useRef(tools.add?.onPress);
  useLayoutEffect(() => {
    addPress.current = tools.add?.onPress;
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderActions
          onSearch={() => setSearching((open) => !open)}
          searchActive={searching}
          onFilter={hasFilters ? () => setFilterOpen(true) : undefined}
          filterActive={filterActive}
          add={addLabel ? { label: addLabel, onPress: () => addPress.current?.() } : undefined}
        />
      ),
    });
  }, [navigation, searching, hasFilters, filterActive, addLabel]);

  const searchBar = searching ? (
    <FadeIn style={s.searchRow}>
      <View style={{ flex: 1 }}>
        <SearchBar value={query} onChange={setQuery} placeholder={tools.search.placeholder} autoFocus />
      </View>
      <Pressable
        hitSlop={8}
        onPress={() => {
          haptic.tap();
          setQuery("");
          setSearching(false);
        }}
      >
        <Text style={s.cancel}>ยกเลิก</Text>
      </Pressable>
    </FadeIn>
  ) : null;

  const drawers = hasFilters ? <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} filters={filters} /> : null;

  return { query: searching ? query : "", searchBar, drawers };
}

const DROPDOWN_HEIGHT = 48;
const ROW_GAP = 12;

// One row per filter group; an open dropdown floats its options over the rows below.
// The options live at body level, not inside their row, because iOS only delivers touches inside a parent's bounds.
function FilterDrawer(props: { open: boolean; onClose: () => void; filters: FilterGroup[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const filterActive = props.filters.some((g) => g.value !== g.defaultValue);
  const openIndex = props.filters.findIndex((g) => g.key === expanded);
  const openGroup = props.filters[openIndex];

  return (
    <Drawer open={props.open} onClose={props.onClose} onClosed={() => setExpanded(null)} title="ตัวกรอง" heightRatio={0.55}>
      <View style={s.body}>
        {expanded && <Pressable style={[StyleSheet.absoluteFill, { zIndex: 5 }]} onPress={() => setExpanded(null)} accessibilityLabel="ปิดตัวเลือก" />}
        {props.filters.map((g) => {
          const isOpen = g.key === expanded;
          const active = g.value !== g.defaultValue;
          const current = g.options.find((o) => o.key === g.value)?.label ?? "";
          return (
            <View key={g.key} style={s.filterRow}>
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
            </View>
          );
        })}
        {filterActive && (
          <Pressable
            onPress={() => {
              haptic.select();
              setExpanded(null);
              props.filters.forEach((g) => g.onChange(g.defaultValue));
            }}
            hitSlop={8}
            style={s.reset}
          >
            <Text style={s.resetText}>ล้างตัวกรอง</Text>
          </Pressable>
        )}
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
  pill: { flexDirection: "row", alignItems: "center", height: 40, paddingHorizontal: 4, borderRadius: 20, backgroundColor: "#e5e5e5" },
  pillHalf: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  pillHalfActive: { backgroundColor: "#fce7f3" },
  buttonPrimary: { backgroundColor: color.primary },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cancel: { fontSize: 16, fontWeight: "600", color: color.primary },
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
  reset: { alignSelf: "flex-start", paddingVertical: 4 },
  resetText: { fontSize: 16, fontWeight: "600", color: color.primary },
  rowPressed: { backgroundColor: color.muted },
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
