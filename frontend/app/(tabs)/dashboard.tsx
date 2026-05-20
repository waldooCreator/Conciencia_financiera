import { View, Text, ScrollView } from 'react-native';
import { TransactionCard } from '../../src/components';

export default function DashboardScreen() {
  return (
    <ScrollView className="flex-1 bg-bone p-6">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-noir">
          Dashboard
        </Text>
        <Text className="text-concrete mt-2">
          Resumen de tus finanzas
        </Text>
      </View>

      {/* Meta de Ahorro */}
      <View className="bg-denim rounded-2xl p-4 mb-4">
        <Text className="text-bone font-semibold mb-2">
          Meta de Ahorro
        </Text>
        <View className="bg-steel/20 rounded-full h-3 mb-2">
          <View className="bg-steel rounded-full h-3 w-1/4" />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-concrete text-sm">
            $500,000 / $2,000,000
          </Text>
          <Text className="text-steel text-sm font-medium">
            25%
          </Text>
        </View>
      </View>

      {/* Proyección de Deuda */}
      <View className="bg-denim rounded-2xl p-4 mb-4">
        <Text className="text-bone font-semibold mb-2">
          Proyección de Deuda
        </Text>
        <Text className="text-3xl font-bold text-bone">
          $150,000
        </Text>
        <Text className="text-concrete text-sm mt-1">
          Cuotas a pagar este mes
        </Text>
      </View>

      {/* Transacciones Recientes */}
      <Text className="text-xl font-bold text-noir mb-3">
        Transacciones Recientes
      </Text>
      <TransactionCard
        amount="150,000"
        type="expense"
        category="Hormiga"
        walletName="RappiCard"
        date="19 Mayo 2026"
        description="Compra supermercado"
      />
      <TransactionCard
        amount="2,500,000"
        type="income"
        category="Sueldo"
        walletName="Cuenta Bancaria"
        date="15 Mayo 2026"
      />
    </ScrollView>
  );
}
