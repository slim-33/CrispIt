import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPokedex, getUniqueProduceCount } from '../services/storageService';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export default function PokedexScreen() {
  const [pokedex, setPokedex] = useState([]);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPokedex();
  }, []);

  const loadPokedex = async () => {
    const data = await getPokedex();
    const count = await getUniqueProduceCount();
    setPokedex(data);
    setUniqueCount(count);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPokedex();
    setRefreshing(false);
  };

  const getFreshnessColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'excellent':
        return COLORS.excellent;
      case 'good':
        return COLORS.good;
      case 'fair':
        return COLORS.fair;
      default:
        return COLORS.poor;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardImageContainer}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={32} color={COLORS.textTertiary} />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: `${getFreshnessColor(item.freshnessLevel)}15` }]}>
            <Text style={[styles.scoreText, { color: getFreshnessColor(item.freshnessLevel) }]}>
              {item.freshnessScore}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.cardDate}>{formatDate(item.discoveredAt)}</Text>
          </View>
          {item.carbonFootprint !== undefined && (
            <View style={styles.cardMeta}>
              <Ionicons name="leaf-outline" size={14} color={COLORS.primary} />
              <Text style={styles.cardCO2}>{item.carbonFootprint.toFixed(2)} kg</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="grid-outline" size={80} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Scans Yet</Text>
      <Text style={styles.emptyText}>
        Start scanning produce to build your collection and track your sustainable choices
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Collection</Text>
          <Text style={styles.headerSubtitle}>{pokedex.length} scans • {uniqueCount} unique items</Text>
        </View>
      </View>

      <FlatList
        data={pokedex}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    margin: SPACING.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundTertiary,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  scoreText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginLeft: 4,
    fontWeight: FONT_WEIGHTS.medium,
  },
  cardCO2: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: FONT_WEIGHTS.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
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
    lineHeight: 22,
  },
});
