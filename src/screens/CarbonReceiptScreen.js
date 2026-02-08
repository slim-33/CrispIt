import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFridge } from '../services/storageService';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

export default function CarbonReceiptScreen({ navigation }) {
  const [fridgeItems, setFridgeItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCarbon, setTotalCarbon] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const items = await getFridge();
    setFridgeItems(items);
    
    const total = items.reduce((sum, item) => sum + (item.carbonFootprint || 0), 0);
    setTotalCarbon(total);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const CarbonItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCarbon}>
          {item.carbonFootprint ? item.carbonFootprint.toFixed(2) : '0.00'} kg
        </Text>
      </View>
      {item.sustainableAlternative && (
        <View style={styles.alternativeBox}>
          <Ionicons name="leaf-outline" size={14} color={COLORS.primary} />
          <Text style={styles.alternativeText}>{item.sustainableAlternative}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={COLORS.textPrimary}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Carbon Receipt</Text>
            <Text style={styles.headerSubtitle}>Your fridge's carbon footprint</Text>
          </View>
        </View>
      </View>

      {/* Total Carbon Card */}
      <View style={styles.totalCard}>
        <View style={styles.totalIcon}>
          <Ionicons name="earth" size={32} color={COLORS.white} />
        </View>
        <View style={styles.totalContent}>
          <Text style={styles.totalLabel}>Total Carbon Footprint</Text>
          <Text style={styles.totalValue}>{totalCarbon.toFixed(2)} kg CO₂e</Text>
          <Text style={styles.totalSubtext}>
            from {fridgeItems.length} {fridgeItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {fridgeItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="leaf-outline" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Items Yet</Text>
            <Text style={styles.emptyText}>
              Add items to your fridge to track their carbon footprint
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Items Breakdown</Text>
            {fridgeItems.map((item) => (
              <CarbonItem key={item.id} item={item} />
            ))}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Carbon footprint values are estimates based on typical production and transportation. 
                Choose sustainable alternatives to reduce your environmental impact.
              </Text>
            </View>
          </>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  totalCard: {
    margin: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalIcon: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  totalContent: {
    flex: 1,
  },
  totalLabel: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: 2,
  },
  totalSubtext: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  itemCarbon: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  alternativeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  alternativeText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 22,
  },
});
