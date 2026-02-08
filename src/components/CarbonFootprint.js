import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

export const CarbonFootprint = ({ value, alternatives }) => {
  if (!value) return null;

  const getImpactLevel = () => {
    if (value < 0.5) return { level: 'Low', color: COLORS.excellent };
    if (value < 2.0) return { level: 'Medium', color: COLORS.fair };
    return { level: 'High', color: COLORS.poor };
  };

  const impact = getImpactLevel();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="leaf-outline" size={20} color={COLORS.primary} />
          <Text style={styles.title}>Environmental Impact</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${impact.color}15` }]}>
          <Text style={[styles.badgeText, { color: impact.color }]}>{impact.level}</Text>
        </View>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value.toFixed(2)}</Text>
        <Text style={styles.unit}>kg CO₂e</Text>
      </View>

      {alternatives && alternatives.length > 0 && (
        <View style={styles.alternativesContainer}>
          <Text style={styles.alternativesTitle}>Sustainable Alternatives</Text>
          {alternatives.map((alt, index) => (
            <View key={index} style={styles.alternativeItem}>
              <View style={styles.alternativeDot} />
              <Text style={styles.alternativeText}>{alt}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.lg,
  },
  value: {
    fontSize: 42,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  unit: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  alternativesContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  alternativesTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  alternativeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    marginRight: SPACING.sm,
  },
  alternativeText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
