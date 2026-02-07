import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getFridgeItems, removeFridgeItem, generateRecipes } from '@/lib/api';
import type { FridgeItem } from '@/lib/types';

const { width } = Dimensions.get('window');

export default function FridgeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await getFridgeItems();
      setItems(data);
    } catch {
      // Show empty state
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('Remove Item', 'Remove this item from your fridge?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFridgeItem(id);
            setItems(prev => prev.filter(i => i._id !== id));
          } catch {
            Alert.alert('Error', 'Could not remove item');
          }
        },
      },
    ]);
  }

  async function handleFindRecipes() {
    const expiringItems = items
      .filter(i => getDaysRemaining(i.expiry_date) <= 3)
      .map(i => i.item_name);

    if (expiringItems.length === 0) {
      Alert.alert('No Expiring Items', 'No items are expiring soon. Add items from scans!');
      return;
    }

    setGeneratingRecipes(true);
    try {
      const recipes = await generateRecipes(expiringItems);
      router.push({
        pathname: '/recipe',
        params: { data: JSON.stringify(recipes) },
      });
    } catch {
      Alert.alert('Error', 'Could not generate recipes');
    } finally {
      setGeneratingRecipes(false);
    }
  }

  function getDaysRemaining(expiryDate: string): number {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
  }

  function getUrgencyColor(days: number): string {
    if (days <= 1) return '#DC2626';
    if (days <= 3) return '#F4A261';
    return '#2D6A4F';
  }

  function renderItem({ item }: { item: FridgeItem }) {
    const days = getDaysRemaining(item.expiry_date);
    const urgencyColor = getUrgencyColor(days);

    return (
      <View style={[styles.itemCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.urgencyBar, { backgroundColor: urgencyColor }]} />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, { color: theme.text }]}>{item.item_name}</Text>
            <TouchableOpacity onPress={() => item._id && handleDelete(item._id)}>
              <FontAwesome name="trash-o" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.itemCategory, { color: theme.textSecondary }]}>
            {item.category} · {item.quantity} {item.unit}
          </Text>
          <View style={styles.expiryRow}>
            <FontAwesome
              name={days <= 1 ? 'exclamation-circle' : days <= 3 ? 'clock-o' : 'check-circle'}
              size={14}
              color={urgencyColor}
            />
            <Text style={[styles.expiryText, { color: urgencyColor }]}>
              {days <= 0
                ? 'Expired!'
                : days === 1
                  ? 'Expires tomorrow'
                  : `${days} days remaining`}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const expiringCount = items.filter(i => getDaysRemaining(i.expiry_date) <= 3).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={[styles.headerStat, { backgroundColor: theme.surface }]}>
          <Text style={[styles.headerStatValue, { color: theme.primary }]}>{items.length}</Text>
          <Text style={[styles.headerStatLabel, { color: theme.textSecondary }]}>Total Items</Text>
        </View>
        <View style={[styles.headerStat, { backgroundColor: theme.surface }]}>
          <Text style={[styles.headerStatValue, { color: theme.warning }]}>{expiringCount}</Text>
          <Text style={[styles.headerStatLabel, { color: theme.textSecondary }]}>Expiring Soon</Text>
        </View>
      </View>

      {/* Recipe Button */}
      {expiringCount > 0 && (
        <TouchableOpacity
          style={[styles.recipeButton, { backgroundColor: theme.primary }]}
          onPress={handleFindRecipes}
          disabled={generatingRecipes}>
          <FontAwesome name="cutlery" size={18} color="#FFF" />
          <Text style={styles.recipeButtonText}>
            {generatingRecipes ? 'Generating Recipes...' : `Find Recipes for ${expiringCount} Expiring Items`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome name="snowflake-o" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Your Fridge is Empty</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Scan items and tap "Save to Fridge" to track expiry dates and reduce food waste!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerStats: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  headerStat: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerStatValue: { fontSize: 28, fontWeight: '800' },
  headerStatLabel: { fontSize: 12, marginTop: 2 },
  recipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  recipeButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  urgencyBar: { width: 4 },
  itemContent: { flex: 1, padding: 14 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '700' },
  itemCategory: { fontSize: 12, marginTop: 2 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  expiryText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});
