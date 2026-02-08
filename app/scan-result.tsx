import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { addFridgeItem } from '@/lib/api';
import VoiceButton from '@/components/shared/VoiceButton';
import FreshnessGauge from '@/components/scan/FreshnessGauge';
import WebContainer from '@/components/WebContainer';
import type { ScanResult, BarcodeProduct, BarcodeCarbonFootprint } from '@/lib/types';

export default function ScanResultScreen() {
  const params = useLocalSearchParams<{ data?: string; barcode?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [savingToFridge, setSavingToFridge] = useState(false);
  const [savedToFridge, setSavedToFridge] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('items');

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
        quantity,
        unit,
      });

      setSavedToFridge(true);
      Alert.alert('Saved!', `${scanResult.item_name} added to your fridge tracker.`, [
        { text: 'OK' },
        { text: 'Go to Fridge', onPress: () => router.push('/(tabs)/fridge') },
      ]);
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
      <WebContainer>
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

          {/* Carbon Footprint Breakdown */}
          {barcodeProduct.carbon_footprint && barcodeProduct.carbon_footprint.co2_total != null && (
            <CarbonBreakdownCard carbon={barcodeProduct.carbon_footprint} theme={theme} />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </WebContainer>
    );
  }

  // Freshness Scan View
  if (!scanResult) {
    return (
      <WebContainer>
        <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
          <Text style={[{ color: theme.text }]}>No scan data available</Text>
        </View>
      </WebContainer>
    );
  }

  return (
    <WebContainer>
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
      {scanResult.visual_indicators && scanResult.visual_indicators.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Visual Indicators</Text>
          {scanResult.visual_indicators.map((indicator, i) => (
            <View key={i} style={styles.indicatorRow}>
              <FontAwesome name="eye" size={14} color={theme.primary} />
              <Text style={[styles.indicatorText, { color: theme.text }]}>{indicator}</Text>
            </View>
          ))}
        </View>
      )}

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
      {scanResult.storage_tips && scanResult.storage_tips.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Storage Tips</Text>
          {scanResult.storage_tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipNumber}>{i + 1}</Text>
              <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quantity & Unit Editor */}
      {!savedToFridge && (
        <View style={[styles.quantityEditor, { backgroundColor: theme.surface }]}>
          <Text style={[styles.quantityLabel, { color: theme.text }]}>Quantity to save</Text>
          <View style={styles.quantityRow}>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: theme.primary }]}
                onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                <FontAwesome name="minus" size={14} color="#FFF" />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: theme.text }]}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: theme.primary }]}
                onPress={() => setQuantity(q => q + 1)}>
                <FontAwesome name="plus" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.unitPicker}>
              {['items', 'kg', 'g', 'lbs', 'bag'].map(u => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitChip,
                    { borderColor: theme.primary },
                    unit === u && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setUnit(u)}>
                  <Text style={[
                    styles.unitChipText,
                    { color: unit === u ? '#FFF' : theme.primary },
                  ]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Save to Fridge Button */}
      <TouchableOpacity
        style={[
          styles.fridgeButton,
          { backgroundColor: savedToFridge ? '#95D5B2' : theme.primary },
          Platform.OS === 'web' && styles.webTouchable,
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
    </WebContainer>
  );
}

const BREAKDOWN_ITEMS: { key: keyof BarcodeCarbonFootprint; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { key: 'co2_agriculture', label: 'Agriculture', icon: 'pagelines' },
  { key: 'co2_processing', label: 'Processing', icon: 'industry' },
  { key: 'co2_packaging', label: 'Packaging', icon: 'cube' },
  { key: 'co2_transportation', label: 'Transport', icon: 'truck' },
  { key: 'co2_distribution', label: 'Distribution', icon: 'shopping-cart' },
  { key: 'co2_consumption', label: 'Consumption', icon: 'cutlery' },
];

function CarbonBreakdownCard({ carbon, theme }: { carbon: BarcodeCarbonFootprint; theme: any }) {
  const total = carbon.co2_total ?? 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Carbon Footprint</Text>

      {/* Total */}
      <View style={styles.carbonMain}>
        <Text style={[styles.carbonValue, { color: theme.primary }]}>
          {total.toFixed(2)}
        </Text>
        <Text style={[styles.carbonUnit, { color: theme.textSecondary }]}>kg CO₂e / kg</Text>
      </View>

      {/* Lifecycle breakdown */}
      <View style={barcodeStyles.breakdownList}>
        {BREAKDOWN_ITEMS.map(({ key, label, icon }) => {
          const val = carbon[key];
          if (val == null || val === 0) return null;
          const pct = total > 0 ? (val / total) * 100 : 0;
          return (
            <View key={key} style={barcodeStyles.breakdownRow}>
              <FontAwesome name={icon} size={14} color={theme.primary} style={{ width: 20 }} />
              <Text style={[barcodeStyles.breakdownLabel, { color: theme.text }]}>{label}</Text>
              <View style={barcodeStyles.barTrack}>
                <View
                  style={[
                    barcodeStyles.barFill,
                    { width: `${Math.max(pct, 2)}%`, backgroundColor: theme.primary },
                  ]}
                />
              </View>
              <Text style={[barcodeStyles.breakdownValue, { color: theme.textSecondary }]}>
                {val.toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Context */}
      <View style={barcodeStyles.context}>
        <FontAwesome name="car" size={13} color={theme.textSecondary} />
        <Text style={[barcodeStyles.contextText, { color: theme.textSecondary }]}>
          Equivalent to driving ~{(total * 6).toFixed(1)} km
        </Text>
      </View>
    </View>
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
  quantityEditor: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 20, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  unitPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  unitChip: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  unitChipText: { fontSize: 12, fontWeight: '600' },
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
  webTouchable: Platform.select({
    web: { cursor: 'pointer' as any },
    default: {},
  }),
});

const barcodeStyles = StyleSheet.create({
  breakdownList: {
    marginTop: 16,
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    width: 90,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  contextText: {
    fontSize: 13,
  },
});
