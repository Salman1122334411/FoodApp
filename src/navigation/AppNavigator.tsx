import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View, Text, AppState } from 'react-native';
import { Colors as BrandColors } from '../constants/Colors';
import { requestNotificationPermissions } from '../lib/notifications';
import React, { useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';
import Preloader from '../components/Preloader';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RestaurantScreen } from '../screens/RestaurantScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { EditProfileScreen } from '../screens/EditUserProfile';
import { OrderDetailsScreen } from '../screens/OrdersDetailScreen';
import { RestaurantDetailsScreen } from '../screens/RestaurantDetailsScreen';
import { EmailConfirmationScreen } from '../screens/EmailConfirmationScreen';
import { AddressScreen } from '../screens/AddressScreen';
import { RestaurantListScreen } from '../screens/RestaurantListScreen';
import { ExploreScreen } from '../screens/ExploreScreen';

// Create stable wrapped components outside of the component tree to prevent re-mounting
const HomeTabScreen = (props: any) => <HomeScreen {...props} />;
const SearchTabScreen = (props: any) => <SearchScreen {...props} />;
const OrdersTabScreen = (props: any) => <OrdersScreen {...props} />;
const CartTabScreen = (props: any) => <CartScreen {...props} />;
const ProfileTabScreen = (props: any) => <ProfileScreen {...props} />;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CartTabIcon({ color, size }: { color: string; size: number }) {
  const { cartItems } = useCart();
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name="cart-outline" size={size} color={color} />
      {itemCount > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -8,
            top: -4,
            backgroundColor: BrandColors.primary,
            borderRadius: 10,
            minWidth: 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

function TabNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: BrandColors.gray[500],
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeTabScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchTabScreen}
        options={{
          tabBarLabel: t('tabs.search'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersTabScreen}
        options={{
          tabBarLabel: t('tabs.orders'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartTabScreen}
        options={{
          tabBarLabel: t('tabs.cart'),
          tabBarIcon: ({ color, size }) => (
            <CartTabIcon color={color} size={size} />
          ),
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#111827',
          headerTitleStyle: { fontWeight: '700' as const, fontSize: 18, color: '#111827' },
          headerTitleAlign: 'center' as const,
          headerTitle: t('navigation.cart'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTabScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Hidden Tabs to persist the Bottom Menu Bar on deeper screens */}
      <Tab.Screen 
        name="CheckoutScreen" 
        component={CheckoutScreen} 
        options={{ 
          tabBarButton: () => null,
          title: t('navigation.checkout', 'Checkout'),
          headerShown: true,
          headerStyle: { backgroundColor: BrandColors.primary },
          headerTintColor: '#fff',
        }} 
      />
      <Tab.Screen 
        name="RestaurantDetails" 
        component={RestaurantDetailsScreen} 
        options={{ tabBarButton: () => null }} 
      />
      <Tab.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen as any} 
        options={{ tabBarButton: () => null }} 
      />
      <Tab.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ 
          tabBarButton: () => null,
          title: t('navigation.edit_profile', 'Edit Profile'),
          headerShown: true,
          headerStyle: { backgroundColor: BrandColors.primary },
          headerTintColor: '#fff',
        }} 
      />
    </Tab.Navigator>
  );
}

// Single source of truth for all native screen headers
const SHARED_HEADER_OPTIONS = {
  headerShown: true,
  headerStyle: { backgroundColor: BrandColors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
  headerTitleAlign: 'center' as const,
  headerBackTitleVisible: false,
};

export function AppNavigator() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  if (loading) {
    return <Preloader fullScreen={true} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen 
            name="Explore" 
            component={ExploreScreen}
            options={{ ...SHARED_HEADER_OPTIONS, title: t('navigation.explore') }}
          />
          <Stack.Screen name="Restaurant" component={RestaurantScreen} />
          <Stack.Screen 
            name="Restaurants" 
            component={RestaurantListScreen}
            options={{ ...SHARED_HEADER_OPTIONS, title: t('navigation.restaurants') }}
          />
          {/* These are now handled by the Tab Navigator */}
          <Stack.Screen name="Addresses" component={AddressScreen}
            options={{ ...SHARED_HEADER_OPTIONS, title: t('navigation.addresses', 'My Addresses') }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

