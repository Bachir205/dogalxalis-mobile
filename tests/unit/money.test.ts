import { formatMinor, MAX_AMOUNT_MINOR, minorToInputString, parseAmountInput } from '@/utils/money';

describe('parseAmountInput', () => {
  it('parses whole amounts for XOF (no decimals)', () => {
    expect(parseAmountInput('2500', 'XOF')).toEqual({ ok: true, minor: 2500 });
    expect(parseAmountInput(' 65 000 ', 'XOF')).toEqual({ ok: true, minor: 65000 });
    expect(parseAmountInput('65\u00A0000', 'XOF')).toEqual({ ok: true, minor: 65000 });
    expect(parseAmountInput('007', 'XOF')).toEqual({ ok: true, minor: 7 });
  });

  it('converts decimals to cents without floating-point errors', () => {
    expect(parseAmountInput('25.5', 'EUR')).toEqual({ ok: true, minor: 2550 });
    expect(parseAmountInput('25,50', 'EUR')).toEqual({ ok: true, minor: 2550 });
    expect(parseAmountInput('0.01', 'USD')).toEqual({ ok: true, minor: 1 });
    expect(parseAmountInput('100', 'EUR')).toEqual({ ok: true, minor: 10000 });
    // The classic float trap: 1.15 * 100 === 114.99999999999999 in JavaScript.
    expect(parseAmountInput('1.15', 'EUR')).toEqual({ ok: true, minor: 115 });
    expect(parseAmountInput('19.99', 'USD')).toEqual({ ok: true, minor: 1999 });
  });

  it('rejects empty, malformed and negative input', () => {
    expect(parseAmountInput('', 'XOF')).toEqual({ ok: false, error: 'empty' });
    expect(parseAmountInput('   ', 'XOF')).toEqual({ ok: false, error: 'empty' });
    for (const bad of ['abc', '12a', '-5', '+5', '1e3', '1.2.3', '1,000.50', '.5', '5.']) {
      expect(parseAmountInput(bad, 'EUR')).toEqual({ ok: false, error: 'invalid' });
    }
  });

  it('rejects more decimals than the currency allows', () => {
    expect(parseAmountInput('10.5', 'XOF')).toEqual({ ok: false, error: 'tooManyDecimals' });
    expect(parseAmountInput('1000.00', 'XOF')).toEqual({ ok: false, error: 'tooManyDecimals' });
    expect(parseAmountInput('1.234', 'EUR')).toEqual({ ok: false, error: 'tooManyDecimals' });
  });

  it('rejects zero and amounts that are too large', () => {
    expect(parseAmountInput('0', 'XOF')).toEqual({ ok: false, error: 'notPositive' });
    expect(parseAmountInput('0.00', 'EUR')).toEqual({ ok: false, error: 'notPositive' });
    expect(parseAmountInput(String(MAX_AMOUNT_MINOR), 'XOF')).toEqual({ ok: true, minor: MAX_AMOUNT_MINOR });
    expect(parseAmountInput(String(MAX_AMOUNT_MINOR + 1), 'XOF')).toEqual({ ok: false, error: 'tooLarge' });
    expect(parseAmountInput('99999999999999999999', 'XOF')).toEqual({ ok: false, error: 'tooLarge' });
  });
});

describe('formatMinor', () => {
  const nbsp = '\u00A0';

  it('formats XOF with grouping, per language', () => {
    expect(formatMinor(65000, 'XOF', 'fr')).toBe(`65${nbsp}000${nbsp}FCFA`);
    expect(formatMinor(65000, 'XOF', 'en')).toBe(`65,000${nbsp}FCFA`);
    expect(formatMinor(0, 'XOF', 'en')).toBe(`0${nbsp}FCFA`);
    expect(formatMinor(999, 'XOF', 'en')).toBe(`999${nbsp}FCFA`);
    expect(formatMinor(1234567, 'XOF', 'en')).toBe(`1,234,567${nbsp}FCFA`);
  });

  it('formats cents for EUR and USD', () => {
    expect(formatMinor(123456, 'EUR', 'fr')).toBe(`1${nbsp}234,56${nbsp}€`);
    expect(formatMinor(123456, 'EUR', 'en')).toBe(`1,234.56${nbsp}€`);
    expect(formatMinor(5, 'USD', 'en')).toBe(`0.05${nbsp}$`);
    expect(formatMinor(100, 'USD', 'en')).toBe(`1.00${nbsp}$`);
  });

  it('shows the sign for negative amounts, and "+" on request', () => {
    expect(formatMinor(-2500, 'XOF', 'en')).toBe(`-2,500${nbsp}FCFA`);
    expect(formatMinor(2500, 'XOF', 'en', { sign: true })).toBe(`+2,500${nbsp}FCFA`);
    expect(formatMinor(-2500, 'XOF', 'en', { sign: true })).toBe(`-2,500${nbsp}FCFA`);
    expect(formatMinor(0, 'XOF', 'en', { sign: true })).toBe(`0${nbsp}FCFA`);
  });
});

describe('minorToInputString', () => {
  it('prefills the amount field in a form the parser accepts back', () => {
    expect(minorToInputString(2500, 'XOF')).toBe('2500');
    expect(minorToInputString(2550, 'EUR')).toBe('25.50');
    expect(minorToInputString(5, 'USD')).toBe('0.05');
    for (const [minor, currency] of [[2500, 'XOF'], [2550, 'EUR'], [5, 'USD'], [123456789, 'EUR']] as const) {
      expect(parseAmountInput(minorToInputString(minor, currency), currency)).toEqual({ ok: true, minor });
    }
  });
});
