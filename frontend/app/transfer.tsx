import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { ArrowLeftRight, ChevronDown, Check, Banknote, CreditCard, Landmark, AlertTriangle } from 'lucide-react-native';
import { walletService, transactionService } from '../src/services/finance';
import { useToast } from '../src/context/ToastContext';
import { getServiceErrorMessage } from '../src/utils/errors';
import { Wallet } from '../src/types';

const WALLET_ICONS: Record<string, React.ComponentType<any>> = {
  cash: Banknote,
  debit: Landmark,
  credit: CreditCard,
};

export default function TransferScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [sourceWallet, setSourceWallet] = useState<Wallet | null>(null);
  const [destWallet, setDestWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadWallets = useCallback(async () => {
    try {
      const data = await walletService.getAll();
      setWallets(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadWallets(); }, [loadWallets]));

  const getAvailableWallets = (exclude: Wallet | null) =>
    wallets.filter(w => !exclude || w.id !== exclude.id);

  const handleTransfer = async () => {
    setErrorMsg('');
    if (!sourceWallet || !destWallet) {
      setErrorMsg('Selecciona origen y destino');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    try {
      await transactionService.create({
        wallet: sourceWallet.id,
        destination_wallet: destWallet.id,
        amount: amount,
        type: 'transfer',
        description: description || `Transferencia a ${destWallet.name}`,
        installments: 1,
        current_installment: 1,
      });
      showToast('Transferencia realizada', 'success');
      router.back();
    } catch (error: unknown) {
      setErrorMsg(getServiceErrorMessage(error, 'Error al transferir'));
    } finally {
      setLoading(false);
    }
  };

  const WalletIcon = (type: string) => {
    const Icon = WALLET_ICONS[type] || Banknote;
    return <Icon size={18} strokeWidth={2} color="#6196aa" />;
  };

  const sourceBalance = sourceWallet
    ? (sourceWallet.type === 'credit'
        ? (parseFloat(sourceWallet.credit_limit || '0') - parseFloat(sourceWallet.balance))
        : parseFloat(sourceWallet.balance))
    : 0;

  const isPayingCreditCard = sourceWallet && destWallet
    && sourceWallet.type !== 'credit' && destWallet.type === 'credit';

  const isCashAdvance = sourceWallet && destWallet
    && sourceWallet.type === 'credit' && destWallet.type !== 'credit';

  const getButtonLabel = () => {
    if (isPayingCreditCard) return 'Pagar Tarjeta';
    if (isCashAdvance) return 'Avance';
    return 'Transferir';
  };

  const getDescriptionPlaceholder = () => {
    if (isCashAdvance) return 'Ej: Avance de tarjeta de crédito';
    if (isPayingCreditCard) return 'Ej: Pago de tarjeta';
    return 'Ej: Transferencia entre cuentas';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bone"
    >
      <ScrollView contentContainerClassName="p-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-steel text-base">← Volver</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-noir flex-1">Transferir</Text>
        </View>

        {/* Source Wallet */}
        <Text className="text-noir font-medium mb-2 text-base">Origen</Text>
        <TouchableOpacity
          className="bg-bone/50 border border-concrete rounded-xl px-4 py-3.5 mb-4 flex-row items-center justify-between"
          onPress={() => { setShowSourcePicker(true); setShowDestPicker(false); }}
        >
          {sourceWallet ? (
            <View className="flex-row items-center">
              {WalletIcon(sourceWallet.type)}
              <View className="ml-3">
                <Text className="text-noir font-medium">{sourceWallet.name}</Text>
                <Text className="text-concrete text-xs">
                  {sourceWallet.type === 'credit' ? 'Crédito disponible' : 'Saldo'}: $
                  {sourceBalance.toLocaleString()}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-concrete">Seleccionar origen</Text>
          )}
          <ChevronDown size={18} color="#c9ccc3" />
        </TouchableOpacity>

        {/* Source Picker Modal */}
        {showSourcePicker && (
          <View className="bg-denim rounded-2xl p-2 mb-4 border border-steel/20">
            {getAvailableWallets(destWallet).map(w => (
              <TouchableOpacity
                key={w.id}
                className="flex-row items-center justify-between px-4 py-3 rounded-xl active:bg-steel/10"
                onPress={() => { setSourceWallet(w); setShowSourcePicker(false); }}
              >
                <View className="flex-row items-center">
                  {WalletIcon(w.type)}
                  <View className="ml-3">
                    <Text className="text-bone font-medium">{w.name}</Text>
                    <Text className="text-concrete text-xs">
                      {w.type === 'credit' ? 'Crédito' : w.type === 'debit' ? 'Débito' : 'Efectivo'}
                      {' · '}${w.type === 'credit'
                        ? ((parseFloat(w.credit_limit || '0') - parseFloat(w.balance)).toLocaleString())
                        : parseFloat(w.balance).toLocaleString()}
                    </Text>
                  </View>
                </View>
                {sourceWallet?.id === w.id && <Check size={18} color="#6196aa" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Arrow */}
        <View className="items-center my-2">
          <View className="bg-steel/20 rounded-full w-10 h-10 items-center justify-center">
            <ArrowLeftRight size={18} color="#6196aa" />
          </View>
        </View>

        {/* Destination Wallet */}
        <Text className="text-noir font-medium mb-2 text-base">Destino</Text>
        <TouchableOpacity
          className="bg-bone/50 border border-concrete rounded-xl px-4 py-3.5 mb-4 flex-row items-center justify-between"
          onPress={() => { setShowDestPicker(true); setShowSourcePicker(false); }}
        >
          {destWallet ? (
            <View className="flex-row items-center">
              {WalletIcon(destWallet.type)}
              <View className="ml-3">
                <Text className="text-noir font-medium">{destWallet.name}</Text>
                <Text className="text-concrete text-xs">
                  {destWallet.type === 'credit' ? 'Tarjeta de Crédito' : destWallet.type === 'debit' ? 'Cuenta Bancaria' : 'Efectivo'}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-concrete">Seleccionar destino</Text>
          )}
          <ChevronDown size={18} color="#c9ccc3" />
        </TouchableOpacity>

        {/* Dest Picker Modal */}
        {showDestPicker && (
          <View className="bg-denim rounded-2xl p-2 mb-4 border border-steel/20">
            {getAvailableWallets(sourceWallet).map(w => (
              <TouchableOpacity
                key={w.id}
                className="flex-row items-center justify-between px-4 py-3 rounded-xl active:bg-steel/10"
                onPress={() => { setDestWallet(w); setShowDestPicker(false); }}
              >
                <View className="flex-row items-center">
                  {WalletIcon(w.type)}
                  <View className="ml-3">
                    <Text className="text-bone font-medium">{w.name}</Text>
                    <Text className="text-concrete text-xs">
                      {w.type === 'credit' ? 'Tarjeta de Crédito' : w.type === 'debit' ? 'Débito' : 'Efectivo'}
                    </Text>
                  </View>
                </View>
                {destWallet?.id === w.id && <Check size={18} color="#6196aa" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Payment indicator */}
        {isPayingCreditCard && (
          <View className="bg-steel/10 rounded-2xl px-4 py-3 mb-4 border border-steel/20 flex-row items-center">
            <CreditCard size={16} color="#6196aa" />
            <Text className="text-steel text-sm ml-2 flex-1">
              Estás pagando la tarjeta {destWallet?.name}. La deuda se reducirá en el monto transferido.
            </Text>
          </View>
        )}

        {/* Cash Advance indicator */}
        {isCashAdvance && (
          <View className="bg-red-500/10 rounded-2xl px-4 py-3 mb-4 border border-red-500/20 flex-row items-center">
            <CreditCard size={16} color="#e74c3c" />
            <Text className="text-red-400 text-sm ml-2 flex-1">
              Avance de {sourceWallet?.name}. La deuda de la tarjeta aumentará en el monto transferido.
            </Text>
          </View>
        )}

        {/* Amount */}
        <Text className="text-noir font-medium mb-2 text-base">Monto</Text>
        <View className="bg-bone/50 border border-concrete rounded-xl px-4 py-3.5 mb-2 flex-row items-center">
          <Text className="text-concrete text-lg mr-2">$</Text>
          <TextInput
            className="flex-1 text-noir text-lg"
            placeholder="0.00"
            placeholderTextColor="#c9ccc3"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>
        {sourceWallet && (
          <Text className="text-concrete text-xs mb-4">
            Disponible: ${sourceBalance.toLocaleString()}
          </Text>
        )}

        {/* Description */}
        <Text className="text-noir font-medium mb-2 text-base">Concepto (opcional)</Text>
        <TextInput
          className="bg-bone/50 border border-concrete rounded-xl px-4 py-3.5 mb-4 text-noir text-base"
          placeholder={getDescriptionPlaceholder()}
          placeholderTextColor="#c9ccc3"
          value={description}
          onChangeText={setDescription}
        />

        {/* Error */}
        {errorMsg ? (
          <View className="bg-red-50 border border-red-300 rounded-2xl p-4 mb-4">
            <View className="flex-row items-start">
              <AlertTriangle size={18} color="#e74c3c" style={{ marginTop: 1, marginRight: 10 }} />
              <View className="flex-1">
                <Text className="text-red-700 font-semibold text-sm mb-1">No se pudo realizar la transferencia</Text>
                <Text className="text-red-600 text-sm leading-5">{errorMsg}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Transfer Button */}
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center justify-center mt-2 ${loading || !sourceWallet || !destWallet || !amount ? 'bg-concrete' : 'bg-noir'}`}
          onPress={handleTransfer}
          disabled={loading || !sourceWallet || !destWallet || !amount}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#f9f5ed" />
          ) : (
            <Text className="text-bone text-lg font-semibold">
              {getButtonLabel()}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
