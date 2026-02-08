import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

export const FreshnessIndicator = ({ score, level }) => {
  const getColor = () => {
    if (score >= 80) return COLORS.excellent;
    if (score >= 60) return COLORS.good;
    if (score >= 40) return COLORS.fair;
    return COLORS.poor;
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const color = getColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Freshness Score</Text>
        <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
          <Text style={[styles.badgeText, { color }]}>{getLabel()}</Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color }]}>{score}</Text>
        <Text style={styles.outOf}>/100</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${score}%`,
                backgroundColor: color
              }
            ]} 
          />
        </View>
      </View>
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
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  score: {
    fontSize: 48,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: 52,
  },
  outOf: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textTertiary,
    marginLeft: 4,
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
});
