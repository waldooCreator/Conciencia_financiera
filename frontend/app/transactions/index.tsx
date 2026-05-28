import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { ChevronLeft, Trash2, Filter } from 'lucide-react-native';
import { TransactionCard, PrimaryButton } from '../../src/components';
import { transactionService } from '../../src/services/finance';
import { useToast } from '../../src/context/ToastContext';
import { Transaction } from '../../src/types';

export default function TransactionsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');

  const loadData = useCallback(async () => {
    try {
      setTransactions(await transactionService.getAll());
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await transactionService.delete(deleteTarget.id);
      showToast('Transacción eliminada', 'success');
      setDeleteTarget(null);
      loadData();
    } catch {
      showToast('No se pudo eliminar', 'error');
    } finally { setDeleteLoading(false); }
  };

  const filtered = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <View className="flex-1 bg-bone">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20394a" />}
      >
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 flex-row items-center">
            <ChevronLeft size={24} strokeWidth={2} color="#030706" />
            <Text className="text-noir text-lg font-semibold ml-1">Volver</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-3xl font-bold text-noir mb-1">Transacciones</Text>
        <Text className="text-concrete mb-6">Historial completo de movimientos</Text>

        {/* Summary */}
        <View className="flex-row mb-4">
          <View className="bg-denim rounded-2xl p-3 flex-1 mr-2">
            <Text className="text-concrete text-xs">Ingresos totales</Text>
            <Text className="text-green-400 text-lg font-bold mt-1">${incomeTotal.toLocaleString()}</Text>
          </View>
          <View className="bg-denim rounded-2xl p-3 flex-1 ml-2">
            <Text className="text-concrete text-xs">Gastos totales</Text>
            <Text className="text-bone text-lg font-bold mt-1">${expenseTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Filter */}
        <View className="flex-row bg-denim rounded-2xl p-1 mb-4">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'expense', label: 'Gastos' },
            { key: 'income', label: 'Ingresos' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key as typeof filter)}
              className={`flex-1 py-2.5 rounded-xl items-center ${filter === f.key ? 'bg-steel' : ''}`}
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-semibold ${filter === f.key ? 'text-bone' : 'text-concrete'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction List */}
        {filtered.length > 0 ? (
          filtered.map((tx) => (
            <View key={tx.id} className="mb-3">
              <TransactionCard
                amount={tx.amount}
                type={tx.type}
                category={tx.category_name}
                walletName={tx.wallet_name}
                date={new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                description={tx.description}
                installments={tx.installments > 1 ? { current: tx.current_installment, total: tx.installments } : undefined}
              />
              <TouchableOpacity
                onPress={() => setDeleteTarget(tx)}
                className="bg-denim/80 self-end px-3 py-1.5 rounded-lg -mt-1 mr-3 flex-row items-center border border-steel/20"
                activeOpacity={0.7}
              >
                <Trash2 size={11} strokeWidth={2} color="#e74c3c" />
                <Text className="text-concrete text-xs ml-1">Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View className="items-center justify-center py-16">
            <Filter size={36} strokeWidth={1.5} color="#c9ccc3" />
            <Text className="text-concrete text-lg mt-3">Sin transacciones</Text>
            <Text className="text-concrete text-sm mt-1">
              {filter !== 'all' ? 'No hay transacciones de este tipo' : 'Registra tu primer movimiento'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Delete Modal */}
      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View className="flex-1 bg-noir/60 justify-center items-center p-6">
          <View className="bg-bone rounded-2xl p-6 w-80 border border-concrete/20">
            <View className="w-14 h-14 bg-red-50 rounded-2xl items-center justify-center self-center mb-4">
              <Trash2 size={24} strokeWidth={2} color="#e74c3c" />
            </View>
            <Text className="text-xl font-bold text-noir mb-2 text-center">Eliminar Transacción</Text>
            <Text className="text-concrete text-center mb-1">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </Text>
            {deleteTarget && (
              <View className="bg-denim/30 rounded-xl p-3 my-3">
                <Text className="text-noir text-sm font-medium text-center">
                  {deleteTarget.type === 'income' ? '+' : '-'}${Number(deleteTarget.amount).toLocaleString('es-CO')}
                </Text>
                <Text className="text-concrete text-xs text-center mt-0.5">
                  {deleteTarget.category_name || 'Sin categoría'} · {deleteTarget.wallet_name}
                </Text>
              </View>
            )}
            <View className="flex-row mt-4">
              <View className="flex-1 mr-2">
                <PrimaryButton title="Cancelar" onPress={() => setDeleteTarget(null)} variant="secondary" />
              </View>
              <View className="flex-1 ml-2">
                <PrimaryButton title="Eliminar" onPress={handleDelete} loading={deleteLoading} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
