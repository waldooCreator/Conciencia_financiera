import React from 'react';
import { View, Text } from 'react-native';

interface TransactionCardProps {
  amount: string;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  walletName?: string;
  date?: string;
  description?: string;
  installments?: {
    current: number;
    total: number;
  };
}

export default function TransactionCard({
  amount,
  type,
  category,
  walletName,
  date,
  description,
  installments,
}: TransactionCardProps) {
  const isIncome = type === 'income';

  return (
    <View className="bg-denim rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-bone font-semibold text-base">
            {category || 'Sin categoría'}
          </Text>
          {description && (
            <Text className="text-concrete text-sm mt-1" numberOfLines={1}>
              {description}
            </Text>
          )}
          {walletName && (
            <Text className="text-steel text-xs mt-1">
              {walletName}
            </Text>
          )}
        </View>
        <View className="items-end">
          <Text
            className={`text-lg font-bold ${isIncome ? 'text-green-400' : 'text-bone'}`}
          >
            {isIncome ? '+' : '-'}${amount}
          </Text>
          {installments && (
            <Text className="text-steel text-xs mt-1">
              {installments.current}/{installments.total} cuotas
            </Text>
          )}
        </View>
      </View>
      {date && (
        <View className="mt-3 pt-3 border-t border-steel/20">
          <Text className="text-concrete text-xs">
            {date}
          </Text>
        </View>
      )}
    </View>
  );
}
