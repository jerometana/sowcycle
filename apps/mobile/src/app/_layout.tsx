import { PowerSyncContext } from "@powersync/react-native";
import type { Session } from "@supabase/supabase-js";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { db } from "../db";
import { connector } from "../db/connector";
import { supabase } from "../lib/supabase";
import { useReminders } from "../notifications/reminders";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      db.connect(connector);
    } else if (session === null) {
      db.disconnectAndClear();
    }
  }, [session?.user.id]);

  useReminders(session === undefined ? "unknown" : session ? "signedIn" : "signedOut");

  if (session === undefined) return null;

  return (
    <PowerSyncContext.Provider value={db}>
      <Stack>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="index" options={{ title: "แม่พันธุ์" }} />
          <Stack.Screen name="sows/[id]/index" options={{ title: "", headerBackTitle: "แม่พันธุ์" }} />
          <Stack.Screen
            name="sows/[id]/breed"
            options={{ presentation: "formSheet", title: "เพิ่มการผสม", sheetAllowedDetents: [0.6, 1] }}
          />
          <Stack.Screen
            name="sows/[id]/farrow"
            options={{ presentation: "formSheet", title: "บันทึกการคลอด", sheetAllowedDetents: [1] }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </PowerSyncContext.Provider>
  );
}
