import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { authService } from '../src/services/auth';
import '../global.css';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authStatus = await authService.isAuthenticated();
    setIsAuthenticated(authStatus);
  };

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <View className="flex-1 bg-bone items-center justify-center">
        <ActivityIndicator size="large" color="#20394a" />
      </View>
    );
  }

  // If not authenticated, show auth stack
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#f9f5ed" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="onboarding/index" />
        </Stack>
      </SafeAreaProvider>
    );
  }

  // If authenticated, show main app
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#f9f5ed" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
