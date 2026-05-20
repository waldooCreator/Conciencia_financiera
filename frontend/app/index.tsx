import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View className="flex-1 bg-bone items-center justify-center p-6">
      <Text className="text-3xl font-bold text-noir mb-4">
        Conciencia Financiera
      </Text>
      <Text className="text-lg text-concrete text-center mb-8">
        Tu aplicación de finanzas personales
      </Text>
      <Link
        href="/(tabs)"
        className="bg-noir px-8 py-4 rounded-2xl"
      >
        <Text className="text-bone text-lg font-semibold">
          Comenzar
        </Text>
      </Link>
    </View>
  );
}
