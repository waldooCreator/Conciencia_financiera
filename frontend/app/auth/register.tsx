import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FormInput, PrimaryButton } from '../../src/components';
import { authService } from '../../src/services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    setErrorMsg('');
    if (!email || !password || !confirmPassword) {
      setErrorMsg('Completa todos los campos');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authService.register(email, password, confirmPassword);
      setErrorMsg('');
      router.replace('/onboarding');
    } catch (error: any) {
      const data = error.response?.data;
      if (data) {
        const firstKey = Object.keys(data)[0];
        const fieldError = data[firstKey];
        setErrorMsg(Array.isArray(fieldError) ? fieldError[0] : String(fieldError));
      } else {
        setErrorMsg('Error de conexión. ¿Está corriendo el backend?');
      }
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

        {errorMsg ? (
          <View className="bg-red-50 border border-red-300 rounded-2xl p-4 mb-4 flex-row items-start">
            <Text className="text-red-600 text-sm flex-1 leading-5">{errorMsg}</Text>
          </View>
        ) : null}

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
