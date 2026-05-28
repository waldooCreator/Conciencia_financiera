import React from 'react';
import { View, Text } from 'react-native';
import { ArrowLeftRight, CreditCard, ArrowUpCircle } from 'lucide-react-native';

interface TransactionCardProps {
  amount: string;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  walletName?: string;
  walletType?: string;
  destinationWalletName?: string;
  destinationWalletType?: string;
  date?: string;
  description?: string;
  installments?: { current: number; total: number; };
}

export default function TransactionCard({
  amount, type, category, walletName, walletType,
  destinationWalletName, destinationWalletType,
  date, description, installments,
}: TransactionCardProps) {
  const isIncome = type === 'income';
  const isTransfer = type === 'transfer';
  const isCreditPayment = isTransfer && destinationWalletType === 'credit';
  const isCashAdvance = isTransfer && walletType === 'credit';

  const getLabel = () => {
    if (isCashAdvance) return 'Avance TC';
    if (isCreditPayment) return 'Pago TC';
    if (isTransfer) return 'Transferencia';
    if (isIncome) return category || 'Ingreso';
    return category || 'Sin categoría';
  };

  const getIcon = () => {
    if (isCashAdvance) return <CreditCard size={14} strokeWidth={2} color="#e74c3c" style={{ marginRight: 6 }} />;
    if (isCreditPayment) return <ArrowUpCircle size={14} strokeWidth={2} color="#2ecc71" style={{ marginRight: 6 }} />;
    if (isTransfer) return <ArrowLeftRight size={14} strokeWidth={2} color="#6196aa" style={{ marginRight: 6 }} />;
    return null;
  };

  const getAmountPrefix = () => {
    if (isCashAdvance) return '↗';
    if (isCreditPayment) return '↙';
    if (isTransfer) return '↔';
    if (isIncome) return '+';
    return '-';
  };

  const getAmountColor = () => {
    if (isCreditPayment) return 'text-green-400';
    if (isCashAdvance) return 'text-red-400';
    if (isTransfer) return 'text-steel';
    if (isIncome) return 'text-green-400';
    return 'text-bone';
  };

  return (
    <View className="bg-denim rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center">
            {getIcon()}
            <Text className={`font-semibold text-base ${
              isCashAdvance ? 'text-red-400' : isCreditPayment ? 'text-green-400' : isTransfer ? 'text-steel' : 'text-bone'
            }`}>
              {getLabel()}
            </Text>
          </View>
          {description ? (
            <Text className="text-concrete text-sm mt-1" numberOfLines={1}>{description}</Text>
          ) : null}
          {isTransfer && destinationWalletName ? (
            <Text className="text-steel text-xs mt-1">{walletName} → {destinationWalletName}</Text>
          ) : walletName ? (
            <Text className="text-steel text-xs mt-1">{walletName}</Text>
          ) : null}
        </View>
        <View className="items-end">
          <Text className={`text-lg font-bold ${getAmountColor()}`}>
            {getAmountPrefix()} ${Number(amount).toLocaleString('es-CO')}
          </Text>
          {installments && (
            <Text className="text-steel text-xs mt-1">{installments.current}/{installments.total} cuotas</Text>
          )}
        </View>
      </View>
      {date && (
        <View className="mt-3 pt-3 border-t border-steel/20">
          <Text className="text-concrete text-xs">{date}</Text>
        </View>
      )}
    </View>
  );
}
