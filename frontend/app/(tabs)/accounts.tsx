import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FormInput, PrimaryButton } from '../../src/components';
import { walletService } from '../../src/services/finance';
import { Wallet } from '../../src/types';

const walletIcons: Record<string, string> = { cash: '💵', debit: '🏦', credit: '💳' };
const walletTypeLabels: Record<string, string> = { cash: 'Efectivo', debit: 'Cuenta Débito', credit: 'Tarjeta de Crédito' };

export default function AccountsScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'debit' | 'credit'>('debit');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const loadData = useCallback(async () => { try { setWallets(await walletService.getAll()); } catch {} }, []);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const openCreate = () => { setModalMode('create'); setName(''); setBalance(''); setCreditLimit(''); setType('debit'); setErrorMsg(''); };
  const openEdit = (w: Wallet) => { setModalMode('edit'); setEditingWallet(w); setName(w.name); setType(w.type as any); setBalance(w.balance); setCreditLimit(w.credit_limit || ''); setErrorMsg(''); };
  const openDelete = (w: Wallet) => { setModalMode('delete'); setEditingWallet(w); setErrorMsg(''); };

  const handleSave = async () => {
    if (!name.trim()) { setErrorMsg('Ingresa un nombre'); return; }
    setLoading(true); setErrorMsg('');
    try {
      const data = { name: name.trim(), type, balance: parseFloat(balance) || 0, credit_limit: type === 'credit' ? (parseFloat(creditLimit) || null) : null };
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
    catch { setErrorMsg('No se pudo eliminar'); setLoading(false); }
  };

  const totalBalance = wallets.filter(w => w.type !== 'credit').reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalDebt = wallets.filter(w => w.type === 'credit').reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalCredit = wallets.filter(w => w.type === 'credit' && w.credit_limit).reduce((s, w) => s + parseFloat(w.credit_limit || '0'), 0);

  return (
    <View className="flex-1 bg-bone">
      <ScrollView className="flex-1 p-6" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20394a" />}>
        <Text className="text-3xl font-bold text-noir mb-1">Cuentas</Text>
        <Text className="text-concrete mb-6">Tus medios de pago</Text>
        <View className="bg-denim rounded-2xl p-4 mb-6">
          <Text className="text-concrete text-sm mb-1">Balance Total</Text>
          <Text className="text-bone text-3xl font-bold">${totalBalance.toLocaleString()}</Text>
          {totalDebt > 0 && <View className="mt-3 pt-3 border-t border-steel/20"><Text className="text-concrete text-sm">Deuda: ${totalDebt.toLocaleString()} / ${totalCredit.toLocaleString()}</Text></View>}
        </View>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-bold text-noir">Medios de Pago</Text>
          <TouchableOpacity onPress={openCreate} className="bg-steel px-4 py-2 rounded-xl"><Text className="text-bone font-semibold text-sm">+ Nueva</Text></TouchableOpacity>
        </View>
        {errorMsg ? <View className="bg-red-50 border border-red-400 rounded-xl p-3 mb-3"><Text className="text-red-600 text-center">{errorMsg}</Text></View> : null}
        {wallets.map((w) => (
          <View key={w.id} className="bg-denim rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center flex-1"><Text className="text-2xl mr-3">{walletIcons[w.type]}</Text><View><Text className="text-bone font-semibold text-lg">{w.name}</Text><Text className="text-steel text-sm">{walletTypeLabels[w.type]}</Text></View></View>
              <View className="items-end"><Text className="text-bone text-xl font-bold">${parseFloat(w.balance).toLocaleString()}</Text>{w.type === 'credit' && w.credit_limit && <Text className="text-concrete text-xs mt-1">Límite: ${parseFloat(w.credit_limit).toLocaleString()}</Text>}</View>
            </View>
            <View className="flex-row mt-3 pt-3 border-t border-steel/20" style={{gap: 6}}>
              <TouchableOpacity onPress={() => openEdit(w)} className="bg-steel/30 px-3 py-1 rounded-lg"><Text className="text-steel text-xs">Editar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => openDelete(w)} className="bg-red-500/20 px-3 py-1 rounded-lg"><Text className="text-red-400 text-xs">Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalMode === 'create' || modalMode === 'edit'} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-noir mb-4">{modalMode === 'create' ? 'Nueva' : 'Editar'} Cuenta</Text>
            <FormInput label="Nombre" placeholder="Ej: RappiCard" value={name} onChangeText={setName} />
            <Text className="text-noir font-medium mb-2 text-base">Tipo</Text>
            <TouchableOpacity className="bg-bone/50 border border-concrete rounded-xl px-4 py-3 mb-4" onPress={() => setShowTypePicker(true)}><Text className="text-noir">{walletTypeLabels[type]}</Text></TouchableOpacity>
            <FormInput label="Saldo" placeholder="0.00" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
            {type === 'credit' && <FormInput label="Límite de crédito" placeholder="0.00" value={creditLimit} onChangeText={setCreditLimit} keyboardType="decimal-pad" />}
            <View className="flex-row mt-4"><View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setModalMode(null)} variant="secondary" /></View><View className="flex-1 ml-2"><PrimaryButton title="Guardar" onPress={handleSave} loading={loading} /></View></View>
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
            {Object.entries(walletTypeLabels).map(([k, l]) => (<TouchableOpacity key={k} className="py-3 border-b border-concrete/20" onPress={() => { setType(k as any); setShowTypePicker(false); }}><Text className={`text-lg ${type === k ? 'text-steel font-semibold' : 'text-noir'}`}>{walletIcons[k]} {l}</Text></TouchableOpacity>))}
            <TouchableOpacity className="mt-4 py-3 bg-steel rounded-xl items-center" onPress={() => setShowTypePicker(false)}><Text className="text-bone font-semibold">Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
