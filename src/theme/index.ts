import { darkColors, lightColors, type ColorTokens } from './colors';
import { fontSize, fontWeight, radius, spacing, touchTarget } from './tokens';

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  touchTarget: number;
}

/** Pure function: easy to unit-test, no React involved. */
export function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    fontSize,
    fontWeight,
    touchTarget,
  };
}

export type { ColorTokens };
