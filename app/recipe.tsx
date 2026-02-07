import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { RecipeSuggestion } from '@/lib/types';

export default function RecipeScreen() {
  const params = useLocalSearchParams<{ data?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const recipes: RecipeSuggestion[] = params.data ? JSON.parse(params.data) : [];

  if (recipes.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <FontAwesome name="cutlery" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Recipes Available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>AI Recipe Suggestions</Text>
        <Text style={styles.headerSubtitle}>
          Recipes to use your expiring items and reduce waste
        </Text>
      </View>

      {recipes.map((recipe, index) => (
        <View key={index} style={[styles.recipeCard, { backgroundColor: theme.surface }]}>
          <View style={styles.recipeHeader}>
            <Text style={[styles.recipeNumber, { backgroundColor: theme.primary }]}>
              {index + 1}
            </Text>
            <View style={styles.recipeHeaderText}>
              <Text style={[styles.recipeTitle, { color: theme.text }]}>{recipe.title}</Text>
              <View style={styles.metaRow}>
                <FontAwesome name="clock-o" size={12} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{recipe.prep_time}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.recipeDesc, { color: theme.textSecondary }]}>
            {recipe.description}
          </Text>

          {/* Carbon Savings */}
          <View style={styles.savingsBadge}>
            <FontAwesome name="leaf" size={14} color="#2D6A4F" />
            <Text style={styles.savingsText}>{recipe.carbon_savings}</Text>
          </View>

          {/* Ingredients */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Ingredients</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
              <Text style={[styles.ingredientText, { color: theme.text }]}>{ing}</Text>
            </View>
          ))}

          {/* Steps */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Instructions</Text>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={[styles.stepNumber, { color: theme.primary }]}>{i + 1}.</Text>
              <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  header: {
    padding: 24,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D8F3DC',
    marginTop: 4,
  },
  recipeCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  recipeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '800',
    fontSize: 16,
    overflow: 'hidden',
  },
  recipeHeaderText: { flex: 1 },
  recipeTitle: { fontSize: 18, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 12 },
  recipeDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D8F3DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  savingsText: { fontSize: 13, color: '#2D6A4F', fontWeight: '600' },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  ingredientText: { fontSize: 14 },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  stepNumber: { fontSize: 14, fontWeight: '700', width: 20 },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
