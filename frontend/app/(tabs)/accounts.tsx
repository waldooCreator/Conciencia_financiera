import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { walletService } from '../../src/services/finance';
import { Wallet } from '../../src/types';

const walletIcons: Record<string, string> = {
  cash: '💵',
  debit: '🏦',
  credit: '💳',
};

const walletTypeLabels: Record<string, string> = {
  cash: 'Efectivo',
  debit: 'Cuenta Débito',
  credit: 'Tarjeta de Crédito',
};

export default function AccountsScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await walletService.getAll();
      setWallets(data);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate totals
  const totalBalance = wallets
    .filter((w) => w.type !== 'credit')
    .reduce((sum, w) => sum + parseFloat(w.balance), 0);

  const totalDebt = wallets
    .filter((w) => w.type === 'credit')
    .reduce((sum, w) => sum + parseFloat(w.balance), 0);

  const totalCredit = wallets
    .filter((w) => w.type === 'credit' && w.credit_limit)
    .reduce((sum, w) => sum + parseFloat(w.credit_limit || '0'), 0);

  return (
    <ScrollView
      className="flex-1 bg-bone p-6"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20394a" />
      }
    >
      <View className="mb-6">
        <Text className="text-3xl font-bold text-noir">
          Cuentas
        </Text>
        <Text className="text-concrete mt-2">
          Tus medios de pago
        </Text>
      </View>

      {/* Resumen General */}
      <View className="bg-denim rounded-2xl p-4 mb-6">
        <Text className="text-concrete text-sm mb-1">Balance Total</Text>
        <Text className="text-bone text-3xl font-bold">
          ${totalBalance.toLocaleString()}
        </Text>
        {totalDebt > 0 && (
          <View className="mt-3 pt-3 border-t border-steel/20">
            <Text className="text-concrete text-sm">
              Deuda tarjetas: ${totalDebt.toLocaleString()} / ${totalCredit.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Lista de Wallets */}
      <Text className="text-xl font-bold text-noir mb-3">
        Medios de Pago
      </Text>

      {wallets.length > 0 ? (
        wallets.map((wallet) => (
          <View key={wallet.id} className="bg-denim rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">
                  {walletIcons[wallet.type] || '💰'}
                </Text>
                <View>
                  <Text className="text-bone font-semibold text-lg">
                    {wallet.name}
                  </Text>
                  <Text className="text-steel text-sm mt-0.5">
                    {walletTypeLabels[wallet.type] || wallet.type}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-bone text-xl font-bold">
                  ${parseFloat(wallet.balance).toLocaleString()}
                </Text>
                {wallet.type === 'credit' && wallet.credit_limit && (
                  <Text className="text-concrete text-xs mt-1">
                    Límite: ${parseFloat(wallet.credit_limit).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
            {wallet.type === 'credit' && wallet.available_credit && (
              <View className="mt-3 pt-3 border-t border-steel/20">
                <View className="flex-row justify-between">
                  <Text className="text-concrete text-sm">Crédito disponible</Text>
                  <Text className="text-steel text-sm font-medium">
                    ${parseFloat(wallet.available_credit).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))
      ) : (
        <View className="items-center justify-center py-12">
          <Text className="text-4xl mb-3">💳</Text>
          <Text className="text-concrete text-lg">No hay medios de pago</Text>
          <Text className="text-concrete text-sm mt-1">Agrega tu primera cuenta o tarjeta</Text>
        </View>
      )}
    </ScrollView>
  );
}
