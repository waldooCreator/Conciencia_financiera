import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TransactionCard } from '../../src/components';
import { PrimaryButton } from '../../src/components';
import { transactionService, walletService, goalService } from '../../src/services/finance';
import { TransactionSummary, Transaction, Wallet, SavingsGoal } from '../../src/types';

export default function DashboardScreen() {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, txData, walletData, goalData] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getAll(),
        walletService.getAll(),
        goalService.getAll(),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txData);
      setWallets(walletData);
      setGoals(goalData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate total debt from credit cards
  const totalDebt = wallets
    .filter((w) => w.type === 'credit')
    .reduce((sum, w) => sum + parseFloat(w.balance), 0);

  // Calculate total available balance
  const totalBalance = wallets
    .filter((w) => w.type !== 'credit')
    .reduce((sum, w) => sum + parseFloat(w.balance), 0);

  return (
    <ScrollView
      className="flex-1 bg-bone p-6"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20394a" />
      }
    >
      <View className="mb-6">
        <Text className="text-3xl font-bold text-noir">
          Dashboard
        </Text>
        <Text className="text-concrete mt-2">
          Resumen de tus finanzas
        </Text>
      </View>

      {/* Balance Total */}
      <View className="bg-denim rounded-2xl p-5 mb-4">
        <Text className="text-concrete text-sm mb-1">Balance Disponible</Text>
        <Text className="text-bone text-3xl font-bold">
          ${totalBalance.toLocaleString()}
        </Text>
      </View>

      {/* Resumen del Mes */}
      {summary && (
        <View className="flex-row justify-between mb-4">
          <View className="bg-denim rounded-2xl p-4 flex-1 mr-2">
            <Text className="text-concrete text-sm">Ingresos</Text>
            <Text className="text-green-400 text-xl font-bold mt-1">
              ${summary.total_income.toLocaleString()}
            </Text>
          </View>
          <View className="bg-denim rounded-2xl p-4 flex-1 ml-2">
            <Text className="text-concrete text-sm">Gastos</Text>
            <Text className="text-bone text-xl font-bold mt-1">
              ${summary.total_expenses.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Proyección de Deuda */}
      {totalDebt > 0 && (
        <View className="bg-denim rounded-2xl p-4 mb-4">
          <Text className="text-bone font-semibold mb-2">
            Proyección de Deuda
          </Text>
          <Text className="text-3xl font-bold text-bone">
            ${totalDebt.toLocaleString()}
          </Text>
          <Text className="text-concrete text-sm mt-1">
            Deuda total en tarjetas de crédito
          </Text>
        </View>
      )}

      {/* Metas de Ahorro */}
      {goals.length > 0 && (
        <View className="mb-4">
          <Text className="text-xl font-bold text-noir mb-3">Metas de Ahorro</Text>
          {goals.map((g) => (
            <View key={g.id} className="bg-denim rounded-2xl p-4 mb-2">
              <View className="flex-row justify-between mb-2">
                <Text className="text-bone font-semibold">{g.name}</Text>
                <Text className="text-steel font-bold">{g.progress_percentage.toFixed(0)}%</Text>
              </View>
              <View className="bg-steel/20 rounded-full h-2"><View className="bg-steel rounded-full h-2" style={{ width: `${Math.min(100, g.progress_percentage)}%` }} /></View>
            </View>
          ))}
        </View>
      )}

      {/* Transacciones Recientes */}
      <Text className="text-xl font-bold text-noir mb-3">
        Transacciones Recientes
      </Text>
      
      {transactions.length > 0 ? (
        transactions.slice(0, 10).map((tx) => (
          <View key={tx.id}>
            <TransactionCard
              amount={tx.amount}
              type={tx.type}
              category={tx.category_name}
              walletName={tx.wallet_name}
              date={new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              description={tx.description}
              installments={tx.installments > 1 ? { current: tx.current_installment, total: tx.installments } : undefined}
            />
            <View className="flex-row justify-end mb-3 -mt-2 px-4" style={{gap: 6}}>
              <TouchableOpacity onPress={() => setDeleteTarget(tx)} className="bg-red-500/20 px-3 py-1 rounded-lg">
                <Text className="text-red-400 text-xs">Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View className="items-center justify-center py-12">
          <Text className="text-4xl mb-3">📊</Text>
          <Text className="text-concrete text-lg">No hay transacciones aún</Text>
          <Text className="text-concrete text-sm mt-1">Registra tu primer gasto para comenzar</Text>
        </View>
      )}
    </ScrollView>

      {/* Delete Transaction Modal */}
      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View className="flex-1 bg-noir/50 justify-center items-center p-6">
          <View className="bg-bone rounded-2xl p-6 w-80">
            <Text className="text-xl font-bold text-noir mb-2">Eliminar</Text>
            <Text className="text-concrete mb-6">¿Eliminar esta transacción?</Text>
            <View className="flex-row"><View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setDeleteTarget(null)} variant="secondary" /></View><View className="flex-1 ml-2"><PrimaryButton title="Eliminar" onPress={async () => { if (!deleteTarget) return; setDeleteLoading(true); try { await transactionService.delete(deleteTarget.id); setDeleteTarget(null); loadData(); } catch {} finally { setDeleteLoading(false); }}} loading={deleteLoading} /></View></View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
