import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FormInput, PrimaryButton } from '../../src/components';
import { walletService, categoryService, transactionService } from '../../src/services/finance';
import { syncService } from '../../src/services/sync';
import { Wallet, Category } from '../../src/types';

export default function RegisterScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [walletsData, categoriesData] = await Promise.all([
        walletService.getAll(),
        categoryService.getAll(),
      ]);
      setWallets(walletsData);
      setCategories(categoriesData);
      if (!selectedWallet && walletsData.length > 0) setSelectedWallet(walletsData[0]);
      if (!selectedCategory && categoriesData.length > 0) setSelectedCategory(categoriesData[0]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Refresh data when tab is focused
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => { checkNetwork(); }, []);

  const checkNetwork = async () => {
    const online = await syncService.isOnline();
    setIsOnline(online);
  };

  const handleSave = async () => {
    if (!amount || !selectedWallet) {
      Alert.alert('Error', 'Ingresa un monto y selecciona un medio de pago');
      return;
    }

    setLoading(true);
    try {
      const online = await syncService.isOnline();
      
      if (online) {
        // Online: send directly to API
        await transactionService.create({
          amount: parseFloat(amount),
          type: 'expense',
          description,
          wallet: selectedWallet.id,
          category: selectedCategory?.id,
          installments: selectedWallet.type === 'credit' ? 1 : 1,
        });
        
        Alert.alert('Éxito', 'Gasto registrado correctamente');
      } else {
        // Offline: queue for later sync
        await syncService.queueTransaction({
          amount: parseFloat(amount),
          type: 'expense',
          description,
          wallet: selectedWallet.id,
          category: selectedCategory?.id,
          installments: 1,
          is_synced: false,
        });
        
        Alert.alert(
          'Guardado Offline',
          'Sin conexión. El gasto se sincronizará automáticamente cuando recuperes la conexión.'
        );
      }
      
      setAmount('');
      setDescription('');
    } catch (error: any) {
      const msg = error.response?.data?.amount || 'Error al registrar el gasto';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-bone p-6">
      {/* Offline indicator */}
      {!isOnline && (
        <View className="bg-steel/20 rounded-xl p-3 mb-4">
          <Text className="text-steel text-center font-medium">
            📡 Modo offline - Se sincronizará al recuperar conexión
          </Text>
        </View>
      )}

      <View className="mb-8">
        <Text className="text-3xl font-bold text-noir">
          Registrar Gasto
        </Text>
        <Text className="text-concrete mt-2">
          Rápido y sin fricción
        </Text>
      </View>

      <FormInput
        label="Monto"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <FormInput
        label="Descripción"
        placeholder="¿En qué gastaste?"
        value={description}
        onChangeText={setDescription}
      />

      {/* Wallet Selector */}
      <View className="mb-4">
        <Text className="text-noir font-medium mb-2 text-base">Medio de Pago</Text>
        <TouchableOpacity
          className="bg-bone/50 border border-concrete rounded-xl px-4 py-3"
          onPress={() => setShowWalletModal(true)}
        >
          <Text className={selectedWallet ? 'text-noir' : 'text-concrete'}>
            {selectedWallet ? selectedWallet.name : 'Seleccionar medio de pago'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Selector */}
      <View className="mb-4">
        <Text className="text-noir font-medium mb-2 text-base">Categoría</Text>
        <TouchableOpacity
          className="bg-bone/50 border border-concrete rounded-xl px-4 py-3"
          onPress={() => setShowCategoryModal(true)}
        >
          <Text className={selectedCategory ? 'text-noir' : 'text-concrete'}>
            {selectedCategory ? selectedCategory.name : 'Seleccionar categoría'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-6">
        <PrimaryButton
          title={isOnline ? 'Guardar Gasto' : 'Guardar Offline'}
          onPress={handleSave}
          loading={loading}
        />
      </View>

      {/* Wallet Modal */}
      <Modal visible={showWalletModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6 max-h-96">
            <Text className="text-xl font-bold text-noir mb-4">Seleccionar Medio de Pago</Text>
            <ScrollView>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  className="py-4 border-b border-concrete/30"
                  onPress={() => { setSelectedWallet(w); setShowWalletModal(false); }}
                >
                  <Text className="text-noir text-lg">{w.name}</Text>
                  <Text className="text-concrete text-sm">
                    {w.type === 'credit' ? `Crédito - Disp: $${w.available_credit}` : `Saldo: $${w.balance}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="mt-4 py-4 bg-steel rounded-xl items-center"
              onPress={() => setShowWalletModal(false)}
            >
              <Text className="text-bone font-semibold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6 max-h-96">
            <Text className="text-xl font-bold text-noir mb-4">Seleccionar Categoría</Text>
            <ScrollView>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  className="py-4 border-b border-concrete/30 flex-row items-center"
                  onPress={() => { setSelectedCategory(c); setShowCategoryModal(false); }}
                >
                  <View className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: c.color_hex }} />
                  <Text className="text-noir text-lg">{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="mt-4 py-4 bg-steel rounded-xl items-center"
              onPress={() => setShowCategoryModal(false)}
            >
              <Text className="text-bone font-semibold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
