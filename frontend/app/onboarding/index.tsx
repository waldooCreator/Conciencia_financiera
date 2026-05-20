import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FormInput, PrimaryButton } from '../../src/components';
import { walletService, goalService } from '../../src/services/finance';

const { width } = Dimensions.get('window');

interface DebitAccount { name: string; balance: number; }
interface CreditCard { name: string; limit: number; }

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Collected data
  const [salary, setSalary] = useState('');
  const [cashBalance, setCashBalance] = useState('');
  const [hasDebit, setHasDebit] = useState<boolean | null>(null);
  const [debitAccounts, setDebitAccounts] = useState<DebitAccount[]>([]);
  const [tempDebitName, setTempDebitName] = useState('');
  const [hasCredit, setHasCredit] = useState<boolean | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [tempCreditName, setTempCreditName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateNext = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setValue('');
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const finishOnboarding = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const cv = parseFloat(cashBalance) || 0;
      if (cv > 0) await walletService.create({ name: 'Efectivo', type: 'cash', balance: cv });

      for (const da of debitAccounts) {
        if (da.balance > 0) await walletService.create({ name: da.name, type: 'debit', balance: da.balance });
      }

      for (const cc of creditCards) {
        await walletService.create({ name: cc.name, type: 'credit', balance: 0, credit_limit: cc.limit });
      }

      const gv = parseFloat(goalAmount) || 0;
      if (gv > 0) await goalService.create({ name: 'Mi Meta de Ahorro', target_amount: gv });

      router.replace('/register');
    } catch { setErrorMsg('Error al configurar. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  const totalSteps = 10; // Approximate, for progress bar

  // Step definitions
  const renderStep = () => {
    switch (step) {
      // 0: Salary
      case 0:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Cuánto es tu sueldo mensual?</Text>
            <Text className="text-concrete text-lg mb-8">Opcional - pensado para freelancers</Text>
            <FormInput placeholder="$ 0.00" value={value} onChangeText={setValue} keyboardType="decimal-pad" autoFocus />
            <View className="mt-8">
              <PrimaryButton title="Continuar" onPress={() => { setSalary(value); animateNext(1); }} />
              <TouchableOpacity className="mt-4 items-center" onPress={() => { setSalary('0'); animateNext(1); }}>
                <Text className="text-steel font-medium">Omitir</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      // 1: Cash
      case 1:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Cuánto efectivo tienes disponible?</Text>
            <Text className="text-concrete text-lg mb-8">Saldo inicial en efectivo</Text>
            <FormInput placeholder="$ 0.00" value={value} onChangeText={setValue} keyboardType="decimal-pad" autoFocus />
            <View className="mt-8">
              <PrimaryButton title="Continuar" onPress={() => { setCashBalance(value); animateNext(2); }} />
            </View>
          </>
        );

      // 2: Has debit?
      case 2:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-6">¿Tienes cuentas de débito?</Text>
            <View className="flex-row" style={{gap: 12}}>
              <View className="flex-1">
                <PrimaryButton title="Sí" onPress={() => { setHasDebit(true); animateNext(3); }} />
              </View>
              <View className="flex-1">
                <PrimaryButton title="No" onPress={() => { setHasDebit(false); animateNext(6); }} variant="secondary" />
              </View>
            </View>
          </>
        );

      // 3: Debit name
      case 3:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Qué nombre le pones a tu cuenta débito?</Text>
            <Text className="text-concrete text-lg mb-8">Ej: Cuenta Bancaria, Nequi, Daviplata</Text>
            <FormInput placeholder="Nombre de la cuenta" value={value} onChangeText={setValue} autoFocus />
            <View className="mt-8">
              <PrimaryButton title="Continuar" onPress={() => { setTempDebitName(value); animateNext(4); }} />
            </View>
          </>
        );

      // 4: Debit balance
      case 4:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Cuánto saldo tiene "{tempDebitName}"?</Text>
            <FormInput placeholder="$ 0.00" value={value} onChangeText={setValue} keyboardType="decimal-pad" autoFocus />
            <View className="mt-8">
              <PrimaryButton title="Continuar" onPress={() => {
                const b = parseFloat(value) || 0;
                setDebitAccounts([...debitAccounts, { name: tempDebitName || 'Cuenta Débito', balance: b }]);
                animateNext(5);
              }} />
            </View>
          </>
        );

      // 5: Add another debit?
      case 5:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Agregar otra cuenta débito?</Text>
            <Text className="text-concrete text-lg mb-8">
              {debitAccounts.length > 0 ? `Ya tienes ${debitAccounts.length}: ${debitAccounts.map(d => d.name).join(', ')}` : ''}
            </Text>
            <View className="flex-row" style={{gap: 12}}>
              <View className="flex-1">
                <PrimaryButton title="Sí, otra" onPress={() => { setTempDebitName(''); animateNext(3); }} />
              </View>
              <View className="flex-1">
                <PrimaryButton title="No, siguiente" onPress={() => animateNext(6)} variant="secondary" />
              </View>
            </View>
          </>
        );

      // 6: Has credit?
      case 6:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-6">¿Tienes tarjetas de crédito?</Text>
            <View className="flex-row" style={{gap: 12}}>
              <View className="flex-1">
                <PrimaryButton title="Sí" onPress={() => { setHasCredit(true); animateNext(7); }} />
              </View>
              <View className="flex-1">
                <PrimaryButton title="No" onPress={() => { setHasCredit(false); animateNext(10); }} variant="secondary" />
              </View>
            </View>
          </>
        );

      // 7: Credit name
      case 7:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Qué nombre le pones a tu tarjeta de crédito?</Text>
            <Text className="text-concrete text-lg mb-8">Ej: RappiCard, Visa, Mastercard</Text>
            <FormInput placeholder="Nombre de la tarjeta" value={value} onChangeText={setValue} autoFocus />
            <View className="mt-8">
              <PrimaryButton title="Continuar" onPress={() => { setTempCreditName(value); animateNext(8); }} />
            </View>
          </>
        );

      // 8: Credit limit
      case 8:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Cuál es el límite de crédito de "{tempCreditName}"?</Text>
            <FormInput placeholder="$ 0.00" value={value} onChangeText={setValue} keyboardType="decimal-pad" autoFocus />
            <View className="mt-8">
              <PrimaryButton title="Continuar" onPress={() => {
                const l = parseFloat(value) || 0;
                setCreditCards([...creditCards, { name: tempCreditName || 'Tarjeta de Crédito', limit: l }]);
                animateNext(9);
              }} />
            </View>
          </>
        );

      // 9: Add another credit?
      case 9:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Agregar otra tarjeta de crédito?</Text>
            <Text className="text-concrete text-lg mb-8">
              {creditCards.length > 0 ? `Ya tienes ${creditCards.length}: ${creditCards.map(c => c.name).join(', ')}` : ''}
            </Text>
            <View className="flex-row" style={{gap: 12}}>
              <View className="flex-1">
                <PrimaryButton title="Sí, otra" onPress={() => { setTempCreditName(''); animateNext(7); }} />
              </View>
              <View className="flex-1">
                <PrimaryButton title="No, siguiente" onPress={() => animateNext(10)} variant="secondary" />
              </View>
            </View>
          </>
        );

      // 10: Goal
      case 10:
        return (
          <>
            <Text className="text-3xl font-bold text-noir mb-2">¿Cuál es tu meta de ahorro?</Text>
            <Text className="text-concrete text-lg mb-8">Define una meta para motivarte</Text>
            <FormInput placeholder="$ 0.00" value={value} onChangeText={setValue} keyboardType="decimal-pad" autoFocus />
            {errorMsg ? (
              <View className="bg-red-50 border border-red-400 rounded-xl p-3 mt-4">
                <Text className="text-red-600 text-center">{errorMsg}</Text>
              </View>
            ) : null}
            <View className="mt-8">
              <PrimaryButton title="Comenzar 🚀" onPress={() => { setGoalAmount(value); finishOnboarding(); }} loading={loading} />
              <TouchableOpacity className="mt-4 items-center" onPress={() => { setGoalAmount('0'); finishOnboarding(); }}>
                <Text className="text-steel font-medium">Omitir</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const computedSteps = 2 + (hasDebit ? 4 : 0) + (hasCredit ? 4 : 0) + 1;
  const currentStepNumber = step + 1;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-bone">
      <View className="flex-1 justify-between p-6">
        <View className="pt-4">
          <View className="flex-row">
            {Array.from({ length: computedSteps }).map((_, i) => (
              <View key={i} className={`h-1 flex-1 mx-0.5 rounded-full ${i <= step ? 'bg-steel' : 'bg-concrete/30'}`} />
            ))}
          </View>
          <Text className="text-concrete text-sm mt-3">{currentStepNumber} de {computedSteps}</Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }} className="flex-1 justify-center">
          {renderStep()}
        </Animated.View>

        <View className="pb-8" />
      </View>
    </KeyboardAvoidingView>
  );
}
