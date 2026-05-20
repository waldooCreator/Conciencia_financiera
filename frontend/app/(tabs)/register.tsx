import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Animated, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { walletService, categoryService, transactionService } from '../../src/services/finance';
import { syncService } from '../../src/services/sync';
import { Wallet, Category } from '../../src/types';

const walletIcons: Record<string, string> = { cash: '💵', debit: '🏦', credit: '💳' };

export default function RegisterScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const amountRef = useRef<TextInput>(null);

  // Staggered animations
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;
  const anim5 = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const runStaggered = () => {
    [anim1, anim2, anim3, anim4, anim5].forEach(a => a.setValue(0));
    const items = [anim1, anim2, anim3, anim4, anim5];
    items.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 450,
        delay: i * 60,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => { runStaggered(); setTimeout(() => amountRef.current?.focus(), 400); }, []);

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
    runStaggered();
    syncService.isOnline().then(setIsOnline);
    setTimeout(() => amountRef.current?.focus(), 300);
  }, []));

  const handleSave = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (!amount || !selectedWallet) { setErrorMsg('Selecciona un medio de pago e ingresa un monto'); return; }
    setLoading(true);
    try {
      if (await syncService.isOnline()) {
        await transactionService.create({ amount: parseFloat(amount), type: 'expense', description, wallet: selectedWallet.id, category: selectedCategory?.id, installments: 1 });
      } else {
        await syncService.queueTransaction({ amount: parseFloat(amount), type: 'expense', description, wallet: selectedWallet.id, category: selectedCategory?.id, installments: 1, is_synced: false });
      }
      setSuccessMsg(isOnline ? 'Gasto registrado' : 'Guardado offline');
      Animated.spring(successAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
      setAmount(''); setDescription('');
      setTimeout(() => { setSuccessMsg(''); successAnim.setValue(0); amountRef.current?.focus(); }, 2000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.amount?.[0] || 'Error al registrar');
    } finally { setLoading(false); }
  };

  const FadeInView = ({ anim, children, className }: any) => (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }} className={className}>
      {children}
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-bone">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-8 pb-8" keyboardShouldPersistTaps="handled">
        {/* 1. Header */}
        <FadeInView anim={anim1} className="items-center mb-10">
          <Text className="text-2xl font-bold text-noir">Nuevo Gasto</Text>
        </FadeInView>

        {/* 2. Amount Input */}
        <FadeInView anim={anim2} className="items-center mb-8">
          <View className={`items-center ${amountFocused ? 'scale-105' : ''}`} style={{ transitionProperty: 'transform' }}>
            {!amount && !amountFocused ? (
              <Text className="text-5xl font-bold text-concrete">$0.00</Text>
            ) : (
              <Text className="text-5xl font-bold text-noir">
                ${amount ? Number(amount).toLocaleString('es-CO') : '0'}
              </Text>
            )}
          </View>
          <TextInput
            ref={amountRef}
            className="text-5xl font-bold text-noir text-center w-full opacity-0 h-0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="$0.00"
            placeholderTextColor="#c9ccc3"
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            style={{ position: 'absolute', opacity: 0, height: 0 }}
          />
          <TouchableOpacity onPress={() => amountRef.current?.focus()} className="py-2 px-6">
            <Text className="text-concrete text-lg">{amount ? '' : 'Toca para escribir el monto'}</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* 3. Description */}
        <FadeInView anim={anim3} className="mb-6">
          <Text className="text-steel text-sm font-medium mb-2 ml-1">Descripción</Text>
          <TextInput
            className="bg-bone border border-concrete rounded-2xl px-4 py-3 text-noir text-base"
            placeholder="¿En qué gastaste?"
            placeholderTextColor="#c9ccc3"
            value={description}
            onChangeText={setDescription}
          />
        </FadeInView>

        {/* 4. Selection Cards */}
        <FadeInView anim={anim4} className="flex-row mb-6" style={{ gap: 12 }}>
          {/* Wallet Card */}
          <TouchableOpacity
            onPress={() => setShowWalletModal(true)}
            activeOpacity={0.95}
            className={`flex-1 rounded-2xl p-4 border ${selectedWallet ? 'bg-denim border-denim' : 'bg-bone border-concrete'}`}
          >
            <Text className={`text-xs mb-2 ${selectedWallet ? 'text-concrete' : 'text-steel'}`}>Medio de pago</Text>
            <View className="flex-row items-center">
              <Text className="text-xl mr-2">{walletIcons[selectedWallet?.type || 'cash']}</Text>
              <Text className={`font-semibold text-sm flex-1 ${selectedWallet ? 'text-bone' : 'text-noir'}`} numberOfLines={1}>
                {selectedWallet?.name || 'Seleccionar'}
              </Text>
            </View>
            {selectedWallet && (
              <Text className={`text-xs mt-1 ml-1 ${selectedWallet ? 'text-steel' : 'text-concrete'}`}>
                {selectedWallet.type === 'credit' ? `Disp $${selectedWallet.available_credit}` : `Saldo $${selectedWallet.balance}`}
              </Text>
            )}
          </TouchableOpacity>

          {/* Category Card */}
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.95}
            className={`flex-1 rounded-2xl p-4 border ${selectedCategory ? 'bg-denim border-denim' : 'bg-bone border-concrete'}`}
          >
            <Text className={`text-xs mb-2 ${selectedCategory ? 'text-concrete' : 'text-steel'}`}>Categoría</Text>
            <View className="flex-row items-center">
              {selectedCategory ? (
                <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: selectedCategory.color_hex }} />
              ) : (
                <Text className="text-concrete text-sm mr-2">📂</Text>
              )}
              <Text className={`font-semibold text-sm flex-1 ${selectedCategory ? 'text-bone' : 'text-noir'}`} numberOfLines={1}>
                {selectedCategory?.name || 'Seleccionar'}
              </Text>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* 5. Error/Success Messages */}
        {errorMsg ? (
          <FadeInView anim={anim4} className="mb-4">
            <Text className="text-red-400 text-sm text-center bg-red-50 rounded-xl py-2 px-4">{errorMsg}</Text>
          </FadeInView>
        ) : null}
        {successMsg ? (
          <Animated.View style={{ opacity: successAnim, transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }} className="mb-4">
            <Text className="text-green-600 text-sm text-center bg-green-50 rounded-xl py-2 px-4 font-medium">{successMsg} ✓</Text>
          </Animated.View>
        ) : null}

        {/* 6. Save Button */}
        <FadeInView anim={anim5}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
            className={`bg-noir rounded-2xl py-4 items-center ${loading ? 'opacity-50' : ''}`}
          >
            <Text className="text-bone font-semibold text-lg">
              {loading ? 'Guardando...' : isOnline ? 'Guardar Gasto' : 'Guardar Offline'}
            </Text>
          </TouchableOpacity>
          {!isOnline && (
            <Text className="text-steel text-xs text-center mt-2">Sin conexión. Se sincronizará automáticamente.</Text>
          )}
        </FadeInView>
      </ScrollView>

      {/* Wallet Modal */}
      <Modal visible={showWalletModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6 max-h-[65%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-noir">Medio de Pago</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)} className="bg-concrete/20 w-8 h-8 rounded-full items-center justify-center">
                <Text className="text-noir font-bold text-sm">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => { setSelectedWallet(w); setShowWalletModal(false); }}
                  className={`mb-2 rounded-2xl p-4 flex-row items-center ${selectedWallet?.id === w.id ? 'bg-steel/10 border border-steel' : 'bg-denim'}`}
                  activeOpacity={0.8}
                >
                  <Text className="text-2xl mr-4">{walletIcons[w.type]}</Text>
                  <View className="flex-1">
                    <Text className={`font-semibold text-base ${selectedWallet?.id === w.id ? 'text-steel' : 'text-bone'}`}>{w.name}</Text>
                    <Text className={`text-xs mt-0.5 ${selectedWallet?.id === w.id ? 'text-steel' : 'text-concrete'}`}>
                      {w.type === 'credit' ? `Crédito disponible: $${w.available_credit}` : `Saldo: $${w.balance}`}
                    </Text>
                  </View>
                  {selectedWallet?.id === w.id && <Text className="text-steel text-lg font-bold">✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6 max-h-[65%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-noir">Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} className="bg-concrete/20 w-8 h-8 rounded-full items-center justify-center">
                <Text className="text-noir font-bold text-sm">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { setSelectedCategory(c); setShowCategoryModal(false); }}
                  className={`mb-2 rounded-2xl p-4 flex-row items-center ${selectedCategory?.id === c.id ? 'bg-steel/10 border border-steel' : 'bg-denim'}`}
                  activeOpacity={0.8}
                >
                  <View className="w-5 h-5 rounded-full mr-3" style={{ backgroundColor: c.color_hex }} />
                  <Text className={`font-semibold text-base flex-1 ${selectedCategory?.id === c.id ? 'text-steel' : 'text-bone'}`}>{c.name}</Text>
                  {selectedCategory?.id === c.id && <Text className="text-steel text-lg font-bold">✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
