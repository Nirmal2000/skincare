import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

function FullWidthTabBar(props: BottomTabBarProps) {
  return (
    <BottomTabBar
      {...props}
      style={[
        {
          width: "100%",
          alignSelf: "stretch",
          justifyContent: "space-around",
        },
      ]}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0A0A0A",
        headerShown: false,
      }}
      tabBar={(props) => <FullWidthTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="result"
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
