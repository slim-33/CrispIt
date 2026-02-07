import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const LunchBoxLightTheme = {
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

const LunchBoxDarkTheme = {
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? LunchBoxDarkTheme : LunchBoxLightTheme}>
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
