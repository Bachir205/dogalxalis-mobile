import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Reads a JSON value. `parse` validates the raw value and returns null when it is unusable,
 * so corrupted or outdated storage falls back to defaults instead of crashing the app.
 */
export async function loadStored<T>(
  key: string,
  parse: (raw: unknown) => T | null,
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? null : parse(JSON.parse(raw));
  } catch (error) {
    console.warn(`Could not read "${key}" from storage`, error);
    return null;
  }
}

export async function saveStored(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save "${key}" to storage`, error);
  }
}
