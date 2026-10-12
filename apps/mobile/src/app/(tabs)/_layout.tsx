import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

const PINK = "#ec4899";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: PINK }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "แม่พันธุ์",
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="litters"
        options={{
          title: "ครอก",
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="boars"
        options={{
          title: "พ่อพันธุ์",
          tabBarIcon: ({ color, size }) => <Ionicons name="male" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: "ยา",
          tabBarIcon: ({ color, size }) => <Ionicons name="medkit" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "ปฏิทิน",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
