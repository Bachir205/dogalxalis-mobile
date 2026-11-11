/** Returns the context value or fails loudly when a hook is used outside its provider. */
export function requireContext<T>(value: T | null, hook: string, provider: string): T {
  if (value === null) throw new Error(`${hook}() must be used inside <${provider}>`);
  return value;
}
