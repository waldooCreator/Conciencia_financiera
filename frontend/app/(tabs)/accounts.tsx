import { View, Text, ScrollView } from 'react-native';

export default function AccountsScreen() {
  const wallets = [
    { name: 'RappiCard', type: 'credit', balance: '150,000', limit: '5,000,000' },
    { name: 'Cuenta Bancaria', type: 'debit', balance: '2,350,000' },
    { name: 'Efectivo', type: 'cash', balance: '85,000' },
  ];

  return (
    <ScrollView className="flex-1 bg-bone p-6">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-noir">
          Cuentas
        </Text>
        <Text className="text-concrete mt-2">
          Tus medios de pago
        </Text>
      </View>

      {wallets.map((wallet, index) => (
        <View key={index} className="bg-denim rounded-2xl p-4 mb-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-bone font-semibold text-lg">
                {wallet.name}
              </Text>
              <Text className="text-steel text-sm mt-1">
                {wallet.type === 'credit' ? 'Tarjeta de Crédito' : wallet.type === 'debit' ? 'Cuenta Débito' : 'Efectivo'}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-bone text-xl font-bold">
                ${wallet.balance}
              </Text>
              {wallet.limit && (
                <Text className="text-concrete text-xs mt-1">
                  Límite: ${wallet.limit}
                </Text>
              )}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
