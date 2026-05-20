import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, Alert } from 'react-native';
import { FormInput, PrimaryButton } from '../../src/components';
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
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'debit' | 'credit'>('debit');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const loadData = async () => {
    try {
      const data = await walletService.getAll();
      setWallets(data);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa un nombre');
      return;
    }
    setLoading(true);
    try {
      await walletService.create({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        credit_limit: type === 'credit' ? (parseFloat(creditLimit) || 0) : undefined,
      });
      setName('');
      setBalance('');
      setCreditLimit('');
      setType('debit');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = wallets.filter(w => w.type !== 'credit').reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalDebt = wallets.filter(w => w.type === 'credit').reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalCredit = wallets.filter(w => w.type === 'credit' && w.credit_limit).reduce((s, w) => s + parseFloat(w.credit_limit || '0'), 0);

  return (
    <View className="flex-1 bg-bone">
      <ScrollView
        className="flex-1 p-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#20394a" />}
      >
        <View className="mb-6">
          <Text className="text-3xl font-bold text-noir">Cuentas</Text>
          <Text className="text-concrete mt-2">Tus medios de pago</Text>
        </View>

        <View className="bg-denim rounded-2xl p-4 mb-6">
          <Text className="text-concrete text-sm mb-1">Balance Total</Text>
          <Text className="text-bone text-3xl font-bold">${totalBalance.toLocaleString()}</Text>
          {totalDebt > 0 && (
            <View className="mt-3 pt-3 border-t border-steel/20">
              <Text className="text-concrete text-sm">Deuda tarjetas: ${totalDebt.toLocaleString()} / ${totalCredit.toLocaleString()}</Text>
            </View>
          )}
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-bold text-noir">Medios de Pago</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} className="bg-steel px-4 py-2 rounded-xl">
            <Text className="text-bone font-semibold text-sm">+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {wallets.length > 0 ? wallets.map((wallet) => (
          <View key={wallet.id} className="bg-denim rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{walletIcons[wallet.type] || '💰'}</Text>
                <View>
                  <Text className="text-bone font-semibold text-lg">{wallet.name}</Text>
                  <Text className="text-steel text-sm">{walletTypeLabels[wallet.type]}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-bone text-xl font-bold">${parseFloat(wallet.balance).toLocaleString()}</Text>
                {wallet.type === 'credit' && wallet.credit_limit && (
                  <Text className="text-concrete text-xs mt-1">Límite: ${parseFloat(wallet.credit_limit).toLocaleString()}</Text>
                )}
              </View>
            </View>
          </View>
        )) : (
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">💳</Text>
            <Text className="text-concrete text-lg">No hay medios de pago</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Wallet Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-noir mb-4">Nueva Cuenta</Text>
            
            <FormInput label="Nombre" placeholder="Ej: RappiCard" value={name} onChangeText={setName} />
            
            <View className="mb-4">
              <Text className="text-noir font-medium mb-2 text-base">Tipo</Text>
              <TouchableOpacity className="bg-bone/50 border border-concrete rounded-xl px-4 py-3" onPress={() => setShowTypePicker(true)}>
                <Text className="text-noir">{walletTypeLabels[type]}</Text>
              </TouchableOpacity>
            </View>

            <FormInput label="Saldo inicial" placeholder="0.00" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />

            {type === 'credit' && (
              <FormInput label="Límite de crédito" placeholder="0.00" value={creditLimit} onChangeText={setCreditLimit} keyboardType="decimal-pad" />
            )}

            <View className="flex-row mt-4">
              <View className="flex-1 mr-2">
                <PrimaryButton title="Cancelar" onPress={() => setShowModal(false)} variant="secondary" />
              </View>
              <View className="flex-1 ml-2">
                <PrimaryButton title="Crear" onPress={handleCreate} loading={loading} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Type Picker Modal */}
      <Modal visible={showTypePicker} transparent animationType="fade">
        <View className="flex-1 bg-noir/50 justify-center items-center">
          <View className="bg-bone rounded-2xl p-6 w-72">
            <Text className="text-xl font-bold text-noir mb-4">Tipo de Cuenta</Text>
            {Object.entries(walletTypeLabels).map(([key, label]) => (
              <TouchableOpacity key={key} className="py-3 border-b border-concrete/20" onPress={() => { setType(key as any); setShowTypePicker(false); }}>
                <Text className={`text-lg ${type === key ? 'text-steel font-semibold' : 'text-noir'}`}>{walletIcons[key]} {label}</Text>
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
