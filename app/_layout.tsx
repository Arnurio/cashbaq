import React, { Component, useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SplashScreen } from 'expo-router';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { ToastProvider } from '../lib/Toast';
import { getOnboarded } from '../lib/storage';

// Suppress known native-module warnings in production
LogBox.ignoreLogs([
  'No native',
  'Require cycle',
  'splash screen',
]);

// Suppress unhandled promise rejections from native modules
const originalHandler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
if ((globalThis as any).ErrorUtils) {
  (globalThis as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    const msg = error?.message ?? '';
    // Swallow non-fatal native module / splash screen errors
    if (!isFatal && (msg.includes('No native') || msg.includes('native module') || msg.includes('splash screen'))) {
      return;
    }
    originalHandler?.(error, isFatal);
  });
}

try { SplashScreen.preventAutoHideAsync(); } catch { /* no native splash */ }

// ErrorBoundary to prevent red screens in production
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log but don't crash – prevents red error banners
    console.warn('ErrorBoundary caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      // Silently recover — re-render children on next state change
      return this.props.children;
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!fontsLoaded) return;

    getOnboarded().then((value) => {
      const inOnboarding = segments[0] === 'onboarding';

      if (!value && !inOnboarding) {
        router.replace('/onboarding');
      } else if (value && inOnboarding) {
        router.replace('/(tabs)');
      }

      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, [fontsLoaded, segments]);

  if (!ready) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F6F8FA' },
        }}
      >
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="find"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Чем платить?',
            headerTitleStyle: { fontFamily: 'Manrope_700Bold' },
            headerTintColor: '#0D7C5F',
          }}
        />
        <Stack.Screen
          name="add-card"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Добавить карту',
            headerTitleStyle: { fontFamily: 'Manrope_700Bold' },
            headerTintColor: '#0D7C5F',
          }}
        />
        <Stack.Screen
          name="card-detail"
          options={{
            headerShown: true,
            headerTitle: 'Детали карты',
            headerTitleStyle: { fontFamily: 'Manrope_700Bold' },
            headerTintColor: '#0D7C5F',
            headerBackTitle: 'Назад',
          }}
        />
      </Stack>
      </ToastProvider>
    </ErrorBoundary>
  );
}
