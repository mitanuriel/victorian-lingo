/**
 * Root layout — loads fonts, initialises DB and stores, then renders.
 */

import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
  CormorantGaramond_700Bold,
  CormorantGaramond_700Bold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@theme';
import { useSettingsStore } from '@store/settingsStore';
import { useBookStore } from '@store/bookStore';
import { useCollectionStore } from '@store/collectionStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const loadSettings = useSettingsStore((s) => s.load);
  const loadBooks = useBookStore((s) => s.loadFromDb);
  const loadCollection = useCollectionStore((s) => s.load);

  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    CormorantGaramond_700Bold,
    CormorantGaramond_700Bold_Italic,
  });

  useEffect(() => {
    async function init() {
      await Promise.all([loadSettings(), loadBooks(), loadCollection()]);
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }
    if (fontsLoaded) {
      init();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" backgroundColor={Colors.parchment} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="book/[id]"
              options={{
                animation: 'fade',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="reader/[id]"
              options={{
                animation: 'fade_from_bottom',
                presentation: 'fullScreenModal',
              }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, backgroundColor: Colors.parchment },
});
