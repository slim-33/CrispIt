import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import WebContainer from '@/components/WebContainer';

const MENU_ITEMS = [
  {
    title: 'Carbon Dashboard',
    description: 'Track your sustainability impact',
    icon: 'bar-chart' as const,
    route: '/(tabs)/dashboard' as const,
  },
  {
    title: 'Fridge Tracker',
    description: 'Monitor expiry dates & reduce waste',
    icon: 'snowflake-o' as const,
    route: '/(tabs)/fridge' as const,
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <WebContainer>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.menuCard, { backgroundColor: theme.surface }, Platform.OS === 'web' && styles.webTouchable]}
            onPress={() => router.push(item.route)}>
            <View style={[styles.iconWrap, { backgroundColor: theme.cardBackground }]}>
              <FontAwesome name={item.icon} size={24} color={theme.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.menuDesc, { color: theme.textSecondary }]}>
                {item.description}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: { flex: 1, marginLeft: 14 },
  menuTitle: { fontSize: 16, fontWeight: '600' },
  menuDesc: { fontSize: 13, marginTop: 2 },
  webTouchable: Platform.select({
    web: { cursor: 'pointer' as any },
    default: {},
  }),
});
