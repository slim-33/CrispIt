import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon, 
  disabled = false,
  loading = false,
  style,
  fullWidth = true,
}) => {
  const getButtonStyle = () => {
    if (disabled || loading) {
      return [styles.button, styles.disabled, fullWidth && styles.fullWidth, style];
    }
    
    switch (variant) {
      case 'primary':
        return [styles.button, styles.primary, fullWidth && styles.fullWidth, style];
      case 'secondary':
        return [styles.button, styles.secondary, fullWidth && styles.fullWidth, style];
      case 'outline':
        return [styles.button, styles.outline, fullWidth && styles.fullWidth, style];
      default:
        return [styles.button, styles.primary, fullWidth && styles.fullWidth, style];
    }
  };

  const getTextStyle = () => {
    if (disabled || loading) {
      return [styles.text, styles.disabledText];
    }
    
    switch (variant) {
      case 'primary':
        return [styles.text, styles.primaryText];
      case 'secondary':
        return [styles.text, styles.secondaryText];
      case 'outline':
        return [styles.text, styles.outlineText];
      default:
        return [styles.text, styles.primaryText];
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.primary} />
      ) : (
        <Text style={getTextStyle()}>
          {icon && `${icon} `}{title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  disabled: {
    backgroundColor: COLORS.backgroundTertiary,
    opacity: 0.5,
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.textPrimary,
  },
  outlineText: {
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.textTertiary,
  },
});
