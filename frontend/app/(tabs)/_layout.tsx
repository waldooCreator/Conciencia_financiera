import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { PlusCircle, LayoutDashboard, Wallet, Settings } from 'lucide-react-native';

const iconProps = { size: 22, strokeWidth: 2 };

function TabIcon({ Icon, label, focused }: { Icon: any; label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center py-1">
      <Icon {...iconProps} color={focused ? '#030706' : '#c9ccc3'} />
      <Text className={`text-[10px] font-semibold mt-0.5 ${focused ? 'text-noir' : 'text-concrete'}`}>
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
      }}
    >
      <Tabs.Screen name="register" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={PlusCircle} label="Registro" focused={focused} /> }} />
      <Tabs.Screen name="dashboard" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={LayoutDashboard} label="Dashboard" focused={focused} /> }} />
      <Tabs.Screen name="accounts" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Wallet} label="Cuentas" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Settings} label="Config" focused={focused} /> }} />
    </Tabs>
  );
}
