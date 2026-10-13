import { router, Tabs } from "expo-router";
import { Pressable } from "react-native";
import { color, fonts } from "../../theme";
import { Calendar, Fence, House, PiggyBank, Syringe, User } from "../../theme/icons";

const AccountButton = () => (
  <Pressable
    hitSlop={8}
    accessibilityLabel="บัญชี"
    onPress={() => router.push("/account")}
    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e5e5", alignItems: "center", justifyContent: "center", marginRight: 16 }}
  >
    <User size={20} color={color.gray600} />
  </Pressable>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.gray600,
        tabBarStyle: { backgroundColor: color.card, borderTopWidth: 0, elevation: 0 },
        tabBarLabelStyle: { fontFamily: fonts["400"], fontSize: 12 },
        headerStyle: { backgroundColor: color.background },
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerTitleStyle: { fontFamily: fonts["600"], fontSize: 18, color: color.foreground },
        headerRight: AccountButton,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "หน้าหลัก", tabBarIcon: ({ color: c }) => <House size={24} color={c} /> }} />
      <Tabs.Screen name="sows" options={{ title: "แม่พันธุ์", tabBarIcon: ({ color: c }) => <PiggyBank size={24} color={c} /> }} />
      <Tabs.Screen name="medicines" options={{ title: "ยาและวัคซีน", tabBarLabel: "ยา", tabBarIcon: ({ color: c }) => <Syringe size={24} color={c} /> }} />
      <Tabs.Screen name="litters" options={{ title: "ครอกลูกหมู", tabBarLabel: "ครอก", tabBarIcon: ({ color: c }) => <Fence size={24} color={c} /> }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: ({ color: c }) => <Calendar size={24} color={c} /> }} />
    </Tabs>
  );
}
