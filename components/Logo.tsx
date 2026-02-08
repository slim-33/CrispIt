import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type LogoSize = 'sm' | 'md' | 'lg';

const sizes: Record<LogoSize, { icon: number; name: number; tagline: number; gap: number }> = {
  sm: { icon: 18, name: 18, tagline: 0, gap: 6 },
  md: { icon: 28, name: 28, tagline: 12, gap: 8 },
  lg: { icon: 48, name: 48, tagline: 16, gap: 12 },
};

export default function Logo({
  size = 'md',
  showTagline = false,
  color = '#FFFFFF',
  taglineColor,
}: {
  size?: LogoSize;
  showTagline?: boolean;
  color?: string;
  taglineColor?: string;
}) {
  const s = sizes[size];

  return (
    <View style={styles.container}>
      <View style={[styles.row, { gap: s.gap }]}>
        <FontAwesome name="leaf" size={s.icon} color={color} />
        <Text style={[styles.name, { fontSize: s.name, color }]}>CrispIt</Text>
      </View>
      {showTagline && s.tagline > 0 && (
        <Text style={[styles.tagline, { fontSize: s.tagline, color: taglineColor || color + 'BB' }]}>
          Freshness, filtered.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: '900', letterSpacing: -0.5 },
  tagline: { fontWeight: '500', marginTop: 4, fontStyle: 'italic' },
});
