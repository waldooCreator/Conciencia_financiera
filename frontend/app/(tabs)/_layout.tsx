import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

const tabIcons: Record<string, string> = {
  register: '💸',
  dashboard: '📊',
  accounts: '💳',
  settings: '⚙️',
};

function TabIcon({ label, icon, focused }: { label: string; icon: string; focused: boolean }) {
  return (
    <View className="items-center justify-center py-1">
      <Text className={`text-lg mb-0.5 ${focused ? 'opacity-100' : 'opacity-40'}`}>{icon}</Text>
      <Text className={`text-[10px] font-semibold ${focused ? 'text-steel' : 'text-concrete'}`}>
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
          borderTopWidth: 0.5,
          paddingTop: 6,
          paddingBottom: 8,
          height: 62,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: '#f9f5ed' },
      }}
    >
      <Tabs.Screen name="register" options={{ tabBarIcon: ({ focused }) => <TabIcon label="Registro" icon={tabIcons.register} focused={focused} /> }} />
      <Tabs.Screen name="dashboard" options={{ tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" icon={tabIcons.dashboard} focused={focused} /> }} />
      <Tabs.Screen name="accounts" options={{ tabBarIcon: ({ focused }) => <TabIcon label="Cuentas" icon={tabIcons.accounts} focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ tabBarIcon: ({ focused }) => <TabIcon label="Config" icon={tabIcons.settings} focused={focused} /> }} />
    </Tabs>
  );
}
