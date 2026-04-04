import { useColorScheme } from './use-color-scheme';
import { Colors, AppColors } from '../constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  return {
    isDark,
    colors,
    // Common themed colors for screens
    bg: isDark ? '#121212' : '#f5f7f0',
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#ECEDEE' : '#1A1A1A',
    textSecondary: isDark ? '#9BA1A6' : '#666666',
    border: isDark ? '#333333' : '#E8E8E8',
    primary: isDark ? '#4CAF50' : '#2d5016',
    primaryBg: isDark ? '#1B3A0B' : '#2d5016',
    inputBg: isDark ? '#2A2A2A' : '#FFFFFF',
    tabBg: isDark ? '#1E1E1E' : '#FFFFFF',
    tabActiveBg: isDark ? '#2d5016' : '#2d5016',
    statCardBg: (color: string) => isDark ? color + '33' : color + '22',
  };
}
