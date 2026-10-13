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
import { useEffect, useState, type ReactElement } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { db } from "../db";
import { connector } from "../db/connector";
import { supabase } from "../lib/supabase";
import { useReminders } from "../notifications/reminders";
import { color, fonts, Text } from "../theme";

// Form sheets styled like the Drawer component: grabber, rounded top, white surface.
const drawer = (title: string, sheetAllowedDetents: number[] = [1]) =>
  ({
    presentation: "formSheet",
    title,
    sheetAllowedDetents,
    sheetGrabberVisible: true,
    sheetCornerRadius: 24,
    contentStyle: { backgroundColor: color.card },
    headerStyle: { backgroundColor: color.card },
  }) as const;

// Android form sheets draw neither a header nor a grabber, so the sheet's title and handle are drawn here instead.
function screenLayout({ options, children }: { options: { presentation?: string; title?: string }; children: ReactElement }) {
  if (Platform.OS !== "android" || options.presentation !== "formSheet") return children;
  return (
    <View style={s.sheet}>
      <View style={s.handle} />
      {!!options.title && <Text style={s.title}>{options.title}</Text>}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

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
        screenLayout={screenLayout}
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
          <Stack.Screen name="boars/index" options={{ title: "สายพันธุ์" }} />
          <Stack.Screen
            name="medicines/[id]"
            options={drawer("ยา")}
          />
          <Stack.Screen
            name="sows/[id]/treatment"
            options={drawer("บันทึกการใช้ยา")}
          />
          <Stack.Screen
            name="boars/[id]"
            options={drawer("พ่อพันธุ์")}
          />
          <Stack.Screen
            name="litters/[id]/index"
            options={drawer("ครอก")}
          />
          <Stack.Screen
            name="litters/[id]/edit"
            options={drawer("แก้ไขข้อมูลครอก")}
          />
          <Stack.Screen name="sows/[id]/index" options={{ title: "" }} />
          <Stack.Screen
            name="sows/[id]/edit"
            options={drawer("แม่พันธุ์")}
          />
          <Stack.Screen
            name="sows/[id]/breed"
            options={drawer("เพิ่มการผสม", [0.6, 1])}
          />
          <Stack.Screen
            name="sows/[id]/farrow"
            options={drawer("บันทึกการคลอด")}
          />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </PowerSyncContext.Provider>
  );
}

const s = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: color.card },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "#d4d4d4", marginTop: 10, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "600", paddingHorizontal: 20 },
});
