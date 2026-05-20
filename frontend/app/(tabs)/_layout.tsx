import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center py-1">
      <View className={`w-1.5 h-1.5 rounded-full mb-1 ${focused ? 'bg-noir' : 'bg-transparent'}`} />
      <Text
        className={`text-xs font-semibold ${focused ? 'text-noir' : 'text-concrete'}`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#f9f5ed',
          borderTopColor: '#c9ccc3',
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: 8,
          height: 64,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: '#f9f5ed' },
      }}
    >
      <Tabs.Screen
        name="register"
        options={{
          title: 'Registro',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Registro" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Cuentas',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Cuentas" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Configuración" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
