import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { authService } from '../src/services/auth';
import { syncService } from '../src/services/sync';
import { ToastProvider } from '../src/context/ToastContext';
import '../global.css';

// Fix for NativeWind color scheme issue on web
if (Platform.OS === 'web' && typeof window !== 'undefined' && window.document) {
  window.document.documentElement.classList.add('light');
}

// Error boundary to catch render errors and avoid blank screen
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message || String(error) };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-bone items-center justify-center p-8">
          <Text className="text-xl font-bold text-noir mb-3">Algo salió mal</Text>
          <Text className="text-sm text-concrete text-center">{this.state.errorMsg}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authStatus = await authService.isAuthenticated();
      setIsAuthenticated(authStatus);

      if (authStatus) {
        try {
          const { synced } = await syncService.syncPendingTransactions();
          if (synced > 0) console.log(`Synced ${synced} transactions`);
        } catch (e) {
          console.error('Sync error:', e);
        }
      }
    } catch (error) {
      console.warn('Auth check failed:', error);
      setIsAuthenticated(false);
    }
  };

  return (
    <ErrorBoundary>
      {isAuthenticated === null ? (
        <View className="flex-1 bg-bone items-center justify-center">
          <ActivityIndicator size="large" color="#20394a" />
          <Text className="text-steel text-sm mt-4">Cargando...</Text>
        </View>
      ) : !isAuthenticated ? (
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
          </Stack>
        </SafeAreaProvider>
      ) : (
        <ToastProvider>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="transfer" />
              <Stack.Screen name="categories/index" />
              <Stack.Screen name="goals/index" />
              <Stack.Screen name="transactions/index" />
              <Stack.Screen name="onboarding/index" />
            </Stack>
          </SafeAreaProvider>
        </ToastProvider>
      )}
    </ErrorBoundary>
  );
}
