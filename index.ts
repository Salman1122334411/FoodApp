console.log('DEBUG: index.ts starting');
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

import App from './App';

// Prevent the native splash screen from auto-hiding so we can control when it hides
SplashScreen.preventAutoHideAsync();

// Hide splash screen immediately before React Native even starts rendering
// This ensures it's hidden as early as possible
SplashScreen.hideAsync().catch(() => {
  // Ignore any errors - splash screen might already be hidden
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
