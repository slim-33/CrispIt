import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getFridgeStats, deleteFromFridge } from '../services/storageService';
import { generateRecipe } from '../services/recipeService';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export default function FridgeScreen() {
  const [fridgeData, setFridgeData] = useState({
    all: [],
    fresh: [],
    expiringSoon: [],
    packaged: [],
    totalItems: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  useEffect(() => {
    loadFridge();
  }, []);

  const loadFridge = async () => {
    const data = await getFridgeStats();
    setFridgeData(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFridge();
    setRefreshing(false);
  };

  const handleDelete = async (item) => {
    Alert.alert(
      'Remove Item',
      `Remove ${item.name} from your fridge?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await deleteFromFridge(item.id);
            await loadFridge();
          },
        },
      ]
    );
  };

  const handleGenerateRecipe = async () => {
    if (fridgeData.expiringSoon.length === 0) return;

    setGeneratingRecipe(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const ingredients = fridgeData.expiringSoon.map(item => item.name);
      const recipe = await generateRecipe(ingredients);
      
      Alert.alert(
        '🍳 Recipe Suggestion',
        recipe,
        [{ text: 'Got it!', style: 'default' }],
        { cancelable: true }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate recipe. Please try again.');
    } finally {
      setGeneratingRecipe(false);
    }
  };

  const FridgeItem = ({ item }) => {
    const getStatusColor = () => {
      if (item.status === 'packaged') return COLORS.primary;
      return item.status === 'fresh' ? COLORS.fresh : COLORS.expiringSoon;
    };

    const getStatusIcon = () => {
      if (item.status === 'packaged') return 'cube';
      return item.status === 'fresh' ? 'checkmark-circle' : 'time';
    };

    const getStatusText = () => {
      if (item.status === 'packaged') return 'Packaged item';
      return `${item.remainingDays} ${item.remainingDays === 1 ? 'day' : 'days'} left`;
    };

    const getFreshnessColor = (score) => {
      if (score >= 90) return COLORS.fresh;
      if (score >= 75) return '#7CB342';
      if (score >= 55) return '#FFA726';
      if (score >= 35) return '#FF7043';
      return COLORS.error;
    };

    return (
      <View style={styles.itemCard}>
        {item.imageUri && (
          <Image source={{ uri: item.imageUri }} style={styles.itemImage} resizeMode="cover" />
        )}
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              {!item.isPackaged && item.freshnessScore != null && (
                <View style={[styles.freshnessBadge, { backgroundColor: `${getFreshnessColor(item.freshnessScore)}20` }]}>
                  <Ionicons name="leaf" size={12} color={getFreshnessColor(item.freshnessScore)} />
                  <Text style={[styles.freshnessScore, { color: getFreshnessColor(item.freshnessScore) }]}>
                    {item.freshnessScore}/100
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>

          <View style={styles.itemMeta}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
              <Ionicons name={getStatusIcon()} size={14} color={getStatusColor()} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {item.storageTip && (
            <Text style={styles.storageTip} numberOfLines={2}>
              💡 {item.storageTip}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Fridge</Text>
        <Text style={styles.headerSubtitle}>
          {fridgeData.totalItems} {fridgeData.totalItems === 1 ? 'item' : 'items'} stored
        </Text>
      </View>

      {/* Stats Cards */}
      {fridgeData.totalItems > 0 && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.freshCard]}>
            <Ionicons name="leaf" size={24} color={COLORS.fresh} />
            <Text style={styles.statNumber}>{fridgeData.fresh.length}</Text>
            <Text style={styles.statLabel}>Fresh (≥3 days)</Text>
          </View>
          <View style={[styles.statCard, styles.expiringCard]}>
            <Ionicons name="time" size={24} color={COLORS.expiringSoon} />
            <Text style={styles.statNumber}>{fridgeData.expiringSoon.length}</Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
          {fridgeData.packaged && fridgeData.packaged.length > 0 && (
            <View style={[styles.statCard, styles.packagedCard]}>
              <Ionicons name="cube" size={24} color={COLORS.primary} />
              <Text style={styles.statNumber}>{fridgeData.packaged.length}</Text>
              <Text style={styles.statLabel}>Packaged</Text>
            </View>
          )}
        </View>
      )}

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
        {fridgeData.totalItems === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="file-tray-outline" size={80} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Fridge is Empty</Text>
            <Text style={styles.emptyText}>
              Scan produce to add items to your fridge and track their freshness
            </Text>
          </View>
        ) : (
          <>
            {fridgeData.expiringSoon.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="alert-circle" size={20} color={COLORS.expiringSoon} />
                    <Text style={styles.sectionTitle}>Expiring Soon</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.recipeButton}
                    onPress={handleGenerateRecipe}
                    disabled={generatingRecipe}
                  >
                    <Ionicons 
                      name="restaurant" 
                      size={16} 
                      color={COLORS.primary} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.recipeButtonText}>
                      {generatingRecipe ? 'Generating...' : 'Get Recipe'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {fridgeData.expiringSoon.map((item) => (
                  <FridgeItem key={item.id} item={item} />
                ))}
              </View>
            )}

            {fridgeData.fresh.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.fresh} />
                  <Text style={styles.sectionTitle}>Still Fresh</Text>
                </View>
                {fridgeData.fresh.map((item) => (
                  <FridgeItem key={item.id} item={item} />
                ))}
              </View>
            )}

            {fridgeData.packaged && fridgeData.packaged.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="cube" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Packaged Items</Text>
                </View>
                {fridgeData.packaged.map((item) => (
                  <FridgeItem key={item.id} item={item} />
                ))}
              </View>
            )}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  freshCard: {
    backgroundColor: `${COLORS.fresh}15`,
    borderColor: `${COLORS.fresh}30`,
  },
  expiringCard: {
    backgroundColor: `${COLORS.expiringSoon}15`,
    borderColor: `${COLORS.expiringSoon}30`,
  },
  packagedCard: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: `${COLORS.primary}30`,
  },
  statNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  recipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  recipeButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.backgroundTertiary,
  },
  itemContent: {
    padding: SPACING.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  itemHeaderLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  freshnessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  freshnessScore: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  deleteButton: {
    padding: 4,
  },
  itemMeta: {
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  storageTip: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    width: 160,
    height: 160,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xl,
    lineHeight: 22,
  },
});
