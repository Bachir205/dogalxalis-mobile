/**
 * Semantic color tokens. Screens and components never use raw hex values:
 * they read these names through useTheme().
 */
export interface ColorTokens {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  income: string;
  expense: string;
  budgetWarning: string;
  budgetExceeded: string;
  success: string;
  error: string;
}

export const lightColors: ColorTokens = {
  background: '#F6F8F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F0',
  primary: '#1F7A4D',
  onPrimary: '#FFFFFF',
  secondary: '#2F5D8A',
  text: '#12201A',
  textMuted: '#5B6B63',
  border: '#D9E1DD',
  income: '#1B7F4B',
  expense: '#C0392B',
  budgetWarning: '#B26A00',
  budgetExceeded: '#B3261E',
  success: '#1B7F4B',
  error: '#B3261E',
};

export const darkColors: ColorTokens = {
  background: '#0E1512',
  surface: '#17211C',
  surfaceMuted: '#1F2B25',
  primary: '#4CC38A',
  onPrimary: '#06251A',
  secondary: '#7FB0E0',
  text: '#EAF2EE',
  textMuted: '#9FB1A8',
  border: '#2B3A33',
  income: '#5ED39A',
  expense: '#FF8A7A',
  budgetWarning: '#F2B35A',
  budgetExceeded: '#FF8A80',
  success: '#5ED39A',
  error: '#FF8A80',
};
