type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * A tiny signal: the data providers say "something changed locally" and the sync provider
 * (which sits below them) reacts. This avoids a circular dependency between the two.
 */
export function onLocalChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyLocalChange(): void {
  listeners.forEach((listener) => listener());
}
