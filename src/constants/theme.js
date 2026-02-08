// Wealthsimple-inspired dark green color palette
export const COLORS = {
  // Primary green (Wealthsimple-inspired dark mode)
  primary: '#00D68F',
  primaryDark: '#00BD7E',
  primaryLight: '#33DFAA',
  
  // Background colors (lighter dark green theme)
  background: '#16302A',        // Lighter dark green
  backgroundSecondary: '#1A3932', // Slightly lighter
  backgroundTertiary: '#1F4139',  // Card/elevated surface green
  
  // Text colors (optimized for dark background)
  textPrimary: '#FFFFFF',
  textSecondary: '#B4C7BE',
  textTertiary: '#7A9388',
  
  // UI elements
  white: '#FFFFFF',
  black: '#000000',
  border: '#2A4D43',
  borderLight: '#234138',
  
  // Tab bar
  tabBarBackground: '#1A3932',
  tabBarBorder: '#2A4D43',
  tabBarInactive: '#7A9388',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Freshness indicators
  excellent: '#10B981',
  good: '#34D399',
  fair: '#FBBF24',
  poor: '#F87171',
  
  // Shelf life colors
  fresh: '#10B981',
  expiringSoon: '#F59E0B',
  
  // Overlays and shadows
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  
  // Card and surface
  card: '#1F4139',
  cardBorder: '#2A4D43',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 34,
};

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const FRESHNESS_LEVELS = {
  EXCELLENT: { label: 'Excellent', color: COLORS.excellent, score: 90 },
  GOOD: { label: 'Good', color: COLORS.good, score: 70 },
  FAIR: { label: 'Fair', color: COLORS.fair, score: 50 },
  POOR: { label: 'Poor', color: COLORS.poor, score: 30 },
};
