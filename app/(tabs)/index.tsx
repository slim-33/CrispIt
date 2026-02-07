import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getUserStats, getScanHistory } from '@/lib/api';
import type { UserStats, ScanResult } from '@/lib/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [s, scans] = await Promise.all([getUserStats(), getScanHistory()]);
      setStats(s);
      setRecentScans(scans.slice(0, 3));
    } catch {
      // Will show default state
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Hero Section */}
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <Text style={styles.heroEmoji}>🥬</Text>
        <Text style={styles.heroTitle}>LunchBox</Text>
        <Text style={styles.heroSubtitle}>
          Smart grocery sustainability at your fingertips
        </Text>
        <TouchableOpacity
          style={styles.heroButton}
          onPress={() => router.push('/(tabs)/scan')}>
          <FontAwesome name="camera" size={20} color="#2D6A4F" />
          <Text style={styles.heroButtonText}>Scan Produce</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <FontAwesome name="leaf" size={24} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {stats?.total_carbon_saved?.toFixed(1) || '0.0'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>kg CO₂ Saved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <FontAwesome name="camera" size={24} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {stats?.total_scans || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Items Scanned</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <FontAwesome name="fire" size={24} color={theme.warning} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {stats?.current_streak || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Day Streak</Text>
        </View>
      </View>

      {/* Feature Cards */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Features</Text>
      <View style={styles.featureGrid}>
        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: '#D8F3DC' }]}
          onPress={() => router.push('/(tabs)/scan')}>
          <FontAwesome name="camera" size={32} color="#2D6A4F" />
          <Text style={styles.featureTitle}>Freshness Scanner</Text>
          <Text style={styles.featureDesc}>AI-powered produce freshness analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: '#FEF3C7' }]}
          onPress={() => router.push('/(tabs)/dashboard')}>
          <FontAwesome name="bar-chart" size={32} color="#92400E" />
          <Text style={styles.featureTitle}>Carbon Dashboard</Text>
          <Text style={styles.featureDesc}>Track your sustainability impact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: '#DBEAFE' }]}
          onPress={() => router.push('/(tabs)/fridge')}>
          <FontAwesome name="snowflake-o" size={32} color="#1E40AF" />
          <Text style={styles.featureTitle}>Fridge Tracker</Text>
          <Text style={styles.featureDesc}>Monitor expiry dates & reduce waste</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: '#FCE7F3' }]}
          onPress={() => router.push('/(tabs)/scan')}>
          <FontAwesome name="barcode" size={32} color="#9D174D" />
          <Text style={styles.featureTitle}>Barcode Scanner</Text>
          <Text style={styles.featureDesc}>Eco-Score & Nutri-Score lookup</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Scans</Text>
          {recentScans.map((scan, i) => (
            <View key={i} style={[styles.recentScanCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.freshnessCircle, { backgroundColor: getFreshnessColor(scan.freshness_score) }]}>
                <Text style={styles.freshnessText}>{scan.freshness_score}</Text>
              </View>
              <View style={styles.recentScanInfo}>
                <Text style={[styles.recentScanName, { color: theme.text }]}>{scan.item_name}</Text>
                <Text style={[styles.recentScanDesc, { color: theme.textSecondary }]}>
                  {scan.freshness_description}
                </Text>
              </View>
              {scan.carbon_footprint && (
                <Text style={[styles.carbonBadge, { color: theme.primary }]}>
                  {scan.carbon_footprint.co2e_per_kg} kg CO₂
                </Text>
              )}
            </View>
          ))}
        </>
      )}

      {/* Impact Quote */}
      <View style={[styles.impactCard, { backgroundColor: theme.accent }]}>
        <FontAwesome name="lightbulb-o" size={24} color={theme.primary} />
        <Text style={[styles.impactText, { color: theme.primary }]}>
          The average household wastes 300 lbs of food per year. One scan at a time, we can change that.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  hero: {
    padding: 32,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#D8F3DC',
    marginTop: 4,
    textAlign: 'center',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 20,
    gap: 10,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D6A4F',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  featureCard: {
    width: (width - 40) / 2,
    padding: 20,
    borderRadius: 16,
    gap: 8,
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  featureDesc: { fontSize: 12, color: '#4B5563' },
  recentScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  freshnessCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freshnessText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  recentScanInfo: { flex: 1, marginLeft: 12 },
  recentScanName: { fontSize: 15, fontWeight: '600' },
  recentScanDesc: { fontSize: 12, marginTop: 2 },
  carbonBadge: { fontSize: 12, fontWeight: '600' },
  impactCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  impactText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
});
