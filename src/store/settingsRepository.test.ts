import { InMemorySettingsRepository, SQLiteSettingsRepository } from './settingsRepository';

describe('InMemorySettingsRepository', () => {
  it('returns undefined for a key that was never set', () => {
    const repo = new InMemorySettingsRepository();
    expect(repo.get('themeId')).toBeUndefined();
  });

  it('returns the most recently set value for a key', () => {
    const repo = new InMemorySettingsRepository();
    repo.set('themeId', 'brutalist');
    repo.set('themeId', 'terminal');
    expect(repo.get('themeId')).toBe('terminal');
  });
});

describe('SQLiteSettingsRepository', () => {
  it('returns undefined for a key that was never set', () => {
    const repo = new SQLiteSettingsRepository('settings-repo-test-empty.db');
    expect(repo.get('petId')).toBeUndefined();
  });

  it('persists a value across separate repository instances against the same database', () => {
    // Models surviving a force-close: a fresh instance stands in for the app
    // being killed and relaunched, re-opening the same on-device database.
    const dbName = 'settings-repo-test-persist.db';
    const before = new SQLiteSettingsRepository(dbName);
    before.set('themeId', 'brutalist');

    const after = new SQLiteSettingsRepository(dbName);
    expect(after.get('themeId')).toBe('brutalist');
  });

  it('overwrites a previously stored value for the same key', () => {
    const dbName = 'settings-repo-test-overwrite.db';
    const repo = new SQLiteSettingsRepository(dbName);
    repo.set('modePreference', 'dark');
    repo.set('modePreference', 'light');
    expect(new SQLiteSettingsRepository(dbName).get('modePreference')).toBe('light');
  });

  it('keeps separate databases from interfering with each other', () => {
    const a = new SQLiteSettingsRepository('settings-repo-test-a.db');
    const b = new SQLiteSettingsRepository('settings-repo-test-b.db');
    a.set('themeId', 'terminal');
    expect(b.get('themeId')).toBeUndefined();
  });
});
