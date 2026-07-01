import AsyncStorage from '@react-native-async-storage/async-storage';

// Thin wrapper keeping the same call-sites as before.
// Swap this for react-native-mmkv when moving to a dev/production build.
export const storage = {
  getString: async (key: string): Promise<string | null> => AsyncStorage.getItem(key),
  set: async (key: string, value: string): Promise<void> => { await AsyncStorage.setItem(key, value); },
  delete: async (key: string): Promise<void> => { await AsyncStorage.removeItem(key); },
};

export const StorageKeys = {
  USER_PROFILE: 'user_profile',
  SETTINGS: 'settings',
} as const;
