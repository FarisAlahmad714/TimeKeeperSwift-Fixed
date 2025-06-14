import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// App Colors
export const COLORS = {
  // Main theme colors
  accent: '#FF0000',
  background: '#000000',
  surface: '#1F1F2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#808080',
  textTertiary: '#CCCCCC',
  
  // Button gradients
  buttonGradients: {
    green: ['#00FF00', '#00FFFF'],
    red: ['#FF0000', '#FFA500'],
    yellow: ['#FFFF00', '#FFA500'],
    blue: ['#2196F3', '#21CBF3'],
    purple: ['#8B5CF6', '#06B6D4'],
  },
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Alarm colors
  alarmActive: '#FF0000',
  alarmInactive: '#666666',
  snooze: '#2196F3',
  dismiss: '#F44336',
  
  // Space theme
  space: {
    primary: '#8B5CF6',
    secondary: '#06B6D4',
    background: '#0F0C29',
    surface: '#24243e',
    accent: '#F59E0B',
    nebula: '#FF6B9D',
    star: '#FFD700',
  }
};

// Dimensions
export const DIMENSIONS = {
  window: {
    width,
    height,
  },
  
  // Common sizes
  clockSize: width * 0.6,
  iconSize: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
};

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 32,
    hero: 48,
    giant: 64,
  },
  
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
};

// Alarm Settings
export const ALARM_SETTINGS = {
  snoozeMinutes: 9,
  maxSnoozeCount: 3,
  
  repeatOptions: [
    { label: 'None', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Weekdays', value: 'weekdays' },
    { label: 'Custom', value: 'custom' },
  ],
  
  soundOptions: [
    { label: 'Default', value: 'default' },
    { label: 'Ringtone 1', value: 'Ringtone1' },
    { label: 'Ringtone 2', value: 'Ringtone2' },
    { label: 'Ringtone 3', value: 'Ringtone3' },
    { label: 'Angels Harp', value: 'Angels Harp' },
    { label: 'Bell Hammer', value: 'Bell Hammer' },
    { label: 'Dev Special', value: 'Dev Special' },
    { label: 'Galactic Ambulance', value: 'Galactic Ambulance' },
    { label: 'Infinite Lasers', value: 'Infinite Lasers' },
    { label: 'Jeffery\'s Jingle', value: 'Jeffery\'s Jingle' },
    { label: 'Matrix Call', value: 'Matrix Call' },
    { label: 'Melodic Morning', value: 'Melodic Morning' },
    { label: 'Nuclear Awakening', value: 'Nuclear Awakening' },
    { label: 'Office Phone', value: 'Office Phone' },
    { label: 'PBJ Sandwich', value: 'PBJ Sandwich' },
    { label: 'Urgency', value: 'Urgency' },
  ],
};

// World Clock Settings
export const WORLD_CLOCK_SETTINGS = {
  maxClocks: 10,
  updateInterval: 1000, // 1 second
  
  defaultCities: [
    { name: 'New York', timezone: 'America/New_York' },
    { name: 'London', timezone: 'Europe/London' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { name: 'Sydney', timezone: 'Australia/Sydney' },
    { name: 'Los Angeles', timezone: 'America/Los_Angeles' },
    { name: 'Dubai', timezone: 'Asia/Dubai' },
  ],
};

// Timer Settings
export const TIMER_SETTINGS = {
  maxHours: 23,
  maxMinutes: 59,
  maxSeconds: 59,
  
  defaultTimers: [
    { name: 'Quick Timer', duration: 300 }, // 5 minutes
    { name: 'Pomodoro', duration: 1500 }, // 25 minutes
    { name: 'Break', duration: 900 }, // 15 minutes
    { name: 'Long Break', duration: 1800 }, // 30 minutes
  ],
};

// Stopwatch Settings
export const STOPWATCH_SETTINGS = {
  precision: 10, // milliseconds
  maxLaps: 99,
  updateInterval: 10, // 10ms for smooth animation
};

// Animation Settings
export const ANIMATION_SETTINGS = {
  // Durations
  fast: 200,
  normal: 300,
  slow: 500,
  
  // Easing
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Spaceship settings
  spaceship: {
    speed: 2,
    count: 3,
    types: ['explorer', 'cruiser', 'fighter'],
  },
  
  // Drone settings
  drone: {
    speed: 1.5,
    count: 2,
    types: ['quadcopter', 'hexacopter'],
  },
};

// Language Settings
export const LANGUAGE_SETTINGS = {
  supported: [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ],
  
  default: 'en',
};

// Environment Settings
export const ENVIRONMENT_SETTINGS = {
  scenes: [
    { name: 'bedroom', label: 'Bedroom' },
    { name: 'beach', label: 'Beach' },
    { name: 'city', label: 'City' },
    { name: 'neighborhood', label: 'Neighborhood' },
  ],
  
  defaultScene: 'bedroom',
};

// Notification Settings
export const NOTIFICATION_SETTINGS = {
  categories: {
    alarm: 'alarm',
    timer: 'timer',
    reminder: 'reminder',
  },
  
  channels: {
    alarms: {
      name: 'Alarms',
      description: 'Alarm notifications',
      importance: 'high',
      sound: true,
      vibration: true,
    },
    timers: {
      name: 'Timers',
      description: 'Timer notifications',
      importance: 'high',
      sound: true,
      vibration: true,
    },
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  ALARMS: 'alarms',
  WORLD_CLOCKS: 'world_clocks',
  TIMER_HISTORY: 'timer_history',
  STOPWATCH_LAPS: 'stopwatch_laps',
  USER_PREFERENCES: 'user_preferences',
  LANGUAGE: 'language',
  THEME: 'theme',
  FIRST_LAUNCH: 'first_launch',
  APP_VERSION: 'app_version',
};

// App Settings
export const APP_SETTINGS = {
  version: '1.0.0',
  name: 'TimeKeeper',
  description: 'Premium Time Management App',
  developer: 'Your Name',
  
  // Feature flags
  features: {
    animations: true,
    premiumSounds: true,
    multiLanguage: true,
    backgroundImages: true,
    hapticFeedback: true,
  },
  
  // Limits
  limits: {
    maxAlarms: 50,
    maxWorldClocks: 10,
    maxTimerHistory: 100,
    maxStopwatchLaps: 99,
  },
};

// Export all constants
export default {
  COLORS,
  DIMENSIONS,
  TYPOGRAPHY,
  ALARM_SETTINGS,
  WORLD_CLOCK_SETTINGS,
  TIMER_SETTINGS,
  STOPWATCH_SETTINGS,
  ANIMATION_SETTINGS,
  LANGUAGE_SETTINGS,
  ENVIRONMENT_SETTINGS,
  NOTIFICATION_SETTINGS,
  STORAGE_KEYS,
  APP_SETTINGS,
};