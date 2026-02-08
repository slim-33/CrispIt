function getApiUrl(): string {
  if (!__DEV__) return 'https://lunchbox-api.onrender.com';

  // In Expo Go, derive API host from the dev server's host IP
  // This avoids hardcoding WSL2/local IPs that phones can't reach
  try {
    const Constants = require('expo-constants').default;
    const hostUri: string | undefined =
      Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:3000`;
    }
  } catch {}

  return 'http://localhost:3000';
}

export const API_URL = getApiUrl();

export const COLORS = {
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  primaryDark: '#1B4332',
  secondary: '#52B788',
  secondaryLight: '#74C69D',
  accent: '#D8F3DC',
  warning: '#F4A261',
  danger: '#E76F51',
  success: '#2D6A4F',
  background: '#F0F7F4',
  surface: '#FFFFFF',
  text: '#1B1B1B',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
};

export const FRESHNESS_COLORS: Record<string, string> = {
  excellent: '#2D6A4F',
  good: '#40916C',
  fair: '#F4A261',
  poor: '#E76F51',
  bad: '#DC2626',
};

export function getFreshnessColor(score: number): string {
  if (score >= 8) return FRESHNESS_COLORS.excellent;
  if (score >= 6) return FRESHNESS_COLORS.good;
  if (score >= 4) return FRESHNESS_COLORS.fair;
  if (score >= 2) return FRESHNESS_COLORS.poor;
  return FRESHNESS_COLORS.bad;
}

export function getFreshnessLabel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  if (score >= 2) return 'Poor';
  return 'Bad';
}

export const BADGES = [
  { id: 'first_scan', name: 'First Scan', description: 'Scan your first item', icon: 'camera' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Scan 3 days in a row', icon: 'fire' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Scan 7 days in a row', icon: 'trophy' },
  { id: 'carbon_saver', name: 'Carbon Saver', description: 'Save 5kg of CO2', icon: 'leaf' },
  { id: 'fridge_master', name: 'Fridge Master', description: 'Track 10 items in fridge', icon: 'snowflake-o' },
  { id: 'recipe_explorer', name: 'Recipe Explorer', description: 'Generate 5 recipes', icon: 'cutlery' },
  { id: 'eco_warrior', name: 'Eco Warrior', description: 'Reach 80+ sustainability score', icon: 'globe' },
  { id: 'scanner_pro', name: 'Scanner Pro', description: 'Scan 50 items', icon: 'star' },
];
