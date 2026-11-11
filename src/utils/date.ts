/** Date helpers. Dates are plain calendar strings (YYYY-MM-DD / YYYY-MM): no timezone surprises. */

const pad = (n: number) => String(n).padStart(2, '0');

export function getToday(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function getCurrentMonth(now: Date = new Date()): string {
  return getToday(now).slice(0, 7);
}

export function isValidMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Moves a YYYY-MM month by `delta` months (negative = back). */
export function shiftMonth(month: string, delta: number): string {
  if (!isValidMonth(month)) throw new Error(`Invalid month: ${month}`);
  const [year, monthNumber] = month.split('-').map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}
