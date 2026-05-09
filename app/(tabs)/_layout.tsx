import { Tabs } from "expo-router";
import { Home, CreditCard, BookOpen } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0D7C5F",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontFamily: "Manrope_500Medium",
          fontSize: 12,
        },
        tabBarStyle: {
          borderTopColor: "#EEF1F5",
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: "Карты",
          tabBarIcon: ({ color, size }) => (
            <CreditCard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tips"
        options={{
          title: "Советы",
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
