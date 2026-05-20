import { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to login after a brief delay for splash effect
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-bone items-center justify-center p-6">
      <View className="items-center">
        {/* Placeholder for Logo */}
        <View className="w-24 h-24 bg-denim rounded-3xl mb-6 items-center justify-center">
          <Text className="text-4xl text-bone font-bold">$</Text>
        </View>
        
        <Text className="text-3xl font-bold text-noir mb-2">
          Conciencia Financiera
        </Text>
        <Text className="text-lg text-concrete text-center">
          Tu dinero bajo control
        </Text>
      </View>
    </View>
  );
}
