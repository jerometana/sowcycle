import { useQuery } from "@powersync/react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { supabase } from "../lib/supabase";
import { color, Text } from "../theme";
import { Dna, User } from "../theme/icons";
import { Drawer } from "./Drawer";
import { Button, Card, InfoRow } from "./ui";

export function AccountDrawer(props: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const { data } = useQuery<{ n: number }>("select count(*) as n from boars");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  return (
    <Drawer open={props.open} onClose={props.onClose} title="บัญชีผู้ใช้">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#d4d4d4", alignItems: "center", justifyContent: "center" }}>
          <User size={26} color={color.card} />
        </View>
        <Text style={{ color: color.mutedForeground }}>{email ?? ""}</Text>
      </View>
      <Card
        style={{ backgroundColor: color.muted }}
        onPress={() => {
          props.onClose();
          router.push("/boars");
        }}
      >
        <InfoRow icon={Dna} label="สายพันธุ์">{`${data[0]?.n ?? 0} สายพันธุ์`}</InfoRow>
      </Card>
      <Button title="ออกจากระบบ" variant="destructive" onPress={() => supabase.auth.signOut()} />
    </Drawer>
  );
}
