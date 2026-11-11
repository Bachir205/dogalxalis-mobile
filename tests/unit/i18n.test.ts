import { translate } from '@/i18n';
import { requireContext } from '@/hooks/requireContext';

describe('translate', () => {
  it('returns the text of the chosen language', () => {
    expect(translate('en', 'nav.settings')).toBe('Settings');
    expect(translate('fr', 'nav.settings')).toBe('Paramètres');
  });

  it('replaces {placeholders}', () => {
    expect(translate('en', 'drawer.version', { version: '1.2.3' })).toBe('Version 1.2.3');
    expect(translate('fr', 'common.comingIn', { phase: 4 })).toBe('Disponible en Phase 4');
  });

  it('leaves an unknown placeholder untouched', () => {
    expect(translate('en', 'drawer.version', { other: 'x' })).toBe('Version {version}');
  });
});

describe('requireContext', () => {
  it('returns the value when present', () => {
    expect(requireContext({ a: 1 }, 'useX', 'XProvider')).toEqual({ a: 1 });
  });

  it('explains the mistake when the provider is missing', () => {
    expect(() => requireContext(null, 'useTheme', 'ThemeProvider')).toThrow(
      'useTheme() must be used inside <ThemeProvider>',
    );
  });
});
