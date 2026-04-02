import { Platform } from 'react-native';

// Малчин апп брэнд өнгөнүүд
export const AppColors = {
  primary: '#2D7D3F',      // Ногоон - бэлчээр
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  secondary: '#FF8F00',    // Шар - нар, алт
  secondaryLight: '#FFB74D',
  accent: '#5C6BC0',       // Цэнхэр - тэнгэр
  danger: '#E53935',
  warning: '#FF8F00',
  success: '#43A047',
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: '#9E9E9E',
  grayLight: '#F5F5F5',
  grayMedium: '#E0E0E0',
  grayDark: '#616161',
  cardBg: '#FFFFFF',
  borderColor: '#E8E8E8',
};

export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#616161',
    background: '#F8F9FA',
    cardBg: '#FFFFFF',
    tint: AppColors.primary,
    icon: '#687076',
    tabIconDefault: '#9E9E9E',
    tabIconSelected: AppColors.primary,
    border: '#E8E8E8',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#121212',
    cardBg: '#1E1E1E',
    tint: AppColors.primaryLight,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: AppColors.primaryLight,
    border: '#333333',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
