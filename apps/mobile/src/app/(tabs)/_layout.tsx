import { Tabs } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, useAnimatedValue, type ColorValue } from "react-native";
import { AccountDrawer } from "../../components/AccountDrawer";
import { PressableScale } from "../../components/motion";
import { color, fonts } from "../../theme";
import { Calendar, Fence, House, PiggyBank, Syringe, User } from "../../theme/icons";
import { haptic } from "../../lib/haptics";

function AccountButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressableScale
        hitSlop={8}
        accessibilityLabel="บัญชี"
        onPress={() => {
          haptic.tap();
          setOpen(true);
        }}
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e5e5", alignItems: "center", justifyContent: "center", marginRight: 16 }}
      >
        <User size={20} color={color.gray600} />
      </PressableScale>
      <AccountDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function TabIcon(props: { icon: LucideIcon; color: ColorValue; focused: boolean }) {
  const scale = useAnimatedValue(1);
  useEffect(() => {
    if (!props.focused) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
  }, [scale, props.focused]);
  const Icon = props.icon;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon size={24} color={props.color} />
    </Animated.View>
  );
}

const tabIcon = (icon: LucideIcon) =>
  function TabBarIcon(p: { color: ColorValue; focused: boolean }) {
    return <TabIcon icon={icon} {...p} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptic.select() }}
      screenOptions={{
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.gray600,
        tabBarStyle: { backgroundColor: color.card, borderTopWidth: 0, elevation: 0 },
        tabBarLabelStyle: { fontFamily: fonts["400"], fontSize: 12 },
        headerStyle: { backgroundColor: color.background },
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTitleStyle: { fontFamily: fonts["700"], fontSize: 26, color: color.foreground },
        headerRight: AccountButton,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "หน้าหลัก", tabBarIcon: tabIcon(House) }} />
      <Tabs.Screen name="sows" options={{ title: "แม่พันธุ์", tabBarIcon: tabIcon(PiggyBank) }} />
      <Tabs.Screen name="medicines" options={{ title: "ยาและวัคซีน", tabBarLabel: "ยา", tabBarIcon: tabIcon(Syringe) }} />
      <Tabs.Screen name="litters" options={{ title: "ครอกลูกหมู", tabBarLabel: "ครอก", tabBarIcon: tabIcon(Fence) }} />
      <Tabs.Screen name="calendar" options={{ title: "กำหนดการ", tabBarIcon: tabIcon(Calendar) }} />
    </Tabs>
  );
}
