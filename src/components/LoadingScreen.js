import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.leafCircle}>
          <Ionicons name="leaf" size={80} color={COLORS.primary} />
        </View>
      </View>
      
      <Text style={styles.appName}>CrispIt</Text>
      
      <ActivityIndicator 
        size="large" 
        color={COLORS.primary} 
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.xxl,
  },
  leafCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: `${COLORS.primary}30`,
  },
  appName: {
    fontSize: 48,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xl,
    letterSpacing: 1,
  },
  loader: {
    marginTop: SPACING.lg,
  },
});
