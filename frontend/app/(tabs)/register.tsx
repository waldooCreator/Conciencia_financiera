import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { Banknote, CreditCard, Landmark, ChevronRight, X, ArrowLeftRight, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { walletService, categoryService, transactionService } from '../../src/services/finance';
import { getServiceErrorMessage } from '../../src/utils/errors';
import { useToast } from '../../src/context/ToastContext';
import { Wallet, Category } from '../../src/types';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [seeding, setSeeding] = useState(false);
  const amountRef = useRef<TextInput>(null);

  const loadData = useCallback(async () => {
    try {
      const [wd, cd] = await Promise.all([walletService.getAll(), categoryService.getAll()]);
      setWallets(wd);
      if (cd.length === 0) {
        setSeeding(true);
        try {
          const seeded = await categoryService.seedDefaults();
          setCategories(seeded?.categories || []);
        } catch {
          setCategories([]);
        } finally {
          setSeeding(false);
        }
      } else {
        setCategories(cd);
      }
    } catch {
      setWallets([]);
      setCategories([]);
    }
  }, []);

  // Filtered wallets: income only allows cash & debit
  const availableWallets = transactionType === 'income'
    ? wallets.filter(w => w.type === 'cash' || w.type === 'debit')
    : wallets;

  // Auto-switch wallet when toggling type
  const handleTypeChange = (newType: 'expense' | 'income') => {
    setTransactionType(newType);
    if (newType === 'income' && selectedWallet?.type === 'credit') {
      const firstNonCredit = wallets.find(w => w.type !== 'credit');
      setSelectedWallet(firstNonCredit || null);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
    setTimeout(() => amountRef.current?.focus(), 200);
  }, []));

  const handleSave = async () => {
    if (!amount || !selectedWallet) { showToast('Selecciona medio de pago e ingresa un monto', 'warning'); return; }
    if (transactionType === 'expense' && !selectedCategory) { showToast('Selecciona una categoría', 'warning'); return; }
    if (transactionType === 'income' && selectedWallet.type === 'credit') { showToast('No se puede ingresar dinero a tarjeta de crédito', 'warning'); return; }
    setLoading(true);
    try {
      await transactionService.create({
        amount: amount,
        type: transactionType,
        description,
        wallet: selectedWallet.id,
        category: transactionType === 'expense' ? selectedCategory?.id : undefined,
        installments: 1,
      });
      setAmount(''); setDescription('');
      showToast(
        transactionType === 'expense' ? 'Gasto registrado exitosamente' : 'Ingreso registrado exitosamente',
        'success'
      );
      setTimeout(() => amountRef.current?.focus(), 300);
    } catch (e: unknown) {
      showToast(getServiceErrorMessage(e, 'Error al registrar'), 'error');
    } finally { setLoading(false); }
  };

  const walletIcon = (type: string) => {
    const props = { size: 22, strokeWidth: 2, color: '#6196aa' };
    if (type === 'cash') return <Banknote {...props} />;
    if (type === 'credit') return <CreditCard {...props} />;
    return <Landmark {...props} />;
  };

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
        <View className="items-center mb-8">
          {/* Income/Expense Toggle */}
          <View className="flex-row bg-concrete/20 rounded-2xl p-1 mb-6">
            <TouchableOpacity
              onPress={() => handleTypeChange('expense')}
              className={`px-6 py-2.5 rounded-xl ${transactionType === 'expense' ? 'bg-noir' : ''}`}
              activeOpacity={0.8}
            >
              <Text className={`font-semibold text-sm ${transactionType === 'expense' ? 'text-bone' : 'text-concrete'}`}>
                Gasto
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTypeChange('income')}
              className={`px-6 py-2.5 rounded-xl ${transactionType === 'income' ? 'bg-steel' : ''}`}
              activeOpacity={0.8}
            >
              <Text className={`font-semibold text-sm ${transactionType === 'income' ? 'text-bone' : 'text-concrete'}`}>
                Ingreso
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-semibold text-noir tracking-tight">
            {transactionType === 'expense' ? 'Nuevo Gasto' : 'Nuevo Ingreso'}
          </Text>
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
            placeholder={transactionType === 'expense' ? '¿En qué gastaste?' : 'Fuente del ingreso'}
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
              <View className="mr-3">{walletIcon(selectedWallet?.type || 'cash')}</View>
              <View>
                <Text className="text-noir text-base font-medium">
                  {selectedWallet?.name || 'Elige el medio de pago'}
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
            <ChevronRight size={20} color="#c9ccc3" />
          </TouchableOpacity>
          </Animated.View>

          {/* Category - Section 4 (only for expenses) */}
          {transactionType === 'expense' && (
          <Animated.View entering={FadeInRight.springify().damping(8).mass(0.3).delay(400)}>
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            disabled={seeding}
            activeOpacity={0.8}
            className={`border border-concrete rounded-2xl px-5 py-4 flex-row items-center justify-between ${seeding ? 'opacity-60' : ''}`}
          >
            <View className="flex-row items-center flex-1">
              {seeding ? (
                <ActivityIndicator size="small" color="#6196aa" style={{ marginRight: 10 }} />
              ) : (
                <View
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: selectedCategory?.color_hex || '#c9ccc3' }}
                />
              )}
              <Text className="text-noir text-base font-medium">
                {seeding ? 'Creando categorías...' : (selectedCategory?.name || 'Elige la categoría del gasto')}
              </Text>
            </View>
            <ChevronRight size={20} color="#c9ccc3" />
          </TouchableOpacity>
          </Animated.View>
          )}
        </View>

        {/* Save Button - Section 5 */}
        <Animated.View entering={FadeInLeft.springify().damping(8).mass(0.3).delay(500)}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
          className={`bg-noir rounded-2xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
        >
          <Text className="text-bone font-semibold text-base">
            {loading ? 'Guardando...' : transactionType === 'expense' ? 'Guardar Gasto' : 'Guardar Ingreso'}
          </Text>
        </TouchableOpacity>
        </Animated.View>

        {/* Transfer quick link */}
        <Animated.View entering={FadeInLeft.springify().damping(8).mass(0.3).delay(550)}>
          <TouchableOpacity
            onPress={() => router.push('/transfer')}
            className="flex-row items-center justify-center py-3 mt-2"
            activeOpacity={0.7}
          >
            <ArrowLeftRight size={15} color="#6196aa" />
            <Text className="text-steel text-sm font-medium ml-1.5">Transferir dinero entre cuentas</Text>
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
                <X size={16} color="#030706" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {availableWallets.length > 0 ? availableWallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => { setSelectedWallet(w); setShowWalletModal(false); }}
                  className={`mb-2 rounded-2xl px-5 py-4 flex-row items-center ${selectedWallet?.id === w.id ? 'bg-steel/10' : ''}`}
                  activeOpacity={0.7}
                >
                  <View className="mr-4">{walletIcon(w.type)}</View>
                  <View className="flex-1">
                    <Text className={`font-medium text-base ${selectedWallet?.id === w.id ? 'text-steel' : 'text-noir'}`}>{w.name}</Text>
                    <Text className="text-concrete text-xs mt-0.5">
                      {w.type === 'credit' ? `Disp: $${Number(w.available_credit || 0).toLocaleString('es-CO')}` : `Saldo: $${Number(w.balance).toLocaleString('es-CO')}`}
                    </Text>
                  </View>
                  {selectedWallet?.id === w.id && <Text className="text-steel font-bold text-lg">✓</Text>}
                </TouchableOpacity>
              )) : (
                <View className="py-8 items-center">
                  <Text className="text-concrete text-base text-center">
                    {transactionType === 'income'
                      ? 'No tienes cuentas de efectivo o débito. Crea una en Cuentas.'
                      : 'No hay medios de pago disponibles'}
                  </Text>
                </View>
              )}
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
                <X size={16} color="#030706" strokeWidth={2} />
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
