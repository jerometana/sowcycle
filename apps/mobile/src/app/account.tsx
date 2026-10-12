import { useQuery } from "@powersync/react-native";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Card, InfoRow, screen } from "../components/ui";
import { supabase } from "../lib/supabase";
import { color, Text } from "../theme";
import { Dna, User } from "../theme/icons";
import { router } from "expo-router";

export default function Account() {
  const [email, setEmail] = useState<string | null>(null);
  const { data } = useQuery<{ n: number }>("select count(*) as n from boars");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={screen.root} contentContainerStyle={screen.content}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#d4d4d4", alignItems: "center", justifyContent: "center" }}>
            <User size={28} color={color.card} />
          </View>
          <Text style={{ color: color.mutedForeground }}>{email ?? ""}</Text>
        </View>
      </Card>
      <Card onPress={() => router.push("/boars")}>
        <InfoRow icon={Dna} label="สายพันธุ์">{`${data[0]?.n ?? 0} สายพันธุ์`}</InfoRow>
      </Card>
      <Button title="ออกจากระบบ" variant="destructive" onPress={() => supabase.auth.signOut()} />
    </ScrollView>
  );
}
