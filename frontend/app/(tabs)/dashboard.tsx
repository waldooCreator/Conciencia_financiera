import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Target, Trash2, TrendingUp, TrendingDown, CreditCard, Wallet as WalletIcon, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { TransactionCard, PrimaryButton } from '../../src/components';
import BarChart from '../../src/components/BarChart';
import { transactionService, walletService, goalService } from '../../src/services/finance';
import { useToast } from '../../src/context/ToastContext';
import { TransactionSummary, Transaction, Wallet, SavingsGoal, MonthComparison } from '../../src/types';

const screenWidth = Dimensions.get('window').width;

// Chart colors using the app palette
const CHART_COLORS = ['#6196aa', '#20394a', '#030706', '#c9ccc3', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

export default function DashboardScreen() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [comparison, setComparison] = useState<MonthComparison | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, txData, walletData, goalData, compRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getAll(),
        walletService.getAll(),
        goalService.getAll(),
        transactionService.getComparison(),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txData);
      setWallets(walletData);
      setGoals(goalData);
      setComparison(compRes.data);
    } catch (error) { console.error(error); }
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

  // Computed data
  const totalDebt = wallets.filter(w => w.type === 'credit').reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalBalance = wallets.filter(w => w.type !== 'credit').reduce((s, w) => s + parseFloat(w.balance), 0);

  // Category spending data for pie chart
  const categoryData = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const name = tx.category_name || 'Sin categoría';
        const val = parseFloat(tx.amount) || 0;
        if (val > 0) {
          expensesByCategory[name] = (expensesByCategory[name] || 0) + val;
        }
      });

    const total = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);

    return Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name: name.length > 12 ? name.slice(0, 12) + '…' : name,
        amount: value,
        color: CHART_COLORS[i % CHART_COLORS.length],
        legendFontColor: '#030706',
        legendFontSize: 12,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      }));
  }, [transactions]);

  // Wallet usage data
  const walletUsage = useMemo(() => {
    const usageByWallet: Record<string, { amount: number; type: string }> = {};
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        if (!usageByWallet[tx.wallet_name]) {
          const w = wallets.find(wl => wl.id === tx.wallet);
          usageByWallet[tx.wallet_name] = {
            amount: 0,
            type: w?.type || 'cash',
          };
        }
        usageByWallet[tx.wallet_name].amount += parseFloat(tx.amount);
      });

    return Object.entries(usageByWallet)
      .sort((a, b) => b[1].amount - a[1].amount);
  }, [transactions, wallets]);

  const mostUsedWallet = walletUsage.length > 0 ? walletUsage[0] : null;
  const totalExpenses = summary?.total_expenses || 0;

  return (
    <View className="flex-1 bg-bone">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20394a" />}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-noir">Dashboard</Text>
          <Text className="text-concrete mt-2">Resumen de tus finanzas</Text>
        </View>

        {/* Balance Card */}
        <View className="bg-denim rounded-2xl p-5 mb-4">
          <Text className="text-concrete text-sm mb-1">Balance Disponible</Text>
          <Text className="text-bone text-3xl font-bold">${totalBalance.toLocaleString()}</Text>
        </View>

        {/* Income vs Expenses */}
        {summary && (
          <View className="flex-row justify-between mb-4">
            <View className="bg-denim rounded-2xl p-4 flex-1 mr-2">
              <View className="flex-row items-center mb-1">
                <TrendingUp size={14} strokeWidth={2} color="#2ecc71" />
                <Text className="text-concrete text-sm ml-1">Ingresos</Text>
              </View>
              <Text className="text-green-400 text-xl font-bold mt-1">
                ${summary.total_income.toLocaleString()}
              </Text>
            </View>
            <View className="bg-denim rounded-2xl p-4 flex-1 ml-2">
              <View className="flex-row items-center mb-1">
                <AlertTriangle size={14} strokeWidth={2} color="#e74c3c" />
                <Text className="text-concrete text-sm ml-1">Gastos</Text>
              </View>
              <Text className="text-bone text-xl font-bold mt-1">
                ${summary.total_expenses.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Debt Projection */}
        {totalDebt > 0 && (
          <View className="bg-denim rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <CreditCard size={16} strokeWidth={2} color="#6196aa" />
              <Text className="text-bone font-semibold ml-2">Proyección de Deuda</Text>
            </View>
            <Text className="text-3xl font-bold text-bone">${totalDebt.toLocaleString()}</Text>
            <Text className="text-concrete text-sm mt-1">Deuda total en tarjetas de crédito</Text>
          </View>
        )}

        {/* ───── CHARTS SECTION ───── */}
        {categoryData.length > 0 && (
          <View className="mb-4">
            <Text className="text-xl font-bold text-noir mb-3">Gastos por Categoría</Text>
            <View className="bg-bone rounded-2xl border border-concrete/30 p-4">
              <BarChart data={categoryData} />
            </View>
          </View>
        )}

        {/* ───── COMPARISON: Current vs Previous Month ───── */}
        {comparison && comparison.categories.length > 0 && (
          <View className="mb-4">
            <Text className="text-xl font-bold text-noir mb-3">Comparativo vs Mes Anterior</Text>
            <View className="bg-denim rounded-2xl p-4">
              {/* Summary header */}
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-steel/20">
                <View>
                  <Text className="text-concrete text-xs mb-0.5">Este mes</Text>
                  <Text className="text-bone text-xl font-bold">
                    ${comparison.total_current.toLocaleString()}
                  </Text>
                </View>
                <View className="items-center">
                  {comparison.total_delta !== 0 && comparison.total_previous > 0 && (
                    <View className={`flex-row items-center px-2.5 py-1 rounded-full ${
                      comparison.total_delta > 0 ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      {comparison.total_delta > 0
                        ? <TrendingUp size={12} color="#e74c3c" />
                        : <TrendingDown size={12} color="#2ecc71" />
                      }
                      <Text className={`text-xs font-semibold ml-1 ${
                        comparison.total_delta > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {comparison.total_delta > 0 ? '+' : ''}
                        {((comparison.total_delta / comparison.total_previous) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>
                <View className="items-end">
                  <Text className="text-concrete text-xs mb-0.5">Mes anterior</Text>
                  <Text className="text-concrete text-lg">
                    ${comparison.total_previous.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Per-category comparison bars */}
              {comparison.categories.slice(0, 6).map((cat) => {
                const maxAmount = Math.max(
                  ...comparison.categories.map(c => Math.max(c.current_amount, c.previous_amount))
                );
                const currentWidth = maxAmount > 0 ? (cat.current_amount / maxAmount) * 100 : 0;
                const previousWidth = maxAmount > 0 ? (cat.previous_amount / maxAmount) * 100 : 0;

                return (
                  <View key={cat.category_name} className="mb-3">
                    <View className="flex-row justify-between items-center mb-1.5">
                      <View className="flex-row items-center">
                        <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: cat.category_color }} />
                        <Text className="text-bone text-sm font-medium">{cat.category_name}</Text>
                      </View>
                      <View className="flex-row items-center">
                        {cat.trend !== 'stable' && (
                          <Text className={`text-xs font-semibold mr-2 ${
                            cat.trend === 'up' ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {cat.trend === 'up' ? '↑' : '↓'} {Math.abs(cat.pct_change)}%
                          </Text>
                        )}
                        <Text className="text-bone text-sm font-semibold">
                          ${cat.current_amount.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View>
                      <View className="flex-row items-center mb-0.5">
                        <Text className="text-concrete text-[10px] w-10">Ahora</Text>
                        <View className="flex-1 bg-steel/10 rounded-full h-3">
                          <View className="rounded-full h-3" style={{ width: `${currentWidth}%`, backgroundColor: cat.category_color }} />
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-concrete text-[10px] w-10">Antes</Text>
                        <View className="flex-1 bg-steel/10 rounded-full h-3">
                          <View className="rounded-full h-3" style={{ width: `${previousWidth}%`, backgroundColor: cat.category_color, opacity: 0.4 }} />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Wallet Usage */}
        {walletUsage.length > 0 && (
          <View className="mb-4">
            <Text className="text-xl font-bold text-noir mb-3">Uso por Medio de Pago</Text>
            <View className="bg-denim rounded-2xl p-4">
              {walletUsage.map(([name, data], i) => {
                const pct = totalExpenses > 0 ? ((data.amount / totalExpenses) * 100).toFixed(1) : '0';
                return (
                  <View key={i} className={i > 0 ? 'mt-3 pt-3 border-t border-steel/20' : ''}>
                    <View className="flex-row justify-between items-center mb-1.5">
                      <View className="flex-row items-center">
                        <WalletIcon size={14} strokeWidth={2} color="#6196aa" />
                        <Text className="text-bone font-medium ml-2">{name}</Text>
                      </View>
                      <Text className="text-bone font-bold">${data.amount.toLocaleString()}</Text>
                    </View>
                    <View className="bg-steel/20 rounded-full h-2">
                      <View
                        className="bg-steel rounded-full h-2"
                        style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                      />
                    </View>
                    <Text className="text-concrete text-xs mt-1">{pct}% del total</Text>
                  </View>
                );
              })}
              {mostUsedWallet && (
                <View className="mt-4 pt-3 border-t border-steel/20">
                  <Text className="text-steel text-sm">
                    <Text className="font-semibold">Más usado: </Text>
                    {mostUsedWallet[0]} (${mostUsedWallet[1].amount.toLocaleString()})
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Savings Goals */}
        {goals.length > 0 && (
          <View className="mb-4">
            <Text className="text-xl font-bold text-noir mb-3">Metas de Ahorro</Text>
            {goals.map((g) => (
              <View key={g.id} className="bg-denim rounded-2xl p-4 mb-2">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-bone font-semibold">{g.name}</Text>
                  <Text className="text-steel font-bold">{g.progress_percentage.toFixed(0)}%</Text>
                </View>
                <View className="bg-steel/20 rounded-full h-2 mb-1">
                  <View
                    className="bg-steel rounded-full h-2"
                    style={{ width: `${Math.min(100, g.progress_percentage)}%` as any }}
                  />
                </View>
                <Text className="text-concrete text-xs">
                  ${parseFloat(g.current_amount).toLocaleString()} / ${parseFloat(g.target_amount).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-bold text-noir">Recientes</Text>
          {transactions.length > 5 && (
            <Text className="text-steel text-sm">Últimas {Math.min(5, transactions.length)}</Text>
          )}
        </View>

        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((tx) => {
            const srcWallet = wallets.find(w => w.id === tx.wallet);
            const dstWallet = tx.destination_wallet ? wallets.find(w => w.id === tx.destination_wallet) : null;
            return (
            <View key={tx.id} className="mb-3">
              <TransactionCard
                amount={tx.amount}
                type={tx.type}
                category={tx.category_name}
                walletName={tx.wallet_name}
                walletType={srcWallet?.type}
                destinationWalletName={tx.destination_wallet_name}
                destinationWalletType={dstWallet?.type}
                date={new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                description={tx.description}
                installments={tx.installments > 1 ? { current: tx.current_installment, total: tx.installments } : undefined}
              />
              {/* Delete button - integrated DENIM style */}
              <TouchableOpacity
                onPress={() => setDeleteTarget(tx)}
                className="bg-denim/80 self-end px-3 py-1.5 rounded-lg -mt-1 mr-3 flex-row items-center border border-steel/20"
                activeOpacity={0.7}
              >
                <Trash2 size={11} strokeWidth={2} color="#e74c3c" />
                <Text className="text-concrete text-xs ml-1">Eliminar</Text>
              </TouchableOpacity>
            </View>
          )})
        ) : (
          <View className="items-center justify-center py-12">
            <Target size={40} strokeWidth={2} color="#c9ccc3" />
            <Text className="text-concrete text-lg mt-3">No hay transacciones aún</Text>
            <Text className="text-concrete text-sm mt-1">Registra tu primer gasto para comenzar</Text>
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View className="flex-1 bg-noir/60 justify-center items-center p-6">
          <View className="bg-bone rounded-2xl p-6 w-80 border border-concrete/20">
            {/* Icon */}
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
                <PrimaryButton
                  title="Cancelar"
                  onPress={() => setDeleteTarget(null)}
                  variant="secondary"
                />
              </View>
              <View className="flex-1 ml-2">
                <PrimaryButton
                  title="Eliminar"
                  onPress={handleDelete}
                  loading={deleteLoading}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
