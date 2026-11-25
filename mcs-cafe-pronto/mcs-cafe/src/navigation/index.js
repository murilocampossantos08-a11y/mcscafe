import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { subscribeAllOrders } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import HomeScreen from '../screens/HomeScreen';
import ProductScreen from '../screens/ProductScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { DashboardScreen, AdminProducts } from '../screens/AdminScreens';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.surface, primary: colors.gold, border: colors.border, text: colors.cream },
};

const icons = { Início: 'cafe', Carrinho: 'bag', Pedidos: 'receipt', Perfil: 'person', Painel: 'stats-chart', Produtos: 'cube' };

function useNewOrders(enabled) {
  const [count, setCount] = useState(0);
  const prev = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    return subscribeAllOrders((list) => {
      const n = list.filter((o) => o.status === 'novo').length;
      if (prev.current !== null && n > prev.current) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (e) {}
      }
      prev.current = n;
      setCount(n);
    });
  }, [enabled]);
  return count;
}

function Tabs() {
  const { profile } = useAuth();
  const { count } = useCart();
  const role = profile.role;
  const newOrders = useNewOrders(role !== 'cliente');
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
        tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
      })}>
      {role === 'admin' && <Tab.Screen name="Painel" component={DashboardScreen} />}
      {role === 'cliente' && <Tab.Screen name="Início" component={HomeScreen} />}
      {role === 'cliente' && (
        <Tab.Screen name="Carrinho" component={CartScreen} options={{ tabBarBadge: count > 0 ? count : undefined, tabBarBadgeStyle: { backgroundColor: colors.gold, color: '#1A1208' } }} />
      )}
      {role === 'admin' && <Tab.Screen name="Produtos" component={AdminProducts} />}
      <Tab.Screen
        name="Pedidos"
        component={OrdersScreen}
        options={{ tabBarBadge: role !== 'cliente' && newOrders > 0 ? newOrders : undefined, tabBarBadgeStyle: { backgroundColor: colors.gold, color: '#1A1208' } }}
      />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Main() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Produto" component={ProductScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={theme}>
      {user && profile ? <Main /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
