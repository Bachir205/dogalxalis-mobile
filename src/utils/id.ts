import { randomUUID } from 'expo-crypto';

/** Client-generated id (UUID v4). The same id is sent to the API, so retries never duplicate. */
export function generateId(): string {
  return randomUUID();
}
