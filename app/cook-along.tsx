import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import VoicePlayer from '@/components/shared/VoicePlayer';
import type { RecipeSuggestion } from '@/lib/types';

export default function CookAlongScreen() {
  const params = useLocalSearchParams<{ recipe?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const recipe: RecipeSuggestion | null = (() => {
    if (!params.recipe) return null;
    try {
      return JSON.parse(params.recipe);
    } catch {
      return null;
    }
  })();
  const [currentStep, setCurrentStep] = useState(-1); // -1 = intro

  const totalSteps = recipe?.steps.length ?? 0;

  const narration = useMemo(() => {
    if (!recipe) return '';
    if (currentStep === -1) {
      const ingredientList = recipe.ingredients.join(', ');
      return `Let's make ${recipe.title}. You'll need: ${ingredientList}. Tap next when you're ready.`;
    }
    const stepText = recipe.steps[currentStep];
    if (currentStep === 0) return `Step 1. First, ${stepText}`;
    if (currentStep === totalSteps - 1) return `Last step. Finally, ${stepText}`;
    return `Step ${currentStep + 1}. Next, ${stepText}`;
  }, [recipe, currentStep, totalSteps]);

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <FontAwesome name="cutlery" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Recipe Selected</Text>
      </View>
    );
  }

  const isIntro = currentStep === -1;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = isIntro ? 0 : (currentStep + 1) / totalSteps;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Progress bar */}
      <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressBarFill,
            { backgroundColor: theme.primary, width: `${progress * 100}%` },
          ]}
        />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <Text style={[styles.stepIndicatorText, { color: theme.textSecondary }]}>
          {isIntro ? 'Introduction' : `Step ${currentStep + 1} of ${totalSteps}`}
        </Text>
      </View>

      {/* Main content area */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}>
        {isIntro ? (
          <>
            <Text style={[styles.recipeTitle, { color: theme.text }]}>
              {recipe.title}
            </Text>

            <View style={styles.metaRow}>
              <FontAwesome name="clock-o" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {recipe.prep_time}
              </Text>
              <FontAwesome name="leaf" size={14} color={theme.primary} style={{ marginLeft: 12 }} />
              <Text style={[styles.metaText, { color: theme.primary }]}>
                {recipe.carbon_savings}
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.text }]}>Ingredients</Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
                <Text style={[styles.ingredientText, { color: theme.text }]}>{ing}</Text>
              </View>
            ))}
          </>
        ) : (
          <>
            <View style={[styles.stepNumberCircle, { backgroundColor: theme.primary }]}>
              <Text style={styles.stepNumberText}>{currentStep + 1}</Text>
            </View>
            <Text style={[styles.stepContent, { color: theme.text }]}>
              {recipe.steps[currentStep]}
            </Text>
          </>
        )}

        {/* Voice Player */}
        <View style={styles.voicePlayerWrap}>
          <VoicePlayer
            key={currentStep}
            text={narration}
            label={isIntro ? 'Listen to intro' : `Listen to step ${currentStep + 1}`}
            autoPlay
          />
        </View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={[styles.navBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.navBtn,
            { backgroundColor: isIntro ? theme.border : theme.surface, borderColor: theme.primary },
            !isIntro && styles.navBtnOutline,
          ]}
          onPress={() => setCurrentStep(s => s - 1)}
          disabled={isIntro}
          activeOpacity={0.7}>
          <FontAwesome name="arrow-left" size={16} color={isIntro ? theme.textSecondary : theme.primary} />
          <Text style={[styles.navBtnText, { color: isIntro ? theme.textSecondary : theme.primary }]}>
            Previous
          </Text>
        </TouchableOpacity>

        {isLastStep ? (
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnDone, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <FontAwesome name="check" size={16} color="#FFFFFF" />
            <Text style={[styles.navBtnText, { color: '#FFFFFF' }]}>Done!</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.primary }]}
            onPress={() => setCurrentStep(s => s + 1)}
            activeOpacity={0.7}>
            <Text style={[styles.navBtnText, { color: '#FFFFFF' }]}>Next</Text>
            <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },

  progressBarBg: {
    height: 4,
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },

  stepIndicator: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
  },

  contentScroll: { flex: 1 },
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },

  recipeTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  metaText: { fontSize: 13 },

  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  ingredientText: { fontSize: 16, lineHeight: 22 },

  stepNumberCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  stepContent: {
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
  },

  voicePlayerWrap: {
    marginTop: 24,
  },

  navBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  navBtnOutline: {
    borderWidth: 1.5,
  },
  navBtnDone: {},
  navBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
