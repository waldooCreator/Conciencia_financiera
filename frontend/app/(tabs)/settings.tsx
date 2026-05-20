import { View, Text, ScrollView, Pressable } from 'react-native';
import { PrimaryButton } from '../../src/components';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-bone p-6">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-noir">
          Configuración
        </Text>
      </View>

      {/* Perfil */}
      <View className="bg-denim rounded-2xl p-4 mb-4">
        <Text className="text-bone font-semibold text-lg mb-2">
          Perfil
        </Text>
        <Text className="text-concrete">
          usuario@ejemplo.com
        </Text>
      </View>

      {/* Opciones */}
      <View className="bg-denim rounded-2xl mb-4">
        <Pressable className="p-4 border-b border-steel/20">
          <Text className="text-bone text-base">
            Editar Perfil
          </Text>
        </Pressable>
        <Pressable className="p-4 border-b border-steel/20">
          <Text className="text-bone text-base">
            Gestionar Categorías
          </Text>
        </Pressable>
        <Pressable className="p-4">
          <Text className="text-bone text-base">
            Preferencias
          </Text>
        </Pressable>
      </View>

      {/* Cerrar Sesión */}
      <View className="mt-6">
        <PrimaryButton
          title="Cerrar Sesión"
          onPress={() => {}}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
}
