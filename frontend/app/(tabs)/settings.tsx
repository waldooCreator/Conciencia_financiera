import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components';
import { authService } from '../../src/services/auth';
import { User } from '../../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const userData = await authService.getUser();
    setUser(userData);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: async () => {
        await authService.logout();
        router.replace('/auth/login');
      }},
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-bone p-6">
      <Text className="text-3xl font-bold text-noir mb-6">Configuración</Text>

      {/* Perfil */}
      <View className="bg-denim rounded-2xl p-4 mb-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-steel rounded-full items-center justify-center mr-4">
            <Text className="text-bone text-xl font-bold">
              {user?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text className="text-bone font-semibold text-lg">
              {user?.first_name || user?.email?.split('@')[0] || 'Usuario'}
            </Text>
            <Text className="text-concrete text-sm">{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Navegación */}
      <View className="bg-denim rounded-2xl mb-4 overflow-hidden">
        <Pressable className="p-4 border-b border-steel/20" onPress={() => router.push('/categories')}>
          <Text className="text-bone text-base">📂 Gestionar Categorías</Text>
        </Pressable>
        <Pressable className="p-4">
          <Text className="text-bone text-base">⚙️ Preferencias</Text>
        </Pressable>
      </View>

      <View className="items-center mb-8">
        <Text className="text-concrete text-sm">Conciencia Financiera v1.0.0</Text>
      </View>

      <PrimaryButton title="Cerrar Sesión" onPress={handleLogout} variant="secondary" />
    </ScrollView>
  );
}
