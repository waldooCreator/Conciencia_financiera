import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FormInput, PrimaryButton } from '../../src/components';
import { authService } from '../../src/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await authService.login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.';
      Alert.alert('Error de autenticación', message);
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
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-denim rounded-3xl mb-4 items-center justify-center">
            <Text className="text-4xl text-bone font-bold">$</Text>
          </View>
          <Text className="text-3xl font-bold text-noir mb-2">
            Bienvenido
          </Text>
          <Text className="text-lg text-concrete text-center">
            Gestiona tus finanzas sin fricción
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
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View className="mt-6">
          <PrimaryButton
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
          />
        </View>

        <View className="mt-6 items-center">
          <Text className="text-concrete mb-2">¿No tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text className="text-steel font-semibold text-base">
              Crear una cuenta
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
