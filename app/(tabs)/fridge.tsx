import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getFridgeItems, removeFridgeItem, addFridgeItem, generateRecipes } from '@/lib/api';
import WebContainer from '@/components/WebContainer';
import type { FridgeItem } from '@/lib/types';

export default function FridgeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    category: 'fruit' as string,
    quantity: '1',
    unit: 'items' as string,
    daysUntilExpiry: '7',
  });
  const [addingItem, setAddingItem] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

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

  async function executeDelete(id: string) {
    try {
      await removeFridgeItem(id);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert('Error', 'Could not remove item');
    }
  }

  function handleDelete(id: string) {
    if (Platform.OS === 'web') {
      // Alert.alert button callbacks are unreliable on web
      executeDelete(id);
      return;
    }
    Alert.alert('Remove Item', 'Remove this item from your fridge?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => { executeDelete(id); },
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

  async function handleAddItem() {
    if (!addForm.name.trim()) {
      Alert.alert('Missing Name', 'Please enter an item name.');
      return;
    }
    setAddingItem(true);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (parseInt(addForm.daysUntilExpiry, 10) || 7));

      await addFridgeItem({
        item_name: addForm.name.trim(),
        category: addForm.category,
        added_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        freshness_score: 8,
        quantity: parseInt(addForm.quantity, 10) || 1,
        unit: addForm.unit,
      });

      setShowAddModal(false);
      setAddForm({ name: '', category: 'fruit', quantity: '1', unit: 'items', daysUntilExpiry: '7' });
      await loadItems();
    } catch {
      Alert.alert('Error', 'Could not add item.');
    } finally {
      setAddingItem(false);
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
            <TouchableOpacity
              onPress={() => item._id && handleDelete(item._id)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.deleteBtn}>
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
    <WebContainer>
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
          style={[styles.recipeButton, { backgroundColor: theme.primary }, Platform.OS === 'web' && styles.webTouchable]}
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

      {/* FAB - Add Item */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }, Platform.OS === 'web' && styles.webTouchable]}
        onPress={() => setShowAddModal(true)}>
        <FontAwesome name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <FontAwesome name="times" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Item Name</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, borderColor: theme.textSecondary + '40' }]}
              placeholder="e.g. Milk, Carrots, Chicken..."
              placeholderTextColor={theme.textSecondary}
              value={addForm.name}
              onChangeText={t => setAddForm(f => ({ ...f, name: t }))}
            />

            {/* Category Picker */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Category</Text>
            <View style={styles.chipRow}>
              {['fruit', 'vegetable', 'meat', 'dairy', 'other'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    { borderColor: theme.primary },
                    addForm.category === cat && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setAddForm(f => ({ ...f, category: cat }))}>
                  <Text style={[
                    styles.chipText,
                    { color: addForm.category === cat ? '#FFF' : theme.primary },
                  ]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity + Unit Row */}
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Quantity</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.textSecondary + '40' }]}
                  keyboardType="numeric"
                  value={addForm.quantity}
                  onChangeText={t => setAddForm(f => ({ ...f, quantity: t }))}
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Unit</Text>
                <View style={styles.chipRow}>
                  {['items', 'kg', 'g', 'lbs', 'bag'].map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.chipSmall,
                        { borderColor: theme.primary },
                        addForm.unit === u && { backgroundColor: theme.primary },
                      ]}
                      onPress={() => setAddForm(f => ({ ...f, unit: u }))}>
                      <Text style={[
                        styles.chipTextSmall,
                        { color: addForm.unit === u ? '#FFF' : theme.primary },
                      ]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Expiry */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Days Until Expiry</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, borderColor: theme.textSecondary + '40' }]}
              keyboardType="numeric"
              value={addForm.daysUntilExpiry}
              onChangeText={t => setAddForm(f => ({ ...f, daysUntilExpiry: t }))}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }, Platform.OS === 'web' && styles.webTouchable]}
              onPress={handleAddItem}
              disabled={addingItem}>
              <FontAwesome name="plus-circle" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>
                {addingItem ? 'Adding...' : 'Add to Fridge'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
    </WebContainer>
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
  deleteBtn: { padding: 6 },
  itemName: { fontSize: 16, fontWeight: '700' },
  itemCategory: { fontSize: 12, marginTop: 2 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  expiryText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipSmall: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipTextSmall: { fontSize: 12, fontWeight: '600' },
  rowFields: { flexDirection: 'row', gap: 12 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
  },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  webTouchable: Platform.select({
    web: { cursor: 'pointer' as any },
    default: {},
  }),
});
