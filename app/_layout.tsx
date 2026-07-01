import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemeProvider, lightColors } from '@/src/theme';
import { useAuthStore } from '@/src/store/authStore';
import { connectSocket, initSocketLifecycle } from '@/src/services/socket';

function RootNavigator() {
  const isOnboardingComplete = useAuthStore((s) => s.isOnboardingComplete);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for zustand-persist to finish loading from AsyncStorage
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated (e.g. fast refresh), resolve immediately
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (isOnboardingComplete) {
      router.replace('/(tabs)');
      connectSocket();
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [hydrated, isOnboardingComplete]);

  useEffect(() => {
    initSocketLifecycle();
  }, []);

  if (!hydrated) {
    return (
      <View style={[styles.splash, { backgroundColor: lightColors.primary }]}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
      <Stack.Screen name="theme-preview" />
      <Stack.Screen name="components-preview" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <RootNavigator />
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
