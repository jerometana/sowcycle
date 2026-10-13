import { PowerSyncContext } from "@powersync/react-native";
import type { Session } from "@supabase/supabase-js";
import {
  IBMPlexSansThai_400Regular,
  IBMPlexSansThai_500Medium,
  IBMPlexSansThai_600SemiBold,
  IBMPlexSansThai_700Bold,
  useFonts,
} from "@expo-google-fonts/ibm-plex-sans-thai";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { db } from "../db";
import { connector } from "../db/connector";
import { supabase } from "../lib/supabase";
import { useReminders } from "../notifications/reminders";
import { color, fonts } from "../theme";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [fontsLoaded] = useFonts({
    IBMPlexSansThai_400Regular,
    IBMPlexSansThai_500Medium,
    IBMPlexSansThai_600SemiBold,
    IBMPlexSansThai_700Bold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const signedOut = session === null;
  useEffect(() => {
    if (userId) db.connect(connector);
    else if (signedOut) db.disconnectAndClear();
  }, [userId, signedOut]);

  useReminders(session === undefined ? "unknown" : session ? "signedIn" : "signedOut");

  if (session === undefined || !fontsLoaded) return null;

  return (
    <PowerSyncContext.Provider value={db}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.background },
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerTitleStyle: { fontFamily: fonts["600"], fontSize: 18, color: color.foreground },
          headerTintColor: color.foreground,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: color.background },
        }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ title: "บัญชี" }} />
          <Stack.Screen name="boars/index" options={{ title: "สายพันธุ์" }} />
          <Stack.Screen
            name="medicines/[id]"
            options={{ presentation: "formSheet", contentStyle: { backgroundColor: color.card }, headerStyle: { backgroundColor: color.card }, title: "ยา", sheetAllowedDetents: [1] }}
          />
          <Stack.Screen
            name="sows/[id]/treatment"
            options={{ presentation: "formSheet", contentStyle: { backgroundColor: color.card }, headerStyle: { backgroundColor: color.card }, title: "บันทึกการใช้ยา", sheetAllowedDetents: [1] }}
          />
          <Stack.Screen
            name="boars/[id]"
            options={{ presentation: "formSheet", contentStyle: { backgroundColor: color.card }, headerStyle: { backgroundColor: color.card }, title: "พ่อพันธุ์", sheetAllowedDetents: [1] }}
          />
          <Stack.Screen
            name="litters/[id]"
            options={{ presentation: "formSheet", contentStyle: { backgroundColor: color.card }, headerStyle: { backgroundColor: color.card }, title: "ครอก", sheetAllowedDetents: [1] }}
          />
          <Stack.Screen name="sows/[id]/index" options={{ title: "" }} />
          <Stack.Screen
            name="sows/[id]/breed"
            options={{ presentation: "formSheet", contentStyle: { backgroundColor: color.card }, headerStyle: { backgroundColor: color.card }, title: "เพิ่มการผสม", sheetAllowedDetents: [0.6, 1] }}
          />
          <Stack.Screen
            name="sows/[id]/farrow"
            options={{ presentation: "formSheet", contentStyle: { backgroundColor: color.card }, headerStyle: { backgroundColor: color.card }, title: "บันทึกการคลอด", sheetAllowedDetents: [1] }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </PowerSyncContext.Provider>
  );
}
