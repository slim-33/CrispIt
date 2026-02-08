import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getStats, getUniqueProduceCount, clearAllData } from '../services/storageService';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalScans: 0,
    totalCarbonSaved: 0,
    averageFreshness: 0,
    lastScanDate: null,
  });
  const [uniqueCount, setUniqueCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getStats();
    const count = await getUniqueProduceCount();
    setStats(data);
    setUniqueCount(count);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all scanned items, collection, fridge items, chat history, and statistics. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const success = await clearAllData();
            if (success) {
              await loadStats();
              Alert.alert('Success', 'All data has been cleared.');
            } else {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const StatCard = ({ icon, label, value, unit, color, iconBg }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statValueContainer}>
          <Text style={styles.statValue}>{value}</Text>
          {unit && <Text style={styles.statUnit}>{unit}</Text>}
        </View>
      </View>
    </View>
  );

  const InfoCard = ({ icon, title, description }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Impact</Text>
        <Text style={styles.headerSubtitle}>Your sustainability journey</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="scan-outline"
            label="Total Scans"
            value={stats.totalScans}
            color={COLORS.primary}
            iconBg={`${COLORS.primary}15`}
          />
          <StatCard
            icon="leaf-outline"
            label="Unique Items"
            value={uniqueCount}
            color={COLORS.success}
            iconBg={`${COLORS.success}15`}
          />
        </View>

        {/* Featured Stats */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredHeader}>
            <Ionicons name="trending-up" size={20} color={COLORS.primary} />
            <Text style={styles.featuredTitle}>Average Freshness</Text>
          </View>
          <View style={styles.featuredValueContainer}>
            <Text style={styles.featuredValue}>
              {stats.averageFreshness ? stats.averageFreshness.toFixed(1) : '0'}
            </Text>
            <Text style={styles.featuredUnit}>/100</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${stats.averageFreshness || 0}%`,
                    backgroundColor: COLORS.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Carbon Receipt Button */}
        <TouchableOpacity 
          style={styles.carbonCard}
          onPress={() => navigation.navigate('CarbonReceipt')}
          activeOpacity={0.7}
        >
          <Text style={styles.carbonButtonText}>View Your Fridge Carbon Receipt</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sustainability Tips</Text>
          
          <InfoCard
            icon="cart-outline"
            title="Buy Local & Seasonal"
            description="Choose produce that's in season and locally grown to reduce your carbon footprint by up to 80%"
          />
          
          <InfoCard
            icon="time-outline"
            title="Plan Your Shopping"
            description="Create a list before shopping and scan items to ensure freshness, reducing food waste"
          />
          
          <InfoCard
            icon="leaf"
            title="Choose Sustainable Options"
            description="Look for alternatives with lower environmental impact when possible"
          />
        </View>

        {/* Clear Data Button */}
        <TouchableOpacity 
          style={styles.clearDataButton}
          onPress={handleClearData}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          <Text style={styles.clearDataText}>Clear All Data</Text>
        </TouchableOpacity>

        {stats.lastScanDate && (
          <Text style={styles.lastScanText}>
            Last scan: {new Date(stats.lastScanDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statContent: {
    // Container for label and value
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: 4,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  statUnit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: FONT_WEIGHTS.medium,
  },
  featuredCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featuredTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  featuredValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  featuredValue: {
    fontSize: 42,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  featuredUnit: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: FONT_WEIGHTS.medium,
  },
  progressBarContainer: {
    marginTop: SPACING.xs,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  carbonCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.md,
  },
  carbonButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  lastScanText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  clearDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  clearDataText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
});
