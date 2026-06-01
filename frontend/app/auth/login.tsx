import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

/** Legacy route — app is local-only; redirect to main screen. */
export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)/register');
  }, []);

  return (
    <View className="flex-1 bg-bone items-center justify-center">
      <Text className="text-concrete">Redirigiendo...</Text>
    </View>
  );
}
