import { getCurrentMonth, getToday, isValidMonth, shiftMonth } from '@/utils/date';

describe('date utilities', () => {
  it('formats today and the current month with zero padding', () => {
    const date = new Date(2026, 0, 5); // 5 Jan 2026 (local time)
    expect(getToday(date)).toBe('2026-01-05');
    expect(getCurrentMonth(date)).toBe('2026-01');
  });

  it('validates YYYY-MM months', () => {
    expect(isValidMonth('2026-11')).toBe(true);
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth('2026-00')).toBe(false);
    expect(isValidMonth('26-11')).toBe(false);
    expect(isValidMonth('')).toBe(false);
  });

  it('moves between months, across year boundaries', () => {
    expect(shiftMonth('2026-11', 1)).toBe('2026-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-03', -15)).toBe('2024-12');
    expect(shiftMonth('2026-03', 0)).toBe('2026-03');
  });

  it('rejects an invalid month', () => {
    expect(() => shiftMonth('nope', 1)).toThrow('Invalid month');
  });
});
