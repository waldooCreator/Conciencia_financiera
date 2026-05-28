import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Banknote, CreditCard, Landmark, X, ArrowLeftRight, Calendar, AlertCircle } from 'lucide-react-native';
import { FormInput, PrimaryButton } from '../../src/components';
import { walletService, transactionService } from '../../src/services/finance';
import { Wallet, Transaction } from '../../src/types';
import { useRouter } from 'expo-router';

const walletIcons = (type: string) => {
  const props = { size: 22, strokeWidth: 2, color: '#6196aa' };
  if (type === 'cash') return <Banknote {...props} />;
  if (type === 'credit') return <CreditCard {...props} />;
  return <Landmark {...props} />;
};
const walletTypeLabels: Record<string, string> = { cash: 'Efectivo', debit: 'Cuenta Débito', credit: 'Tarjeta de Crédito' };

export default function AccountsScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit' | 'cash'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'debit' | 'credit'>('debit');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [wd, td] = await Promise.all([
        walletService.getAll(),
        transactionService.getAll(),
      ]);
      setWallets(wd);
      setTransactions(td);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const openCreate = () => { setModalMode('create'); setName(''); setBalance(''); setCreditLimit(''); setBillingDay(''); setType('debit'); setErrorMsg(''); };
  const openEdit = (w: Wallet) => { setModalMode('edit'); setEditingWallet(w); setName(w.name); setType(w.type as any); setBalance(w.balance); setCreditLimit(w.credit_limit || ''); setBillingDay(w.billing_cycle_date ? String(w.billing_cycle_date) : ''); setErrorMsg(''); };
  const openDelete = (w: Wallet) => { setModalMode('delete'); setEditingWallet(w); setErrorMsg(''); };

  const handleSave = async () => {
    if (!name.trim()) { setErrorMsg('Ingresa un nombre'); return; }
    setLoading(true); setErrorMsg('');
    try {
      const data: any = { name: name.trim(), type, balance: parseFloat(balance) || 0 };
      if (type === 'credit') {
        data.credit_limit = parseFloat(creditLimit) || null;
        data.billing_cycle_date = billingDay ? parseInt(billingDay) : null;
      }
      if (modalMode === 'create') await walletService.create(data);
      else if (editingWallet) await walletService.update(editingWallet.id, data);
      setModalMode(null); loadData();
    } catch { setErrorMsg('Error al guardar'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingWallet) return;
    setLoading(true);
    try { await walletService.delete(editingWallet.id); setModalMode(null); loadData(); }
    catch { setErrorMsg('No se pudo eliminar'); }
    finally { setLoading(false); }
  };

  // ───── Computed values ─────
  const filteredWallets = filter === 'all' ? wallets : wallets.filter(w => w.type === filter);
  const displayWallets = filter === 'all' ? wallets : filteredWallets;
  const allNonCredit = wallets.filter(w => w.type !== 'credit');
  const allCredit = wallets.filter(w => w.type === 'credit');

  const totalBalance = allNonCredit.reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalDebt = allCredit.reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalCreditLimit = allCredit.filter(w => w.credit_limit).reduce((s, w) => s + parseFloat(w.credit_limit || '0'), 0);
  const totalAvailable = totalCreditLimit - totalDebt;

  // Estimated monthly payment: sum of installment_amount for active credit card expenses
  const estimatedMonthlyPayment = transactions
    .filter(tx => tx.type === 'expense' && tx.installments > 1 && tx.remaining_installments > 0)
    .reduce((s, tx) => s + parseFloat(tx.installment_amount), 0);

  const filterOptions: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'credit', label: 'Crédito' },
    { key: 'debit', label: 'Débito' },
    { key: 'cash', label: 'Efectivo' },
  ];

  // Billing cycle helper
  const getBillingInfo = (wallet: Wallet) => {
    if (wallet.type !== 'credit' || !wallet.billing_cycle_date) return null;
    const today = new Date();
    const currentDay = today.getDate();
    const billingDay = wallet.billing_cycle_date;
    const daysUntil = billingDay >= currentDay
      ? billingDay - currentDay
      : (30 - currentDay) + billingDay;
    // Calculate next billing date
    const nextBilling = new Date(today);
    nextBilling.setDate(billingDay);
    if (billingDay < currentDay) nextBilling.setMonth(nextBilling.getMonth() + 1);
    return {
      billingDay,
      daysUntil,
      nextBillingDate: nextBilling.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
      isClose: daysUntil <= 7,
    };
  };

  return (
    <View className="flex-1 bg-bone">
      <ScrollView className="flex-1 p-6" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20394a" />}>
        <Text className="text-3xl font-bold text-noir mb-1">Cuentas</Text>
        <Text className="text-concrete mb-6">Tus medios de pago</Text>

        {/* ── Summary Card (changes based on filter) ── */}
        {filter === 'credit' ? (
          /* Credit Card Summary */
          <View className="bg-denim rounded-2xl p-5 mb-4">
            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text className="text-concrete text-xs mb-0.5">Deuda Total</Text>
                <Text className="text-bone text-2xl font-bold">${totalDebt.toLocaleString()}</Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-concrete text-xs mb-0.5">Cupo Total</Text>
                <Text className="text-steel text-xl font-bold">${totalCreditLimit.toLocaleString()}</Text>
              </View>
            </View>
            <View className="flex-row justify-between pt-3 border-t border-steel/20">
              <View>
                <Text className="text-concrete text-xs mb-0.5">Cupo Disponible</Text>
                <Text className={`text-lg font-bold ${totalAvailable < totalCreditLimit * 0.2 ? 'text-red-400' : 'text-green-400'}`}>
                  ${totalAvailable.toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-concrete text-xs mb-0.5">Pago Mensual Est.</Text>
                <Text className="text-steel text-lg font-bold">${estimatedMonthlyPayment.toLocaleString()}</Text>
              </View>
            </View>
            {/* Available credit bar */}
            {totalCreditLimit > 0 && (
              <View className="mt-3">
                <View className="bg-steel/20 rounded-full h-2 mb-1">
                  <View
                    className={`rounded-full h-2 ${totalAvailable / totalCreditLimit < 0.2 ? 'bg-red-400' : totalAvailable / totalCreditLimit < 0.5 ? 'bg-amber-400' : 'bg-steel'}`}
                    style={{ width: `${Math.min(100, (totalDebt / totalCreditLimit) * 100)}%` }}
                  />
                </View>
                <Text className="text-concrete text-[10px]">
                  {((totalDebt / totalCreditLimit) * 100).toFixed(0)}% utilizado · {(totalAvailable).toLocaleString()} disponible
                </Text>
              </View>
            )}
          </View>
        ) : filter === 'debit' || filter === 'cash' ? (
          /* Debit/Cash Summary */
          <View className="bg-denim rounded-2xl p-5 mb-4">
            <Text className="text-concrete text-xs mb-1">
              {filter === 'debit' ? 'Saldo en Cuentas de Débito' : 'Efectivo Disponible'}
            </Text>
            <Text className="text-bone text-3xl font-bold">
              ${displayWallets.reduce((s, w) => s + parseFloat(w.balance), 0).toLocaleString()}
            </Text>
          </View>
        ) : (
          /* All Summary */
          <View className="bg-denim rounded-2xl p-5 mb-4">
            <Text className="text-concrete text-sm mb-1">Balance Total</Text>
            <Text className="text-bone text-3xl font-bold">${totalBalance.toLocaleString()}</Text>
            {totalDebt > 0 && (
              <View className="mt-3 pt-3 border-t border-steel/20">
                <Text className="text-concrete text-sm">Deuda TC: ${totalDebt.toLocaleString()} / Cupo: ${totalCreditLimit.toLocaleString()}</Text>
              </View>
            )}
          </View>
        )}

        {/* Filter Pills */}
        <View className="flex-row mb-4" style={{ gap: 6 }}>
          {filterOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setFilter(opt.key)}
              className={`px-4 py-2 rounded-xl border ${
                filter === opt.key ? 'bg-steel border-steel' : 'bg-bone/50 border-concrete'
              }`}
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-semibold ${filter === opt.key ? 'text-bone' : 'text-concrete'}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallet List Header */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-bold text-noir">
            {filter === 'credit' ? 'Tarjetas de Crédito' : filter === 'debit' ? 'Cuentas de Débito' : filter === 'cash' ? 'Efectivo' : 'Medios de Pago'}
          </Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/transfer')}
              className="bg-denim border border-steel/30 px-4 py-2 rounded-xl flex-row items-center"
            >
              <ArrowLeftRight size={14} color="#6196aa" />
              <Text className="text-steel font-semibold text-sm ml-1.5">Transferir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openCreate} className="bg-steel px-4 py-2 rounded-xl">
              <Text className="text-bone font-semibold text-sm">+ Nueva</Text>
            </TouchableOpacity>
          </View>
        </View>

        {errorMsg ? (
          <View className="bg-red-50 border border-red-400 rounded-xl p-3 mb-3">
            <Text className="text-red-600 text-center">{errorMsg}</Text>
          </View>
        ) : null}

        {/* Wallet Cards */}
        {displayWallets.map((w) => {
          const billing = getBillingInfo(w);
          const available = w.type === 'credit' && w.credit_limit
            ? parseFloat(w.credit_limit) - parseFloat(w.balance)
            : null;
          const cardTransactions = transactions.filter(tx => tx.wallet === w.id && tx.type === 'expense');
          const cardMonthlyPayment = cardTransactions
            .filter(tx => tx.installments > 1 && tx.remaining_installments > 0)
            .reduce((s, tx) => s + parseFloat(tx.installment_amount), 0);

          return (
            <View key={w.id} className="bg-denim rounded-2xl p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center flex-1">
                  <View className="mr-3">{walletIcons(w.type)}</View>
                  <View>
                    <Text className="text-bone font-semibold text-lg">{w.name}</Text>
                    <Text className="text-steel text-sm">{walletTypeLabels[w.type]}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-bone text-xl font-bold">
                    ${parseFloat(w.balance).toLocaleString()}
                  </Text>
                  {w.type === 'credit' && w.credit_limit && (
                    <Text className="text-concrete text-xs mt-1">
                      Límite: ${parseFloat(w.credit_limit).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>

              {/* Enhanced Credit Card Info */}
              {w.type === 'credit' && (
                <View className="mt-3 pt-3 border-t border-steel/20">
                  <View className="flex-row justify-between mb-2">
                    {available !== null && (
                      <View className="flex-1">
                        <Text className="text-concrete text-[10px] mb-0.5">Cupo Disponible</Text>
                        <Text className={`text-sm font-semibold ${available < parseFloat(w.credit_limit || '0') * 0.2 ? 'text-red-400' : 'text-green-400'}`}>
                          ${available.toLocaleString()}
                        </Text>
                      </View>
                    )}
                    {cardMonthlyPayment > 0 && (
                      <View className="flex-1 items-end">
                        <Text className="text-concrete text-[10px] mb-0.5">Cuota Mensual</Text>
                        <Text className="text-steel text-sm font-semibold">
                          ${cardMonthlyPayment.toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Available credit progress bar */}
                  {w.credit_limit && (
                    <View className="mb-2">
                      <View className="bg-steel/20 rounded-full h-1.5">
                        <View
                          className={`rounded-full h-1.5 ${available && available / parseFloat(w.credit_limit) < 0.2 ? 'bg-red-400' : 'bg-steel'}`}
                          style={{ width: `${Math.min(100, (parseFloat(w.balance) / parseFloat(w.credit_limit)) * 100)}%` }}
                        />
                      </View>
                    </View>
                  )}

                  {/* Billing Cycle */}
                  {billing && (
                    <View className={`flex-row items-center rounded-lg px-3 py-2 ${billing.isClose ? 'bg-red-500/10 border border-red-500/20' : 'bg-steel/10'}`}>
                      <Calendar size={14} color={billing.isClose ? '#e74c3c' : '#6196aa'} />
                      <Text className={`text-xs ml-2 flex-1 ${billing.isClose ? 'text-red-400' : 'text-steel'}`}>
                        {billing.isClose
                          ? `⚠️ Corte en ${billing.daysUntil} días (${billing.nextBillingDate})`
                          : `Próximo corte: ${billing.nextBillingDate} (${billing.daysUntil} días)`
                        }
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row mt-3 pt-3 border-t border-steel/20" style={{ gap: 6 }}>
                {w.type === 'credit' && (
                  <TouchableOpacity
                    onPress={() => router.push('/transfer')}
                    className="bg-steel/30 px-3 py-1.5 rounded-lg flex-row items-center"
                  >
                    <CreditCard size={11} color="#6196aa" />
                    <Text className="text-steel text-xs ml-1">Pagar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => openEdit(w)} className="bg-steel/30 px-3 py-1.5 rounded-lg">
                  <Text className="text-steel text-xs">Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openDelete(w)} className="bg-red-500/20 px-3 py-1.5 rounded-lg">
                  <Text className="text-red-400 text-xs">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {displayWallets.length === 0 && wallets.length > 0 && (
          <View className="items-center py-10">
            <Text className="text-concrete text-base">No hay cuentas de este tipo</Text>
            <Text className="text-concrete text-sm mt-1">Cambia el filtro o crea una nueva</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals (unchanged) */}
      <Modal visible={modalMode === 'create' || modalMode === 'edit'} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-noir mb-4">{modalMode === 'create' ? 'Nueva' : 'Editar'} Cuenta</Text>
            <FormInput label="Nombre" placeholder="Ej: RappiCard" value={name} onChangeText={setName} />
            <Text className="text-noir font-medium mb-2 text-base">Tipo</Text>
            <TouchableOpacity className="bg-bone/50 border border-concrete rounded-xl px-4 py-3 mb-4" onPress={() => setShowTypePicker(true)}>
              <Text className="text-noir">{walletTypeLabels[type]}</Text>
            </TouchableOpacity>
            <FormInput label="Saldo / Deuda" placeholder="0.00" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
            {type === 'credit' && (
              <>
                <FormInput label="Límite de crédito" placeholder="0.00" value={creditLimit} onChangeText={setCreditLimit} keyboardType="decimal-pad" />
                <FormInput label="Día de corte (1-31)" placeholder="Ej: 15" value={billingDay} onChangeText={setBillingDay} keyboardType="number-pad" />
              </>
            )}
            <View className="flex-row mt-4">
              <View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setModalMode(null)} variant="secondary" /></View>
              <View className="flex-1 ml-2"><PrimaryButton title="Guardar" onPress={handleSave} loading={loading} /></View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalMode === 'delete'} transparent animationType="fade">
        <View className="flex-1 bg-noir/50 justify-center items-center p-6">
          <View className="bg-bone rounded-2xl p-6 w-80">
            <Text className="text-xl font-bold text-noir mb-2">Eliminar</Text>
            <Text className="text-concrete mb-6">¿Eliminar "{editingWallet?.name}"?</Text>
            <View className="flex-row"><View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setModalMode(null)} variant="secondary" /></View><View className="flex-1 ml-2"><PrimaryButton title="Eliminar" onPress={handleDelete} loading={loading} /></View></View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTypePicker} transparent animationType="fade">
        <View className="flex-1 bg-noir/50 justify-center items-center">
          <View className="bg-bone rounded-2xl p-6 w-72">
            <Text className="text-xl font-bold text-noir mb-4">Tipo de Cuenta</Text>
            {Object.entries(walletTypeLabels).map(([k, l]) => (
              <TouchableOpacity key={k} className="py-3 border-b border-concrete/20 flex-row items-center" onPress={() => { setType(k as any); setShowTypePicker(false); }}>
                <View className="mr-3">{walletIcons(k)}</View>
                <Text className={`text-lg ${type === k ? 'text-steel font-semibold' : 'text-noir'}`}>{l}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="mt-4 py-3 bg-steel rounded-xl items-center" onPress={() => setShowTypePicker(false)}>
              <Text className="text-bone font-semibold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}