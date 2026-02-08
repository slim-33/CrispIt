import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from './src/constants/theme';
import { Platform } from 'react-native';

import ScannerScreen from './src/screens/ScannerScreen';
import FridgeScreen from './src/screens/FridgeScreen';
import PokedexScreen from './src/screens/PokedexScreen';
import ChatScreen from './src/screens/ChatScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CarbonReceiptScreen from './src/screens/CarbonReceiptScreen';
import LoadingScreen from './src/components/LoadingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Dashboard with Carbon Receipt
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="CarbonReceipt" component={CarbonReceiptScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Scanner"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Fridge') {
              iconName = focused ? 'file-tray-full' : 'file-tray-full-outline';
            } else if (route.name === 'Pokedex') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'Scanner') {
              iconName = focused ? 'scan-circle' : 'scan-circle-outline';
            } else if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Dashboard') {
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
            }

            return <Ionicons name={iconName} size={focused ? 28 : 24} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.tabBarInactive,
          tabBarStyle: {
            backgroundColor: COLORS.tabBarBackground,
            borderTopWidth: 1,
            borderTopColor: COLORS.tabBarBorder,
            paddingTop: SPACING.sm,
            paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
            height: Platform.OS === 'ios' ? 88 : 70,
          },
          tabBarLabelStyle: {
            fontSize: FONT_SIZES.xs,
            fontWeight: FONT_WEIGHTS.medium,
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: SPACING.xs,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Fridge" 
          component={FridgeScreen}
          options={{ tabBarLabel: 'Fridge' }}
        />
        <Tab.Screen 
          name="Pokedex" 
          component={PokedexScreen}
          options={{ tabBarLabel: 'Collection' }}
        />
        <Tab.Screen 
          name="Scanner" 
          component={ScannerScreen}
          options={{ tabBarLabel: 'Smart Scan' }}
        />
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ tabBarLabel: 'AI Chat' }}
        />
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardStack}
          options={{ tabBarLabel: 'Impact' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
