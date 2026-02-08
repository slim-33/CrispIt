import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getScanHistory } from '@/lib/api';
import { useResponsive } from '@/hooks/useResponsive';
import WebContainer from '@/components/WebContainer';
import Logo from '@/components/Logo';
import type { ScanResult } from '@/lib/types';

const CARD_GAP = 14;
const HORIZONTAL_PAD = 20;

const FEATURES = [
  {
    title: 'Freshness\nCheck',
    icon: 'camera' as const,
    route: '/(tabs)/scan',
  },
  {
    title: 'Carbon\nDashboard',
    icon: 'line-chart' as const,
    route: '/(tabs)/dashboard',
  },
  {
    title: 'Fridge',
    icon: 'archive' as const,
    route: '/(tabs)/fridge',
  },
  {
    title: 'Barcode\nEco-score',
    icon: 'barcode' as const,
    route: '/(tabs)/scan',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { width } = useResponsive();
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  const contentWidth = Math.min(width, 480);
  const cardSize = (contentWidth - HORIZONTAL_PAD * 2 - CARD_GAP) / 2;

  useFocusEffect(
    useCallback(() => {
      loadScans();
    }, [])
  );

  async function loadScans() {
    try {
      const scans = await getScanHistory();
      setRecentScans(scans.slice(0, 3));
    } catch {
      // Will show placeholder
    }
  }

  return (
    <WebContainer>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.homeBackground }]}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}>
        {/* Logo Header */}
        <View style={styles.logoHeader}>
          <Logo size="md" color="#FFFFFF" showTagline />
        </View>

        {/* Feature Cards — 2x2 Grid */}
        <View style={styles.grid}>
          {FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.title}
              style={[
                styles.card,
                { backgroundColor: theme.cardBackground, width: cardSize, height: cardSize },
                Platform.OS === 'web' && styles.webTouchable,
              ]}
              activeOpacity={0.7}
              onPress={() => router.push(feature.route as any)}>
              <FontAwesome name={feature.icon} size={40} color={theme.cardIcon} />
              <Text style={[styles.cardTitle, { color: theme.cardText }]}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Scans Banner */}
        <View style={[styles.recentBanner, { backgroundColor: theme.cardBackground }]}>
          <FontAwesome name="clock-o" size={36} color={theme.cardIcon} />
          <Text style={[styles.recentBannerTitle, { color: theme.cardText }]}>Recent Scans</Text>
        </View>

        {/* Recent Scans Content */}
        {recentScans.length > 0 ? (
          recentScans.map((scan, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.recentCard, { backgroundColor: theme.cardBackground }, Platform.OS === 'web' && styles.webTouchable]}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/scan-result',
                params: { data: JSON.stringify(scan) },
              })}>
              <View
                style={[
                  styles.freshnessCircle,
                  { backgroundColor: getFreshnessColor(scan.freshness_score) },
                ]}>
                <Text style={styles.freshnessText}>{scan.freshness_score}</Text>
              </View>
              <View style={styles.recentInfo}>
                <Text style={[styles.recentName, { color: theme.cardText }]}>
                  {scan.item_name}
                </Text>
                <Text style={[styles.recentDesc, { color: theme.cardText + 'AA' }]}>
                  {scan.estimated_days_remaining}d remaining
                </Text>
              </View>
              {scan.carbon_footprint && (
                <Text style={[styles.carbonBadge, { color: theme.cardIcon }]}>
                  {scan.carbon_footprint.co2e_per_kg} kg
                </Text>
              )}
              <FontAwesome name="chevron-right" size={14} color={theme.cardText + '66'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
            <FontAwesome name="camera" size={24} color={theme.cardIcon} />
            <Text style={[styles.emptyText, { color: theme.cardText + 'AA' }]}>
              Scan your first item to see results here
            </Text>
          </View>
        )}
      </ScrollView>
    </WebContainer>
  );
}

function getFreshnessColor(score: number): string {
  if (score >= 8) return '#2D6A4F';
  if (score >= 6) return '#40916C';
  if (score >= 4) return '#F4A261';
  if (score >= 2) return '#E76F51';
  return '#DC2626';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PAD,
    gap: CARD_GAP,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  recentBanner: {
    marginHorizontal: HORIZONTAL_PAD,
    marginTop: CARD_GAP,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  recentBannerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: HORIZONTAL_PAD,
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
  },
  freshnessCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freshnessText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  recentInfo: { flex: 1, marginLeft: 12 },
  recentName: { fontSize: 15, fontWeight: '600' },
  recentDesc: { fontSize: 12, marginTop: 2 },
  carbonBadge: { fontSize: 12, fontWeight: '600' },
  emptyCard: {
    marginHorizontal: HORIZONTAL_PAD,
    marginTop: 10,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  webTouchable: Platform.select({
    web: { cursor: 'pointer' as any },
    default: {},
  }),
});
