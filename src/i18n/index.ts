import { en, type Translations } from './en';
import { fr } from './fr';

export type Language = 'en' | 'fr';

export const dictionaries: Record<Language, Translations> = { en, fr };

/** Union of every valid dotted key, e.g. 'foundation.title'. */
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = DotPaths<Translations>;
export type TranslationParams = Record<string, string | number>;

function lookup(dictionary: Translations, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Pure translation function (unit-testable). Replaces {name} placeholders. */
export function translate(
  language: Language,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const template = lookup(dictionaries[language], key) ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
