import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FormInput, PrimaryButton } from '../../src/components';
import { walletService, goalService } from '../../src/services/finance';

const { width } = Dimensions.get('window');

interface Step {
  key: string;
  title: string;
  subtitle?: string;
  inputType?: 'number' | 'text';
  placeholder?: string;
  skippable?: boolean;
}

const steps: Step[] = [
  { key: 'salary', title: '¿Cuánto es tu sueldo mensual?', subtitle: 'Opcional - pensado para freelancers', inputType: 'number', placeholder: '$ 0.00', skippable: true },
  { key: 'cash', title: '¿Cuánto efectivo tienes disponible?', subtitle: 'Saldo inicial en efectivo', inputType: 'number', placeholder: '$ 0.00', skippable: false },
  { key: 'debit', title: '¿Tienes cuentas de débito?', subtitle: 'Puedes agregar una o varias', inputType: 'text', placeholder: 'Saldo de tu cuenta débito', skippable: false },
  { key: 'debit_name', title: '¿Qué nombre le pones a tu cuenta débito?', inputType: 'text', placeholder: 'Ej: Cuenta Bancaria', skippable: false },
  { key: 'credit', title: '¿Tienes tarjetas de crédito?', subtitle: 'Agrega tu límite de crédito', inputType: 'number', placeholder: '$ 0.00', skippable: false },
  { key: 'credit_name', title: '¿Qué nombre le pones a tu tarjeta de crédito?', inputType: 'text', placeholder: 'Ej: RappiCard', skippable: false },
  { key: 'credit_limit', title: '¿Cuál es el límite de tu tarjeta de crédito?', inputType: 'number', placeholder: '$ 0.00', skippable: false },
  { key: 'goal', title: '¿Cuál es tu meta de ahorro?', subtitle: 'Define una meta para motivarte', inputType: 'number', placeholder: '$ 0.00', skippable: true },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Collected data
  const [salary, setSalary] = useState('');
  const [cashBalance, setCashBalance] = useState('');
  const [debitBalance, setDebitBalance] = useState('');
  const [debitName, setDebitName] = useState('');
  const [hasCredit, setHasCredit] = useState(false);
  const [creditName, setCreditName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [hasDebit, setHasDebit] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleContinue = () => {
    // Save value based on current step
    const numVal = parseFloat(value) || 0;
    const txtVal = value.trim();

    switch (step.key) {
      case 'salary': setSalary(txtVal || '0'); break;
      case 'cash': setCashBalance(txtVal || '0'); break;
      case 'debit':
        setHasDebit(!!txtVal && numVal > 0);
        setDebitBalance(txtVal);
        break;
      case 'debit_name': setDebitName(txtVal); break;
      case 'credit':
        setHasCredit(!!txtVal && numVal > 0);
        setCreditLimit(txtVal);
        break;
      case 'credit_name': setCreditName(txtVal); break;
      case 'credit_limit': setCreditLimit(txtVal); break;
      case 'goal': setGoalAmount(txtVal || '0'); break;
    }

    if (step.key === 'debit' && (!txtVal || numVal <= 0)) {
      // Skip debit name if no debit
      setDebitName('');
      setCurrentStep(currentStep + 2); // Skip debit_name
      setValue('');
      return;
    }

    if (step.key === 'credit' && (!txtVal || numVal <= 0)) {
      // Skip credit details if no credit
      setCreditName('');
      setCreditLimit('');
      setValue('');
      if (isLastStep) { finishOnboarding(); return; }
      setCurrentStep(currentStep + 3); // Skip credit_name and credit_limit
      return;
    }

    setValue('');

    if (isLastStep) {
      finishOnboarding();
    } else {
      animateTransition(() => setCurrentStep(currentStep + 1));
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const cashVal = parseFloat(cashBalance) || 0;
      const debitVal = parseFloat(debitBalance) || 0;
      const goalVal = parseFloat(goalAmount) || 0;

      // Cash wallet
      if (cashVal > 0) await walletService.create({ name: 'Efectivo', type: 'cash', balance: cashVal });
      // Debit wallet
      if (debitVal > 0 && hasDebit) {
        await walletService.create({ name: debitName || 'Cuenta Débito', type: 'debit', balance: debitVal });
      }
      // Credit card
      if (hasCredit) {
        const limit = parseFloat(creditLimit) || 0;
        await walletService.create({ name: creditName || 'Tarjeta de Crédito', type: 'credit', balance: 0, credit_limit: limit });
      }
      // Savings goal
      if (goalVal > 0) await goalService.create({ name: 'Mi Meta de Ahorro', target_amount: goalVal });

      router.replace('/register');
    } catch (e) {
      setErrorMsg('Error al configurar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-bone">
      <View className="flex-1 justify-between p-6">
        {/* Progress */}
        <View className="pt-4">
          <View className="flex-row">
            {steps.map((_, i) => (
              <View key={i} className={`h-1 flex-1 mx-0.5 rounded-full ${i <= currentStep ? 'bg-steel' : 'bg-concrete/30'}`} />
            ))}
          </View>
          <Text className="text-concrete text-sm mt-3">{currentStep + 1} de {steps.length}</Text>
        </View>

        {/* Question */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }} className="flex-1 justify-center">
          <Text className="text-3xl font-bold text-noir mb-3">{step.title}</Text>
          {step.subtitle && <Text className="text-concrete text-lg mb-8">{step.subtitle}</Text>}
          
          {step.inputType && (
            <FormInput
              placeholder={step.placeholder}
              value={value}
              onChangeText={setValue}
              keyboardType={step.inputType === 'number' ? 'decimal-pad' : 'default'}
              autoFocus
            />
          )}

          {errorMsg ? (
            <View className="bg-red-50 border border-red-400 rounded-xl p-3 mt-4">
              <Text className="text-red-600 text-center">{errorMsg}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Actions */}
        <View className="pb-8">
          <PrimaryButton
            title={isLastStep ? 'Comenzar 🚀' : 'Continuar'}
            onPress={handleContinue}
            loading={loading}
          />
          {step.skippable && (
            <TouchableOpacity className="mt-4 items-center" onPress={isLastStep ? finishOnboarding : () => animateTransition(() => { setValue(''); setCurrentStep(currentStep + 1); })}>
              <Text className="text-steel font-medium">Omitir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
