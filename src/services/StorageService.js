import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.keys = {
      ALARMS: 'alarms',
      WORLD_CLOCKS: 'world_clocks',
      TIMER_HISTORY: 'timer_history',
      STOPWATCH_LAPS: 'stopwatch_laps',
      USER_PREFERENCES: 'user_preferences',
      LANGUAGE_SETTING: 'language_setting',
      THEME_SETTING: 'theme_setting',
    };
  }

  // Generic storage methods
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`Saved ${key}:`, value);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  async getItem(key, defaultValue = null) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      const result = jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
      console.log(`Loaded ${key}:`, result);
      return result;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultValue;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Removed ${key}`);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  async clearAll() {
    try {
      await AsyncStorage.clear();
      console.log('Cleared all storage');
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Alarm-specific methods
  async saveAlarms(alarms) {
    return await this.setItem(this.keys.ALARMS, alarms);
  }

  async loadAlarms() {
    return await this.getItem(this.keys.ALARMS, []);
  }

  async addAlarm(alarm) {
    const alarms = await this.loadAlarms();
    const newAlarms = [...alarms, alarm];
    await this.saveAlarms(newAlarms);
    return newAlarms;
  }

  async updateAlarm(alarmId, updatedAlarm) {
    const alarms = await this.loadAlarms();
    const updatedAlarms = alarms.map(alarm => 
      alarm.id === alarmId ? { ...alarm, ...updatedAlarm } : alarm
    );
    await this.saveAlarms(updatedAlarms);
    return updatedAlarms;
  }

  async deleteAlarm(alarmId) {
    const alarms = await this.loadAlarms();
    const filteredAlarms = alarms.filter(alarm => alarm.id !== alarmId);
    await this.saveAlarms(filteredAlarms);
    return filteredAlarms;
  }

  // World Clock methods
  async saveWorldClocks(clocks) {
    return await this.setItem(this.keys.WORLD_CLOCKS, clocks);
  }

  async loadWorldClocks() {
    return await this.getItem(this.keys.WORLD_CLOCKS, []);
  }

  async addWorldClock(clock) {
    const clocks = await this.loadWorldClocks();
    const newClocks = [...clocks, clock];
    await this.saveWorldClocks(newClocks);
    return newClocks;
  }

  async deleteWorldClock(clockId) {
    const clocks = await this.loadWorldClocks();
    const filteredClocks = clocks.filter(clock => clock.id !== clockId);
    await this.saveWorldClocks(filteredClocks);
    return filteredClocks;
  }

  async reorderWorldClocks(clocks) {
    return await this.saveWorldClocks(clocks);
  }

  // Timer History methods
  async saveTimerHistory(history) {
    return await this.setItem(this.keys.TIMER_HISTORY, history);
  }

  async loadTimerHistory() {
    return await this.getItem(this.keys.TIMER_HISTORY, []);
  }

  async addTimerEntry(entry) {
    const history = await this.loadTimerHistory();
    const newHistory = [entry, ...history].slice(0, 50); // Keep last 50 entries
    await this.saveTimerHistory(newHistory);
    return newHistory;
  }

  // Stopwatch Laps methods
  async saveStopwatchLaps(laps) {
    return await this.setItem(this.keys.STOPWATCH_LAPS, laps);
  }

  async loadStopwatchLaps() {
    return await this.getItem(this.keys.STOPWATCH_LAPS, []);
  }

  async addLap(lap) {
    const laps = await this.loadStopwatchLaps();
    const newLaps = [...laps, lap];
    await this.saveStopwatchLaps(newLaps);
    return newLaps;
  }

  async clearLaps() {
    await this.saveStopwatchLaps([]);
    return [];
  }

  // User Preferences methods
  async saveUserPreferences(preferences) {
    return await this.setItem(this.keys.USER_PREFERENCES, preferences);
  }

  async loadUserPreferences() {
    const defaultPreferences = {
      language: 'en',
      theme: 'dark',
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeMinutes: 9,
      defaultAlarmSound: 'default',
      timeFormat: '12h', // '12h' or '24h'
    };
    return await this.getItem(this.keys.USER_PREFERENCES, defaultPreferences);
  }

  async updateUserPreference(key, value) {
    const preferences = await this.loadUserPreferences();
    const updatedPreferences = { ...preferences, [key]: value };
    await this.saveUserPreferences(updatedPreferences);
    return updatedPreferences;
  }

  // Language setting
  async saveLanguage(language) {
    return await this.setItem(this.keys.LANGUAGE_SETTING, language);
  }

  async loadLanguage() {
    return await this.getItem(this.keys.LANGUAGE_SETTING, 'en');
  }

  // Theme setting
  async saveTheme(theme) {
    return await this.setItem(this.keys.THEME_SETTING, theme);
  }

  async loadTheme() {
    return await this.getItem(this.keys.THEME_SETTING, 'dark');
  }

  // Utility methods
  async getStorageInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      const info = stores.map(([key, value]) => {
        const size = new Blob([value]).size;
        totalSize += size;
        return {
          key,
          size,
          preview: value ? value.substring(0, 100) + '...' : 'null'
        };
      });

      return {
        totalKeys: keys.length,
        totalSize,
        stores: info
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  // Migration methods for future updates
  async migrateData(fromVersion, toVersion) {
    console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
    // Add migration logic here when needed
  }
}

// Export a singleton instance
export default new StorageService();