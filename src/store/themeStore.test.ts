// themeStore persists themeId/modePreference via settingsRepository's
// SQLiteSettingsRepository, which calls into the native expo-sqlite module —
// unavailable under Jest. The repo-root __mocks__/expo-sqlite.js manual mock
// stands in for it automatically (no jest.mock() call needed here).

describe('themeStore', () => {
  it('seeds mode from the OS color scheme at creation time (light)', () => {
    let mode: string;
    jest.isolateModules(() => {
      jest.spyOn(require('react-native').Appearance, 'getColorScheme').mockReturnValue('light');
      mode = require('./themeStore').useThemeStore.getState().mode;
    });
    expect(mode!).toBe('light');
  });

  it('falls back to light when the OS reports no preference', () => {
    let mode: string;
    jest.isolateModules(() => {
      jest.spyOn(require('react-native').Appearance, 'getColorScheme').mockReturnValue(null);
      mode = require('./themeStore').useThemeStore.getState().mode;
    });
    expect(mode!).toBe('light');
  });

  it('defaults modePreference to system', () => {
    const { useThemeStore } = require('./themeStore');
    expect(useThemeStore.getState().modePreference).toBe('system');
  });

  it('setModePreference sets an explicit light/dark mode directly', () => {
    const { useThemeStore } = require('./themeStore');
    useThemeStore.getState().setModePreference('dark');
    expect(useThemeStore.getState().modePreference).toBe('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().setModePreference('light');
    expect(useThemeStore.getState().modePreference).toBe('light');
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('setModePreference("system") resolves mode from the current OS scheme', () => {
    let modePreference: string;
    let mode: string;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      const spy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
      const { useThemeStore } = require('./themeStore');
      useThemeStore.getState().setModePreference('light');
      spy.mockReturnValue('light');
      useThemeStore.getState().setModePreference('system');
      modePreference = useThemeStore.getState().modePreference;
      mode = useThemeStore.getState().mode;
    });
    expect(modePreference!).toBe('system');
    expect(mode!).toBe('light');
  });

  it('tracks live OS appearance changes while modePreference is system', () => {
    let mode: string;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
      let listener: (event: { colorScheme: string | null }) => void = () => {};
      jest.spyOn(Appearance, 'addChangeListener').mockImplementation(((cb: typeof listener) => {
        listener = cb;
        return { remove: () => {} };
      }) as typeof Appearance.addChangeListener);
      const { useThemeStore } = require('./themeStore');
      listener({ colorScheme: 'light' });
      mode = useThemeStore.getState().mode;
    });
    expect(mode!).toBe('light');
  });

  it('ignores OS appearance changes once an explicit light/dark mode is chosen', () => {
    let mode: string;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
      let listener: (event: { colorScheme: string | null }) => void = () => {};
      jest.spyOn(Appearance, 'addChangeListener').mockImplementation(((cb: typeof listener) => {
        listener = cb;
        return { remove: () => {} };
      }) as typeof Appearance.addChangeListener);
      const { useThemeStore } = require('./themeStore');
      useThemeStore.getState().setModePreference('dark');
      listener({ colorScheme: 'light' });
      mode = useThemeStore.getState().mode;
    });
    expect(mode!).toBe('dark');
  });

  it('resyncSystemMode corrects a stale mode against the current OS scheme', () => {
    let mode: string;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      const spy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
      const { useThemeStore, resyncSystemMode } = require('./themeStore');
      // Simulates the module-load-time seed having raced ahead of the real
      // OS value and landed on the wrong scheme.
      useThemeStore.setState({ mode: 'dark' });
      spy.mockReturnValue('light');
      resyncSystemMode();
      mode = useThemeStore.getState().mode;
    });
    expect(mode!).toBe('light');
  });

  it('resyncSystemMode leaves an explicit light/dark preference alone', () => {
    let mode: string;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light');
      const { useThemeStore, resyncSystemMode } = require('./themeStore');
      useThemeStore.getState().setModePreference('dark');
      resyncSystemMode();
      mode = useThemeStore.getState().mode;
    });
    expect(mode!).toBe('dark');
  });

  it('seeds themeId and modePreference from previously persisted settings (survives a force-close)', () => {
    let themeId: string;
    let modePreference: string;
    let mode: string;
    jest.isolateModules(() => {
      // Simulates a prior app session having stored a choice: write straight
      // to the settings table before themeStore's module-load-time seeding
      // reads from it.
      const { SQLiteSettingsRepository } = require('./settingsRepository');
      const repo = new SQLiteSettingsRepository('pactpal.db');
      repo.set('themeId', 'brutalist');
      repo.set('modePreference', 'dark');

      const { useThemeStore } = require('./themeStore');
      themeId = useThemeStore.getState().themeId;
      modePreference = useThemeStore.getState().modePreference;
      mode = useThemeStore.getState().mode;
    });
    expect(themeId!).toBe('brutalist');
    expect(modePreference!).toBe('dark');
    expect(mode!).toBe('dark');
  });

  it('falls back to defaults when no themeId/modePreference was ever persisted', () => {
    let themeId: string;
    let modePreference: string;
    jest.isolateModules(() => {
      const { useThemeStore } = require('./themeStore');
      themeId = useThemeStore.getState().themeId;
      modePreference = useThemeStore.getState().modePreference;
    });
    expect(themeId!).toBe('default');
    expect(modePreference!).toBe('system');
  });

  it('falls back to default when a previously persisted themeId is no longer in the registry', () => {
    let themeId: string;
    jest.isolateModules(() => {
      const { SQLiteSettingsRepository } = require('./settingsRepository');
      const repo = new SQLiteSettingsRepository('pactpal.db');
      repo.set('themeId', 'sunrise');

      const { useThemeStore } = require('./themeStore');
      themeId = useThemeStore.getState().themeId;
    });
    expect(themeId!).toBe('default');
  });

  it('setThemeId writes through to the settings repository', () => {
    let storedThemeId: string | undefined;
    jest.isolateModules(() => {
      const { useThemeStore } = require('./themeStore');
      useThemeStore.getState().setThemeId('terminal');

      const { SQLiteSettingsRepository } = require('./settingsRepository');
      storedThemeId = new SQLiteSettingsRepository('pactpal.db').get('themeId');
    });
    expect(storedThemeId).toBe('terminal');
  });

  it('setModePreference writes through to the settings repository', () => {
    let storedModePreference: string | undefined;
    jest.isolateModules(() => {
      const { useThemeStore } = require('./themeStore');
      useThemeStore.getState().setModePreference('light');

      const { SQLiteSettingsRepository } = require('./settingsRepository');
      storedModePreference = new SQLiteSettingsRepository('pactpal.db').get('modePreference');
    });
    expect(storedModePreference).toBe('light');
  });
});
