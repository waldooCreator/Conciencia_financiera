import { View, Text, ScrollView } from 'react-native';
import { PrimaryButton, FormInput } from '../../src/components';

export default function RegisterScreen() {
  return (
    <ScrollView className="flex-1 bg-bone p-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-noir">
          Registrar Gasto
        </Text>
        <Text className="text-concrete mt-2">
          Rápido y sin fricción
        </Text>
      </View>

      <FormInput
        label="Monto"
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      <FormInput
        label="Descripción"
        placeholder="¿En qué gastaste?"
      />

      <FormInput
        label="Categoría"
        placeholder="Seleccionar categoría"
      />

      <FormInput
        label="Medio de Pago"
        placeholder="Seleccionar medio de pago"
      />

      <View className="mt-6">
        <PrimaryButton
          title="Guardar Gasto"
          onPress={() => {}}
        />
      </View>
    </ScrollView>
  );
}
