import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { walletService, categoryService, transactionService } from '../../src/services/finance';
import { syncService } from '../../src/services/sync';
import { Wallet, Category } from '../../src/types';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const amountRef = useRef<TextInput>(null);

  const loadData = useCallback(async () => {
    try {
      const [wd, cd] = await Promise.all([walletService.getAll(), categoryService.getAll()]);
      setWallets(wd); setCategories(cd);
      if (!selectedWallet && wd.length > 0) setSelectedWallet(wd[0]);
      if (!selectedCategory && cd.length > 0) setSelectedCategory(cd[0]);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    setTimeout(() => amountRef.current?.focus(), 200);
  }, []));

  const handleSave = async () => {
    setErrorMsg('');
    if (!amount || !selectedWallet) { setErrorMsg('Selecciona medio de pago e ingresa un monto'); return; }
    setLoading(true);
    try {
      await transactionService.create({
        amount: parseFloat(amount), type: 'expense', description,
        wallet: selectedWallet.id, category: selectedCategory?.id, installments: 1,
      });
      setAmount(''); setDescription('');
      setErrorMsg('');
      setTimeout(() => amountRef.current?.focus(), 300);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.amount?.[0] || 'Error al registrar');
    } finally { setLoading(false); }
  };

  const walletIcon = { cash: '💵', debit: '🏦', credit: '💳' };

  return (
    <View className="flex-1 bg-bone" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-10"
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View className="items-center mb-16">
          <Text className="text-2xl font-semibold text-noir tracking-tight">Nuevo Gasto</Text>
        </View>

        {/* Form Container - uniform vertical rhythm */}
        <View className="gap-y-8">
          {/* Amount - Section 1 */}
          <Animated.View
            entering={FadeInLeft.springify().damping(8).mass(0.3).delay(100)}
          >
          <Text className="text-xs font-medium text-steel mb-2 ml-1 uppercase tracking-wider">Monto</Text>
          <TextInput
            ref={amountRef}
            className="bg-bone border border-concrete rounded-xl px-4 py-3.5 text-noir text-base"
            value={amount}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9.]/g, '');
              const parts = cleaned.split('.');
              if (parts.length > 2) return;
              if (parts[1] && parts[1].length > 2) return;
              setAmount(cleaned);
            }}
            keyboardType="decimal-pad"
            placeholder="$ 0.00"
            placeholderTextColor="#c9ccc3"
            maxLength={12}
          />
        </Animated.View>

        {/* Description - Section 2 */}
        <Animated.View
          entering={FadeInRight.springify().damping(8).mass(0.3).delay(200)}
        >
          <Text className="text-xs font-medium text-steel mb-2 ml-1 uppercase tracking-wider">Descripción</Text>
          <TextInput
            className="bg-bone border border-concrete rounded-xl px-4 py-3.5 text-noir text-base"
            placeholder="¿En qué gastaste?"
            placeholderTextColor="#c9ccc3"
            value={description}
            onChangeText={setDescription}
          />
        </Animated.View>

        {/* Selection Cards */}
        <View className="gap-y-6">
          {/* Wallet - Section 3 */}
          <Animated.View entering={FadeInLeft.springify().damping(8).mass(0.3).delay(300)}>
          <TouchableOpacity
            onPress={() => setShowWalletModal(true)}
            activeOpacity={0.8}
            className="border border-concrete rounded-2xl px-5 py-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-xl mr-3">{walletIcon[selectedWallet?.type || 'cash']}</Text>
              <View>
                <Text className="text-noir text-base font-medium">
                  {selectedWallet?.name || 'Medio de pago'}
                </Text>
                {selectedWallet && (
                  <Text className="text-concrete text-xs mt-0.5">
                    {selectedWallet.type === 'credit'
                      ? `Disp: $${Number(selectedWallet.available_credit || 0).toLocaleString('es-CO')}`
                      : `Saldo: $${Number(selectedWallet.balance).toLocaleString('es-CO')}`}
                  </Text>
                )}
              </View>
            </View>
            <Text className="text-concrete text-lg">›</Text>
          </TouchableOpacity>
          </Animated.View>

          {/* Category - Section 4 */}
          <Animated.View entering={FadeInRight.springify().damping(8).mass(0.3).delay(400)}>
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.8}
            className="border border-concrete rounded-2xl px-5 py-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: selectedCategory?.color_hex || '#c9ccc3' }}
              />
              <Text className="text-noir text-base font-medium">
                {selectedCategory?.name || 'Categoría'}
              </Text>
            </View>
            <Text className="text-concrete text-lg">›</Text>
          </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Error */}
        {errorMsg ? (
          <View className="mb-6">
            <Text className="text-red-400 text-sm text-center">{errorMsg}</Text>
          </View>
        ) : null}

        {/* Save Button - Section 5 */}
        <Animated.View entering={FadeInLeft.springify().damping(8).mass(0.3).delay(500)}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
          className={`bg-noir rounded-2xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
        >
          <Text className="text-bone font-semibold text-base">
            {loading ? 'Guardando...' : 'Guardar Gasto'}
          </Text>
        </TouchableOpacity>
        </Animated.View>
        </View>{/* End gap-y-8 */}
      </ScrollView>

      {/* Wallet Picker */}
      <Modal visible={showWalletModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/40 justify-end">
          <View className="bg-bone rounded-t-3xl px-6 pt-6 pb-10 max-h-[60%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-semibold text-noir">Medio de Pago</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)} className="w-8 h-8 rounded-full bg-concrete/20 items-center justify-center">
                <Text className="text-noir text-sm">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => { setSelectedWallet(w); setShowWalletModal(false); }}
                  className={`mb-2 rounded-2xl px-5 py-4 flex-row items-center ${selectedWallet?.id === w.id ? 'bg-steel/10' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className="text-2xl mr-4">{walletIcon[w.type]}</Text>
                  <View className="flex-1">
                    <Text className={`font-medium text-base ${selectedWallet?.id === w.id ? 'text-steel' : 'text-noir'}`}>{w.name}</Text>
                    <Text className="text-concrete text-xs mt-0.5">
                      {w.type === 'credit' ? `Disp: $${Number(w.available_credit || 0).toLocaleString('es-CO')}` : `Saldo: $${Number(w.balance).toLocaleString('es-CO')}`}
                    </Text>
                  </View>
                  {selectedWallet?.id === w.id && <Text className="text-steel font-bold text-lg">✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Picker */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/40 justify-end">
          <View className="bg-bone rounded-t-3xl px-6 pt-6 pb-10 max-h-[60%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-semibold text-noir">Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} className="w-8 h-8 rounded-full bg-concrete/20 items-center justify-center">
                <Text className="text-noir text-sm">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { setSelectedCategory(c); setShowCategoryModal(false); }}
                  className={`mb-2 rounded-2xl px-5 py-4 flex-row items-center ${selectedCategory?.id === c.id ? 'bg-steel/10' : ''}`}
                  activeOpacity={0.7}
                >
                  <View className="w-5 h-5 rounded-full mr-3" style={{ backgroundColor: c.color_hex }} />
                  <Text className={`font-medium text-base flex-1 ${selectedCategory?.id === c.id ? 'text-steel' : 'text-noir'}`}>{c.name}</Text>
                  {selectedCategory?.id === c.id && <Text className="text-steel font-bold text-lg">✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
