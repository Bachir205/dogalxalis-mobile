import type { Language } from '@/i18n';
import { MONTH_NAMES, MONTH_SHORT } from '@/i18n/months';

/** 2026-11-10 -> "10 Nov 2026" (fr: "10 nov. 2026"). Expects a valid YYYY-MM-DD date. */
export function formatDisplayDate(date: string, language: Language): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${day} ${MONTH_SHORT[language][month - 1]} ${year}`;
}

/** 2026-11 -> "November 2026" (fr: "Novembre 2026"). Expects a valid YYYY-MM month. */
export function formatMonthLabel(month: string, language: Language): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const name = MONTH_NAMES[language][monthNumber - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** An ISO timestamp as local date and time: "10 Nov 2026, 14:05". */
export function formatDateTime(iso: string, language: Language): string {
  const date = new Date(iso);
  const day = `${date.getDate()} ${MONTH_SHORT[language][date.getMonth()]} ${date.getFullYear()}`;
  return `${day}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
