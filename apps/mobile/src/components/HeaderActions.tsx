import { useNavigation } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { haptic } from "../lib/haptics";
import { color } from "../theme";
import { Search, User, X } from "../theme/icons";
import { AccountDrawer } from "./AccountDrawer";
import { FadeIn, PressableScale } from "./motion";
import { SearchBar } from "./ui";

// The header's right side: an optional search toggle, then the account button.
export function HeaderActions(props: { search?: { open: boolean; onToggle: () => void } }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const SearchIcon = props.search?.open ? X : Search;
  return (
    <View style={s.row}>
      {props.search && (
        <PressableScale
          hitSlop={8}
          accessibilityLabel={props.search.open ? "ปิดการค้นหา" : "ค้นหา"}
          onPress={() => {
            haptic.tap();
            props.search?.onToggle();
          }}
          style={[s.button, props.search.open && s.buttonActive]}
        >
          <SearchIcon size={20} color={props.search.open ? color.primary : color.gray600} />
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

// Puts a search toggle in the screen's header and returns the query plus the field to render when it is open.
export function useHeaderSearch(placeholder: string) {
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useLayoutEffect(() => {
    const onToggle = () => {
      if (open) setQuery("");
      setOpen(!open);
    };
    navigation.setOptions({ headerRight: () => <HeaderActions search={{ open, onToggle }} /> });
  }, [navigation, open]);

  const field = open ? (
    <FadeIn>
      <SearchBar value={query} onChange={setQuery} placeholder={placeholder} autoFocus />
    </FadeIn>
  ) : null;

  return { query, field };
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 16 },
  button: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e5e5", alignItems: "center", justifyContent: "center" },
  buttonActive: { backgroundColor: "#fce7f3" },
});
