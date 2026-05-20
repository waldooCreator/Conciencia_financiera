import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FormInput, PrimaryButton } from '../../src/components';
import { authService } from '../../src/services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authService.register(email, password, confirmPassword);
      Alert.alert('Éxito', 'Cuenta creada exitosamente.', [
        { text: 'OK', onPress: () => router.replace('/onboarding') }
      ]);
    } catch (error: any) {
      const message = error.response?.data?.detail || error.response?.data?.password || 'Error al crear la cuenta';
      Alert.alert('Error', typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bone"
    >
      <ScrollView contentContainerClassName="flex-grow p-6 justify-center">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-noir mb-2">
            Crear Cuenta
          </Text>
          <Text className="text-concrete">
            Comienza a gestionar tu dinero hoy
          </Text>
        </View>

        <FormInput
          label="Correo electrónico"
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormInput
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <FormInput
          label="Confirmar Contraseña"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <View className="mt-6">
          <PrimaryButton
            title="Crear Cuenta"
            onPress={handleRegister}
            loading={loading}
          />
        </View>

        <View className="mt-6 items-center">
          <Text className="text-concrete mb-2">¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text className="text-steel font-semibold text-base">
              Iniciar Sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
