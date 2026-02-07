import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { addFridgeItem } from '@/lib/api';
import VoiceButton from '@/components/shared/VoiceButton';
import FreshnessGauge from '@/components/scan/FreshnessGauge';
import type { ScanResult, BarcodeProduct } from '@/lib/types';

const { width } = Dimensions.get('window');

export default function ScanResultScreen() {
  const params = useLocalSearchParams<{ data?: string; barcode?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [savingToFridge, setSavingToFridge] = useState(false);
  const [savedToFridge, setSavedToFridge] = useState(false);

  const scanResult: ScanResult | null = params.data ? JSON.parse(params.data) : null;
  const barcodeProduct: BarcodeProduct | null = params.barcode ? JSON.parse(params.barcode) : null;

  async function handleSaveToFridge() {
    if (!scanResult || savingToFridge || savedToFridge) return;
    setSavingToFridge(true);

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + scanResult.estimated_days_remaining);

      await addFridgeItem({
        item_name: scanResult.item_name,
        category: scanResult.category,
        added_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        freshness_score: scanResult.freshness_score,
        quantity: 1,
        unit: 'item',
      });

      setSavedToFridge(true);
      Alert.alert('Saved!', `${scanResult.item_name} added to your fridge tracker.`);
    } catch {
      Alert.alert('Error', 'Could not save to fridge.');
    } finally {
      setSavingToFridge(false);
    }
  }

  function getVoiceText(): string {
    if (!scanResult) return '';
    const carbon = scanResult.carbon_footprint;
    let text = `Your ${scanResult.item_name} has a freshness score of ${scanResult.freshness_score} out of 10. `;
    text += `${scanResult.freshness_description}. `;
    text += `It should last about ${scanResult.estimated_days_remaining} days. `;
    if (carbon) {
      text += `Its carbon footprint is ${carbon.co2e_per_kg} kilograms of CO2 per kilogram. ${carbon.comparison}. `;
    }
    if (scanResult.sustainable_alternative) {
      text += `Consider trying ${scanResult.sustainable_alternative.name} instead. ${scanResult.sustainable_alternative.reason}.`;
    }
    return text;
  }

  // Barcode Product View
  if (barcodeProduct) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <FontAwesome name="barcode" size={40} color="#FFFFFF" />
          <Text style={styles.headerTitle}>{barcodeProduct.name}</Text>
          <Text style={styles.headerSubtitle}>{barcodeProduct.brand}</Text>
        </View>

        {/* Scores */}
        <View style={styles.scoresRow}>
          <View style={[styles.scoreCard, { backgroundColor: getEcoScoreColor(barcodeProduct.eco_score) }]}>
            <Text style={styles.scoreLabel}>Eco-Score</Text>
            <Text style={styles.scoreValue}>{barcodeProduct.eco_score.toUpperCase()}</Text>
          </View>
          <View style={[styles.scoreCard, { backgroundColor: getNutriScoreColor(barcodeProduct.nutri_score) }]}>
            <Text style={styles.scoreLabel}>Nutri-Score</Text>
            <Text style={styles.scoreValue}>{barcodeProduct.nutri_score.toUpperCase()}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: theme.surface }]}>
          <DetailRow icon="map-marker" label="Origin" value={barcodeProduct.origin} theme={theme} />
          <DetailRow icon="archive" label="Packaging" value={barcodeProduct.packaging} theme={theme} />
          <DetailRow icon="tags" label="Categories" value={barcodeProduct.categories} theme={theme} />
          <DetailRow icon="list" label="Ingredients" value={barcodeProduct.ingredients} theme={theme} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // Freshness Scan View
  if (!scanResult) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[{ color: theme.text }]}>No scan data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Freshness Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerEmoji}>
          {scanResult.category === 'fruit' ? '🍎' : scanResult.category === 'vegetable' ? '🥬' : '🛒'}
        </Text>
        <Text style={styles.headerTitle}>{scanResult.item_name}</Text>
        <Text style={styles.headerSubtitle}>{scanResult.category}</Text>
        <VoiceButton text={getVoiceText()} />
      </View>

      {/* Freshness Gauge */}
      <View style={[styles.gaugeContainer, { backgroundColor: theme.surface }]}>
        <FreshnessGauge score={scanResult.freshness_score} />
        <Text style={[styles.freshnessDesc, { color: theme.text }]}>
          {scanResult.freshness_description}
        </Text>
        <View style={styles.daysRow}>
          <FontAwesome name="clock-o" size={16} color={theme.primary} />
          <Text style={[styles.daysText, { color: theme.primary }]}>
            ~{scanResult.estimated_days_remaining} days remaining
          </Text>
        </View>
      </View>

      {/* Visual Indicators */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Visual Indicators</Text>
        {scanResult.visual_indicators.map((indicator, i) => (
          <View key={i} style={styles.indicatorRow}>
            <FontAwesome name="eye" size={14} color={theme.primary} />
            <Text style={[styles.indicatorText, { color: theme.text }]}>{indicator}</Text>
          </View>
        ))}
      </View>

      {/* Carbon Footprint */}
      {scanResult.carbon_footprint && (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Carbon Footprint</Text>
          <View style={styles.carbonMain}>
            <Text style={[styles.carbonValue, { color: theme.primary }]}>
              {scanResult.carbon_footprint.co2e_per_kg}
            </Text>
            <Text style={[styles.carbonUnit, { color: theme.textSecondary }]}>kg CO₂e/kg</Text>
          </View>
          <Text style={[styles.carbonComparison, { color: theme.textSecondary }]}>
            {scanResult.carbon_footprint.comparison}
          </Text>
        </View>
      )}

      {/* Swap It Card */}
      {scanResult.sustainable_alternative && (
        <View style={[styles.swapCard, { backgroundColor: '#D8F3DC' }]}>
          <View style={styles.swapHeader}>
            <FontAwesome name="exchange" size={20} color="#2D6A4F" />
            <Text style={styles.swapTitle}>Swap It!</Text>
          </View>
          <Text style={styles.swapName}>{scanResult.sustainable_alternative.name}</Text>
          <Text style={styles.swapReason}>{scanResult.sustainable_alternative.reason}</Text>
          <View style={styles.swapSaving}>
            <FontAwesome name="leaf" size={14} color="#2D6A4F" />
            <Text style={styles.swapSavingText}>
              {scanResult.sustainable_alternative.carbon_savings_percent}% less carbon
            </Text>
          </View>
        </View>
      )}

      {/* Storage Tips */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Storage Tips</Text>
        {scanResult.storage_tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipNumber}>{i + 1}</Text>
            <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Save to Fridge Button */}
      <TouchableOpacity
        style={[
          styles.fridgeButton,
          { backgroundColor: savedToFridge ? '#95D5B2' : theme.primary },
        ]}
        onPress={handleSaveToFridge}
        disabled={savingToFridge || savedToFridge}>
        <FontAwesome
          name={savedToFridge ? 'check' : 'snowflake-o'}
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.fridgeButtonText}>
          {savedToFridge
            ? 'Saved to Fridge!'
            : savingToFridge
              ? 'Saving...'
              : 'Save to Fridge'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, theme }: any) {
  return (
    <View style={styles.detailRow}>
      <FontAwesome name={icon} size={16} color={theme.primary} />
      <View style={styles.detailInfo}>
        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.text }]}>{value || 'Unknown'}</Text>
      </View>
    </View>
  );
}

