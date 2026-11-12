import { CURRENCIES, type CurrencyCode } from '@/constants/currencies';
import type { Language } from '@/i18n';

/** Largest accepted amount: 10^12 minor units, far below Number.MAX_SAFE_INTEGER (about 9 x 10^15). */
export const MAX_AMOUNT_MINOR = 1_000_000_000_000;

export type AmountError = 'empty' | 'invalid' | 'tooManyDecimals' | 'notPositive' | 'tooLarge';
export type AmountResult = { ok: true; minor: number } | { ok: false; error: AmountError };

/**
 * Turns what the user typed into integer minor units, using string arithmetic only
 * (never parseFloat * 100, which gives results like 1.15 * 100 = 114.99999999999999).
 * Accepts "2500", "25.5", "25,50"; spaces are ignored. Decimals beyond the currency's exponent
 * are rejected, so XOF accepts no decimals at all.
 */
export function parseAmountInput(input: string, currency: CurrencyCode): AmountResult {
  const cleaned = input.replace(/[\s\u00A0\u202F]/g, '');
  if (cleaned === '') return { ok: false, error: 'empty' };

  const match = /^(\d+)(?:[.,](\d+))?$/.exec(cleaned);
  if (!match) return { ok: false, error: 'invalid' };

  const { exponent } = CURRENCIES[currency];
  const fraction = match[2] ?? '';
  if (fraction.length > exponent) return { ok: false, error: 'tooManyDecimals' };

  const digits = (match[1] + fraction.padEnd(exponent, '0')).replace(/^0+/, '');
  if (digits === '') return { ok: false, error: 'notPositive' };
  if (digits.length > 13) return { ok: false, error: 'tooLarge' };

  const minor = Number(digits);
  if (minor > MAX_AMOUNT_MINOR) return { ok: false, error: 'tooLarge' };
  return { ok: true, minor };
}

/** Splits minor units into whole and fraction parts with integer arithmetic only. */
function splitMinor(minor: number, currency: CurrencyCode) {
  const divisor = 10 ** CURRENCIES[currency].exponent;
  const abs = Math.abs(minor);
  const fraction = abs % divisor;
  return { whole: (abs - fraction) / divisor, fraction, exponent: CURRENCIES[currency].exponent };
}

/**
 * 65000 XOF -> "65 000 FCFA" (fr) or "65,000 FCFA" (en); 123456 EUR -> "1 234,56 €" / "1,234.56 €".
 * `sign: true` adds "+" to positive amounts. Negative amounts always get "-".
 */
export function formatMinor(
  minor: number,
  currency: CurrencyCode,
  language: Language,
  options: { sign?: boolean } = {},
): string {
  const { whole, fraction, exponent } = splitMinor(minor, currency);
  const groupSeparator = language === 'fr' ? '\u00A0' : ',';
  const decimalSeparator = language === 'fr' ? ',' : '.';
  const wholeText = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  const number =
    exponent > 0
      ? `${wholeText}${decimalSeparator}${String(fraction).padStart(exponent, '0')}`
      : wholeText;
  const prefix = minor < 0 ? '-' : options.sign && minor > 0 ? '+' : '';
  return `${prefix}${number}\u00A0${CURRENCIES[currency].symbol}`;
}

/** Text to prefill an amount field when editing: 2550 EUR -> "25.50", 2500 XOF -> "2500". */
export function minorToInputString(minor: number, currency: CurrencyCode): string {
  const { whole, fraction, exponent } = splitMinor(minor, currency);
  return exponent > 0 ? `${whole}.${String(fraction).padStart(exponent, '0')}` : String(whole);
}
