import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const CrispItLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2D6A4F',
    background: '#F0F7F4',
    card: '#FFFFFF',
    text: '#1B1B1B',
    border: '#E5E7EB',
  },
};

const CrispItDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#52B788',
    background: '#0F1A14',
    card: '#1A2C23',
    text: '#F0F7F4',
    border: '#374151',
  },
};

function BrandedSplash() {
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={splashStyles.container}>
      <Animated.View style={[splashStyles.content, { opacity: fadeAnim }]}>
        <FontAwesome name="leaf" size={64} color="#FFFFFF" />
        <Text style={splashStyles.name}>CrispIt</Text>
        <Text style={splashStyles.tagline}>Freshness, filtered.</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7CB89B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  name: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFFBB',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      const timer = setTimeout(() => setShowSplash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded || showSplash) return <BrandedSplash />;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CrispItDarkTheme : CrispItLightTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="scan-result"
          options={{
            title: 'Scan Results',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1A2C23' : '#FFFFFF' },
            headerTintColor: colorScheme === 'dark' ? '#52B788' : '#2D6A4F',
          }}
        />
        <Stack.Screen
          name="recipe"
          options={{
            title: 'Recipe',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1A2C23' : '#FFFFFF' },
            headerTintColor: colorScheme === 'dark' ? '#52B788' : '#2D6A4F',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
