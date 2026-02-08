import { Platform, useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();
  return {
    isWeb: Platform.OS === 'web',
    isWide: width >= 768,
    width,
  };
}
