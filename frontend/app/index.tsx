import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { appStateService } from '../src/services/appState';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const complete = await appStateService.isOnboardingComplete();
      router.replace(complete ? '/(tabs)/register' : '/onboarding');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-bone items-center justify-center p-6">
      <View className="items-center">
        <View className="w-24 h-24 bg-denim rounded-3xl mb-6 items-center justify-center">
          <Text className="text-4xl text-bone font-bold">$</Text>
        </View>
        <Text className="text-3xl font-bold text-noir mb-2">Conciencia Financiera</Text>
        <Text className="text-lg text-concrete text-center">Tu dinero bajo control</Text>
        <Text className="text-sm text-steel mt-4">100% offline · Datos en tu dispositivo</Text>
      </View>
    </View>
  );
}