function getEcoScoreColor(score: string): string {
  const colors: Record<string, string> = {
    a: '#2D6A4F', b: '#40916C', c: '#F4A261', d: '#E76F51', e: '#DC2626',
  };
  return colors[score.toLowerCase()] || '#9CA3AF';
}

function getNutriScoreColor(score: string): string {
  const colors: Record<string, string> = {
    a: '#2D6A4F', b: '#52B788', c: '#F4A261', d: '#E76F51', e: '#DC2626',
  };
  return colors[score.toLowerCase()] || '#9CA3AF';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerEmoji: { fontSize: 48 },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D8F3DC',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  gaugeContainer: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  freshnessDesc: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  daysText: { fontSize: 15, fontWeight: '700' },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  indicatorText: { fontSize: 14, flex: 1, lineHeight: 20 },
  carbonMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  carbonValue: { fontSize: 36, fontWeight: '900' },
  carbonUnit: { fontSize: 16 },
  carbonComparison: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  swapCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
  },
  swapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  swapTitle: { fontSize: 18, fontWeight: '800', color: '#2D6A4F' },
  swapName: { fontSize: 20, fontWeight: '700', color: '#1B4332' },
  swapReason: { fontSize: 14, color: '#2D6A4F', marginTop: 4, lineHeight: 20 },
  swapSaving: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  swapSavingText: { fontSize: 14, fontWeight: '700', color: '#2D6A4F' },
  tipRow: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D8F3DC',
    color: '#2D6A4F',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '700',
    fontSize: 13,
    overflow: 'hidden',
  },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20 },
  fridgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  fridgeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  scoresRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  scoreLabel: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  scoreValue: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
  detailCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: 12, fontWeight: '600' },
  detailValue: { fontSize: 14, marginTop: 2, lineHeight: 20 },
});
