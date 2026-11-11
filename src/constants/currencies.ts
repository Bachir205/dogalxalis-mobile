/** Supported currencies. `exponent` = number of decimals (minor unit = 10^-exponent). */
export const CURRENCIES = {
  XOF: { code: 'XOF', exponent: 0, symbol: 'FCFA' },
  EUR: { code: 'EUR', exponent: 2, symbol: '€' },
  USD: { code: 'USD', exponent: 2, symbol: '$' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const DEFAULT_CURRENCY: CurrencyCode = 'XOF';

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && value in CURRENCIES;
}
