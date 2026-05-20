import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FormInput, PrimaryButton } from '../../src/components';
import { walletService, categoryService, transactionService } from '../../src/services/finance';
import { syncService } from '../../src/services/sync';
import { Wallet, Category } from '../../src/types';

const { width } = Dimensions.get('window');

const walletIcons: Record<string, string> = { cash: '💵', debit: '🏦', credit: '💳' };
const walletTypeLabels: Record<string, string> = { cash: 'Efectivo', debit: 'Cuenta Débito', credit: 'Tarjeta de Crédito' };

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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    fadeAnim.setValue(0); slideUp.setValue(30); scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const animateSuccess = () => {
    successScale.setValue(0);
    Animated.spring(successScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  useEffect(() => { animateIn(); }, []);

  const loadData = useCallback(async () => {
    try {
      const [wd, cd] = await Promise.all([walletService.getAll(), categoryService.getAll()]);
      setWallets(wd); setCategories(cd);
      if (!selectedWallet && wd.length > 0) setSelectedWallet(wd[0]);
      if (!selectedCategory && cd.length > 0) setSelectedCategory(cd[0]);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadData(); animateIn(); checkNetwork(); }, []));

  const checkNetwork = async () => { setIsOnline(await syncService.isOnline()); };

  const handleSave = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (!amount || !selectedWallet) { setErrorMsg('Ingresa un monto y selecciona un medio de pago'); return; }
    setLoading(true);
    try {
      if (await syncService.isOnline()) {
        await transactionService.create({ amount: parseFloat(amount), type: 'expense', description, wallet: selectedWallet.id, category: selectedCategory?.id, installments: 1 });
        setSuccessMsg('¡Gasto registrado!');
        animateSuccess();
      } else {
        await syncService.queueTransaction({ amount: parseFloat(amount), type: 'expense', description, wallet: selectedWallet.id, category: selectedCategory?.id, installments: 1, is_synced: false });
        setSuccessMsg('Guardado offline 📡');
        animateSuccess();
      }
      setAmount(''); setDescription('');
    } catch (error: any) {
      const d = error.response?.data;
      if (d?.amount) setErrorMsg(Array.isArray(d.amount) ? d.amount[0] : String(d.amount));
      else setErrorMsg('Error al registrar');
    } finally { setLoading(false); }
  };

  const quickAmounts = ['5.000', '10.000', '20.000', '50.000', '100.000'];

  return (
    <View className="flex-1 bg-bone">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Animated Header */}
        <Animated.View 
          style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }, { scale: scaleAnim }] }}
          className="bg-denim mx-6 mt-6 rounded-3xl p-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-bone text-3xl font-bold">Registrar</Text>
              <Text className="text-steel text-lg mt-1">Nuevo gasto</Text>
            </View>
            <View className="bg-bone/10 w-14 h-14 rounded-2xl items-center justify-center">
              <Text className="text-3xl">💸</Text>
            </View>
          </View>

          {/* Amount Input */}
          <Text className="text-concrete text-sm mb-2">¿Cuánto gastaste?</Text>
          <View className="flex-row items-center">
            <Text className="text-bone text-5xl font-bold mr-3">$</Text>
            <Text className="text-bone text-5xl font-bold flex-1" style={{ minWidth: 100 }}>
              {amount ? Number(amount).toLocaleString() : '0'}
            </Text>
          </View>
          <View className="mt-2 bg-bone/5 rounded-xl">
            <FormInput
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Quick Amounts */}
          <View className="flex-row flex-wrap mt-3" style={{ gap: 6 }}>
            {quickAmounts.map((a) => (
              <TouchableOpacity
                key={a}
                onPress={() => setAmount(a.replace('.', ''))}
                className="bg-bone/10 px-4 py-2 rounded-full"
              >
                <Text className="text-bone text-sm">${a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }} className="mx-6 mt-4">
          <FormInput
            label="Descripción"
            placeholder="¿En qué gastaste?"
            value={description}
            onChangeText={setDescription}
          />
        </Animated.View>

        {/* Selectors Row */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }} className="mx-6 mt-4 flex-row" style={{ gap: 12 }}>
          {/* Wallet Selector */}
          <TouchableOpacity
            onPress={() => setShowWalletModal(true)}
            className="flex-1 bg-denim rounded-2xl p-4"
            activeOpacity={0.8}
          >
            <Text className="text-concrete text-xs mb-1">Medio de pago</Text>
            <View className="flex-row items-center">
              <Text className="text-xl mr-2">{walletIcons[selectedWallet?.type || 'cash']}</Text>
              <Text className="text-bone font-semibold text-base flex-1" numberOfLines={1}>
                {selectedWallet?.name || 'Seleccionar'}
              </Text>
            </View>
            {selectedWallet && (
              <Text className="text-steel text-xs mt-1">
                {selectedWallet.type === 'credit' ? `Disp: $${selectedWallet.available_credit}` : `Saldo: $${selectedWallet.balance}`}
              </Text>
            )}
          </TouchableOpacity>

          {/* Category Selector */}
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            className="flex-1 bg-denim rounded-2xl p-4"
            activeOpacity={0.8}
          >
            <Text className="text-concrete text-xs mb-1">Categoría</Text>
            <View className="flex-row items-center">
              {selectedCategory && (
                <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: selectedCategory?.color_hex }} />
              )}
              <Text className="text-bone font-semibold text-base flex-1" numberOfLines={1}>
                {selectedCategory?.name || 'Seleccionar'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Messages */}
        <Animated.View className="mx-6 mt-4">
          {errorMsg ? (
            <View className="bg-red-50 border border-red-400 rounded-2xl p-4">
              <Text className="text-red-600 text-center font-medium">{errorMsg}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <Animated.View 
              style={{ transform: [{ scale: successScale }] }}
              className="bg-green-50 border border-green-400 rounded-2xl p-4"
            >
              <Text className="text-green-700 text-center font-medium text-lg">{successMsg}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Save Button */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }} className="mx-6 mt-6">
          <PrimaryButton
            title={isOnline ? 'Guardar Gasto' : 'Guardar Offline 📡'}
            onPress={handleSave}
            loading={loading}
          />
        </Animated.View>

        {!isOnline && (
          <View className="mx-6 mt-3 bg-steel/10 rounded-xl p-3">
            <Text className="text-steel text-center text-sm">Modo offline - Se sincronizará automáticamente</Text>
          </View>
        )}
      </ScrollView>

      {/* Wallet Picker Modal */}
      <Modal visible={showWalletModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6 max-h-[60%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-bold text-noir">Medio de Pago</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)} className="bg-concrete/20 w-8 h-8 rounded-full items-center justify-center">
                <Text className="text-noir font-bold">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => { setSelectedWallet(w); setShowWalletModal(false); }}
                  className={`py-4 px-4 mb-2 rounded-2xl flex-row items-center ${selectedWallet?.id === w.id ? 'bg-steel/10 border border-steel' : 'bg-denim'}`}
                >
                  <Text className="text-2xl mr-4">{walletIcons[w.type]}</Text>
                  <View className="flex-1">
                    <Text className={`font-semibold text-lg ${selectedWallet?.id === w.id ? 'text-steel' : 'text-bone'}`}>{w.name}</Text>
                    <Text className={`text-sm ${selectedWallet?.id === w.id ? 'text-steel' : 'text-concrete'}`}>
                      {walletTypeLabels[w.type]} · {w.type === 'credit' ? `Disp: $${w.available_credit}` : `Saldo: $${w.balance}`}
                    </Text>
                  </View>
                  {selectedWallet?.id === w.id && <Text className="text-steel text-xl">✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View className="flex-1 bg-noir/50 justify-end">
          <View className="bg-bone rounded-t-3xl p-6 max-h-[60%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-bold text-noir">Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} className="bg-concrete/20 w-8 h-8 rounded-full items-center justify-center">
                <Text className="text-noir font-bold">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { setSelectedCategory(c); setShowCategoryModal(false); }}
                  className={`py-4 px-4 mb-2 rounded-2xl flex-row items-center ${selectedCategory?.id === c.id ? 'bg-steel/10 border border-steel' : 'bg-denim'}`}
                >
                  <View className="w-5 h-5 rounded-full mr-3" style={{ backgroundColor: c.color_hex }} />
                  <Text className={`font-semibold text-lg flex-1 ${selectedCategory?.id === c.id ? 'text-steel' : 'text-bone'}`}>{c.name}</Text>
                  {selectedCategory?.id === c.id && <Text className="text-steel text-xl">✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
