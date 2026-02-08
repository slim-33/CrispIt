import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getUserStats, getScanHistory } from '@/lib/api';
import { useResponsive } from '@/hooks/useResponsive';
import WebContainer from '@/components/WebContainer';
import type { UserStats, ScanResult } from '@/lib/types';

const monoFont = Platform.select({ ios: 'Courier', android: 'monospace', web: 'monospace', default: 'monospace' });

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { width } = useResponsive();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const chartWidth = Math.min(width, 480) - 64;
  const statWidth = (Math.min(width, 480) - 40) / 2;
  const badgeWidth = (Math.min(width, 480) - 72) / 3;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [s, scans] = await Promise.all([getUserStats(), getScanHistory()]);
      setStats(s);
      setRecentScans(scans);
    } catch {
      // Show empty state
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const weeklyLabels = stats?.weekly_carbon?.map(w => {
    const d = new Date(w.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weeklyData = stats?.weekly_carbon?.map(w => w.co2e) || [0, 0, 0, 0, 0, 0, 0];

  const categoryMap: Record<string, number> = {};
  recentScans.forEach(scan => {
    const cat = scan.category || 'other';
    categoryMap[cat] = (categoryMap[cat] || 0) + (scan.carbon_footprint?.co2e_per_kg || 0);
  });

  const pieColors = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#D8F3DC'];
  const pieData = Object.entries(categoryMap).slice(0, 6).map(([name, value], i) => ({
    name,
    value: +value.toFixed(1),
    color: pieColors[i % pieColors.length],
    legendFontColor: theme.text,
    legendFontSize: 12,
  }));

  const sustainScore = stats?.sustainability_score || 50;

  return (
    <WebContainer>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* Sustainability Score */}
        <View style={[styles.scoreCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.scoreLabel}>Sustainability Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{sustainScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <Text style={styles.scoreDesc}>
            {sustainScore >= 80
              ? 'Eco Warrior! Amazing job!'
              : sustainScore >= 60
                ? 'Great progress! Keep scanning!'
                : 'Getting started - every scan counts!'}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.miniStat, { backgroundColor: theme.surface, width: statWidth }]}>
            <FontAwesome name="leaf" size={20} color={theme.primary} />
            <Text style={[styles.miniStatValue, { color: theme.text }]}>
              {stats?.total_carbon_saved?.toFixed(1) || '0.0'} kg
            </Text>
            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>CO₂ Saved</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: theme.surface, width: statWidth }]}>
            <FontAwesome name="camera" size={20} color={theme.primary} />
            <Text style={[styles.miniStatValue, { color: theme.text }]}>
              {stats?.total_scans || 0}
            </Text>
            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Total Scans</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: theme.surface, width: statWidth }]}>
            <FontAwesome name="fire" size={20} color={theme.warning} />
            <Text style={[styles.miniStatValue, { color: theme.text }]}>
              {stats?.current_streak || 0}
            </Text>
            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Day Streak</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: theme.surface, width: statWidth }]}>
            <FontAwesome name="trophy" size={20} color="#F4A261" />
            <Text style={[styles.miniStatValue, { color: theme.text }]}>
              {stats?.best_streak || 0}
            </Text>
            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Best Streak</Text>
          </View>
        </View>

        {/* Weekly Carbon Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Weekly Carbon Footprint</Text>
          <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>kg CO₂e per day</Text>
          <LineChart
            data={{
              labels: weeklyLabels.length > 0 ? weeklyLabels : ['No data'],
              datasets: [{ data: weeklyData.length > 0 ? weeklyData : [0] }],
            }}
            width={chartWidth}
            height={200}
            chartConfig={{
              backgroundColor: theme.surface,
              backgroundGradientFrom: theme.surface,
              backgroundGradientTo: theme.surface,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(45, 106, 79, ${opacity})`,
              labelColor: () => theme.textSecondary,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#2D6A4F',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Category Breakdown */}
        {pieData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Carbon by Category</Text>
            <PieChart
              data={pieData}
              width={chartWidth}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </View>
        )}

        {/* Carbon Receipt */}
        {recentScans.length > 0 && (
          <View style={[styles.receiptCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.receiptTitle, { color: theme.text }]}>
              -------- CARBON RECEIPT --------
            </Text>
            <Text style={[styles.receiptDate, { color: theme.textSecondary }]}>
              Recent Scans Summary
            </Text>
            {recentScans.slice(0, 8).map((scan, i) => (
              <View key={i} style={styles.receiptRow}>
                <Text style={[styles.receiptItem, { color: theme.text }]}>{scan.item_name}</Text>
                <Text style={[styles.receiptValue, { color: theme.text }]}>
                  {scan.carbon_footprint?.co2e_per_kg?.toFixed(1) || '?'} kg
                </Text>
              </View>
            ))}
            <View style={[styles.receiptDivider, { borderColor: theme.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptTotal, { color: theme.primary }]}>TOTAL CO₂</Text>
              <Text style={[styles.receiptTotal, { color: theme.primary }]}>
                {recentScans
                  .slice(0, 8)
                  .reduce((sum, s) => sum + (s.carbon_footprint?.co2e_per_kg || 0), 0)
                  .toFixed(1)} kg
              </Text>
            </View>
            <Text style={[styles.receiptFooter, { color: theme.textSecondary }]}>
              --------------------------------
            </Text>
            <Text style={[styles.receiptFooter, { color: theme.textSecondary }]}>
              Thank you for being sustainable!
            </Text>
          </View>
        )}

        {/* Badges */}
        <View style={[styles.badgesCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Achievements</Text>
          <View style={styles.badgesGrid}>
            {(stats?.badges || []).map((badge, i) => (
              <View
                key={i}
                style={[
                  styles.badge,
                  { backgroundColor: badge.earned ? theme.accent : theme.background, width: badgeWidth },
                  !badge.earned && { opacity: 0.4 },
                ]}>
                <FontAwesome
                  name={badge.icon as any}
                  size={24}
                  color={badge.earned ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[styles.badgeName, { color: badge.earned ? theme.text : theme.textSecondary }]}>
                  {badge.name}
                </Text>
                <Text style={[styles.badgeDesc, { color: theme.textSecondary }]}>
                  {badge.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scoreCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  scoreLabel: { fontSize: 14, color: '#D8F3DC', fontWeight: '600' },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  scoreNumber: { fontSize: 64, fontWeight: '900', color: '#FFFFFF' },
  scoreMax: { fontSize: 24, color: '#D8F3DC', fontWeight: '600' },
  scoreDesc: { fontSize: 14, color: '#D8F3DC', textAlign: 'center' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  miniStat: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  miniStatValue: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  miniStatLabel: { fontSize: 12, marginTop: 2 },
  chartCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: { fontSize: 18, fontWeight: '700' },
  chartSubtitle: { fontSize: 12, marginTop: 2, marginBottom: 12 },
  chart: { borderRadius: 16, marginTop: 8 },
  receiptCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptTitle: {
    fontSize: 14,
    fontFamily: monoFont,
    textAlign: 'center',
    fontWeight: '700',
  },
  receiptDate: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: monoFont,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptItem: {
    fontSize: 14,
    fontFamily: monoFont,
  },
  receiptValue: {
    fontSize: 14,
    fontFamily: monoFont,
  },
  receiptDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  receiptTotal: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: monoFont,
  },
  receiptFooter: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: monoFont,
    marginTop: 4,
  },
  badgesCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  badge: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  badgeName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  badgeDesc: { fontSize: 9, textAlign: 'center' },
});
