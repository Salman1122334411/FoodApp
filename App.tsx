import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SplashScreenComponent } from './src/screens/SplashScreen';
import React, { useEffect, useState } from 'react';

// Import screens
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { RestaurantListScreen } from './src/screens/RestaurantListScreen';
import { RestaurantDetailsScreen } from './src/screens/RestaurantDetailsScreen';
import { CartScreen } from './src/screens/CartScreen';
import { EditProfileScreen } from './src/screens/EditUserProfile';
import { AddressScreen } from './src/screens/AddressScreen';
import { OrderDetailsScreen } from './src/screens/OrdersDetailScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { EmailConfirmationScreen } from './src/screens/EmailConfirmationScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF4B2B',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function NavigationContent() {
  const { user, loading } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading || splashVisible) {
    return <SplashScreenComponent />;
  }

  return (
    <Stack.Navigator>
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="EmailConfirmation"
            component={EmailConfirmationScreen}
            options={{
              title: 'Email Confirmation Screen',
              headerBackTitle: 'Back',
            }}
          />
        </>
      ) : (
        // App screens
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Restaurants" 
            component={RestaurantListScreen}
            options={{ 
              title: 'Restaurants',
              headerStyle: {
                backgroundColor: '#FF6B6B',
              },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="RestaurantDetails"
            component={RestaurantDetailsScreen}
            options={({ route }: any) => ({
              title: route.params?.restaurant?.name || 'Restaurant Details',
              headerBackTitle: 'Back',
            })}
          />
            <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{ 
              title: 'Edit Profile',
              headerStyle: {
                backgroundColor: '#FF6B6B',
              },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{
              title: 'Your Cart',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{
              title: 'Orders',
              headerBackTitle: 'Back',
            }}
          />
            <Stack.Screen
            name="AddAddress"
            component={AddressScreen}
            options={{
              title: 'Address',
              headerBackTitle: 'Back',
            }}
          />


          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{
              title: 'Order Details',
              headerBackTitle: 'Back',
            }}
          />

           
          <Stack.Screen
            name="ProfileSetup"
            component={ProfileSetupScreen}
            options={{
              title: 'Profile Setup',
              headerBackTitle: 'Back',
            }}
          />


          
          <Stack.Screen
            name="CheckoutScreen"
            component={CheckoutScreen}
            options={{
              title: 'Checkout',
              headerBackTitle: 'Back',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <NavigationContent />
            <StatusBar style="auto" />
          </NavigationContainer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}


