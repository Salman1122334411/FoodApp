import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import './src/i18n/index';
import { SplashScreenView } from './src/screens/SplashScreenView';

import * as Font from 'expo-font';
import { AppNavigator } from './src/navigation/AppNavigator';

// Prevent the default Expo splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Preload fonts
        await Font.loadAsync(Ionicons.font);
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
      }
    }
    prepare();
  }, []);

  if (showSplash) {
    return (
      <SplashScreenView onFinished={() => setShowSplash(false)} />
    );
  }

  if (!fontsLoaded) {
    return null; // Or a very simple loading view
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}


