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

/** True for a real calendar date written YYYY-MM-DD (rejects 2026-02-30, 2026-13-01, ...). */
export function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 1900 || year > 2200) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Moves a YYYY-MM-DD date by `deltaDays` days (negative = back). */
export function shiftDate(value: string, deltaDays: number): string {
  if (!isValidDate(value)) throw new Error(`Invalid date: ${value}`);
  const [year, month, day] = value.split('-').map(Number);
  return getToday(new Date(year, month - 1, day + deltaDays));
}
