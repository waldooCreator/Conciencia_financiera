import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { authService } from '../src/services/auth';
import { syncService } from '../src/services/sync';
import '../global.css';

// Fix for NativeWind color scheme issue on web
if (typeof window !== 'undefined' && window.document) {
  window.document.documentElement.classList.add('light');
}

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authStatus = await authService.isAuthenticated();
    setIsAuthenticated(authStatus);
    
    // If authenticated, try to sync pending transactions
    if (authStatus) {
      try {
        const { synced, failed } = await syncService.syncPendingTransactions();
        if (synced > 0) {
          console.log(`Synced ${synced} pending transactions`);
        }
      } catch (error) {
        console.error('Error syncing pending transactions:', error);
      }
    }
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
        <Stack.Screen name="onboarding/index" />
      </Stack>
    </SafeAreaProvider>
  );
}
