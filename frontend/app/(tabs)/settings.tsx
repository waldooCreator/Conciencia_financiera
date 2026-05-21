import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { FolderOpen, Target, Settings, LogOut } from 'lucide-react-native';
import { PrimaryButton } from '../../src/components';
import { authService } from '../../src/services/auth';
import { User } from '../../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => { loadUser(); }, []);
  const loadUser = async () => { const u = await authService.getUser(); setUser(u); };

  const doLogout = async () => {
    setLogoutLoading(true);
    await authService.logout();
    setLogoutLoading(false);
    setShowLogout(false);
    router.replace('/');
  };

  const iconProps = { size: 20, strokeWidth: 2 };

  return (
    <ScrollView className="flex-1 bg-bone p-6">
      <Text className="text-3xl font-bold text-noir mb-6">Configuración</Text>

      <View className="bg-denim rounded-2xl p-4 mb-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-steel rounded-full items-center justify-center mr-4">
            <Text className="text-bone text-xl font-bold">
              {user?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text className="text-bone font-semibold text-lg">{user?.first_name || user?.email?.split('@')[0] || 'Usuario'}</Text>
            <Text className="text-concrete text-sm">{user?.email}</Text>
          </View>
        </View>
      </View>

      <View className="bg-denim rounded-2xl mb-4 overflow-hidden">
        <Pressable className="p-4 border-b border-steel/20 flex-row items-center" onPress={() => router.push('/categories')}>
          <FolderOpen {...iconProps} color="#6196aa" />
          <Text className="text-bone text-base ml-3">Gestionar Categorías</Text>
        </Pressable>
        <Pressable className="p-4 border-b border-steel/20 flex-row items-center" onPress={() => router.push('/goals')}>
          <Target {...iconProps} color="#6196aa" />
          <Text className="text-bone text-base ml-3">Metas de Ahorro</Text>
        </Pressable>
        <Pressable className="p-4 flex-row items-center">
          <Settings {...iconProps} color="#c9ccc3" />
          <Text className="text-concrete text-base ml-3">Preferencias</Text>
        </Pressable>
      </View>

      <View className="items-center mb-8">
        <Text className="text-concrete text-sm">Conciencia Financiera v1.0.0</Text>
      </View>

      <PrimaryButton title="Cerrar Sesión" onPress={() => setShowLogout(true)} variant="secondary" />

      <Modal visible={showLogout} transparent animationType="fade">
        <View className="flex-1 bg-noir/50 justify-center items-center p-6">
          <View className="bg-bone rounded-2xl p-6 w-80">
            <LogOut size={32} strokeWidth={2} color="#030706" className="mb-3 self-center" />
            <Text className="text-xl font-bold text-noir mb-2 text-center">Cerrar Sesión</Text>
            <Text className="text-concrete mb-6 text-center">¿Estás seguro que deseas cerrar sesión?</Text>
            <View className="flex-row">
              <View className="flex-1 mr-2"><PrimaryButton title="Cancelar" onPress={() => setShowLogout(false)} variant="secondary" /></View>
              <View className="flex-1 ml-2"><PrimaryButton title="Salir" onPress={doLogout} loading={logoutLoading} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
