import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FormInput, PrimaryButton } from '../../src/components';

const { width } = Dimensions.get('window');

const steps = [
  { id: 1, title: 'Define tu Sueldo', subtitle: 'Opcional - Pensado para freelancers' },
  { id: 2, title: 'Gastos Fijos', subtitle: '¿Cuánto gastas al mes en promedio?' },
  { id: 3, title: 'Meta de Ahorro', subtitle: '¿Cuánto quieres ahorrar?' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finish onboarding
      router.replace('/(tabs)');
    }
  };

  return (
    <View className="flex-1 bg-bone">
      {/* Progress Bar */}
      <View className="flex-row px-6 pt-12 mb-8">
        {steps.map((_, index) => (
          <View
            key={index}
            className={`h-1 flex-1 mx-1 rounded-full ${
              index <= currentStep ? 'bg-steel' : 'bg-concrete/30'
            }`}
          />
        ))}
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        className="flex-1"
      >
        {/* Step 1: Income */}
        <View className="w-screen px-6 justify-center" style={{ width }}>
          <Text className="text-3xl font-bold text-noir mb-2">
            {steps[0].title}
          </Text>
          <Text className="text-lg text-concrete mb-8">
            {steps[0].subtitle}
          </Text>
          <FormInput
            label="Ingreso Mensual (Opcional)"
            placeholder="$ 0.00"
            keyboardType="decimal-pad"
          />
          <View className="mt-8">
            <PrimaryButton title="Continuar" onPress={handleNext} />
          </View>
        </View>

        {/* Step 2: Expenses */}
        <View className="w-screen px-6 justify-center" style={{ width }}>
          <Text className="text-3xl font-bold text-noir mb-2">
            {steps[1].title}
          </Text>
          <Text className="text-lg text-concrete mb-8">
            {steps[1].subtitle}
          </Text>
          <FormInput
            label="Gastos Fijos Mensuales"
            placeholder="$ 0.00"
            keyboardType="decimal-pad"
          />
          <View className="mt-8">
            <PrimaryButton title="Continuar" onPress={handleNext} />
          </View>
        </View>

        {/* Step 3: Savings Goal */}
        <View className="w-screen px-6 justify-center" style={{ width }}>
          <Text className="text-3xl font-bold text-noir mb-2">
            {steps[2].title}
          </Text>
          <Text className="text-lg text-concrete mb-8">
            {steps[2].subtitle}
          </Text>
          <FormInput
            label="Meta de Ahorro Inicial"
            placeholder="$ 0.00"
            keyboardType="decimal-pad"
          />
          <View className="mt-8">
            <PrimaryButton title="Comenzar" onPress={handleNext} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
