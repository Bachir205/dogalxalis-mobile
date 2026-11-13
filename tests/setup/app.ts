import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { flushPromises } from './helpers';

/**
 * Renders the whole app (real route files) and waits until it is usable: the saved theme and
 * language are read, the database is open, and the data screens finished loading.
 */
export async function startApp(initialUrl?: string) {
  await renderRouter('src/app', initialUrl ? { initialUrl } : undefined);
  await flushPromises();
  await waitFor(() => expect(screen.queryByTestId('loading-state')).toBeNull());
}

export async function typeInto(label: string, text: string) {
  await fireEvent.changeText(screen.getByLabelText(label), text);
}

export async function press(label: string) {
  await fireEvent.press(screen.getByLabelText(label));
}
