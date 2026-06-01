import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { getDb } from '../src/db/client';
import { ToastProvider } from '../src/context/ToastContext';
import '../global.css';

if (Platform.OS === 'web' && typeof window !== 'undefined' && window.document) {
  window.document.documentElement.classList.add('light');
}

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDb()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('DB init failed:', err);
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 bg-bone items-center justify-center">
        <ActivityIndicator size="large" color="#20394a" />
        <Text className="text-steel text-sm mt-4">Iniciando base de datos...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="transfer" />
            <Stack.Screen name="categories/index" />
            <Stack.Screen name="goals/index" />
            <Stack.Screen name="transactions/index" />
          </Stack>
        </SafeAreaProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
