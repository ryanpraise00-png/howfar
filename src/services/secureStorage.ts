import * as SecureStore from 'expo-secure-store';

export const SecureKeys = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const secureStorage = {
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  get: (key: string) => SecureStore.getItemAsync(key),
  delete: (key: string) => SecureStore.deleteItemAsync(key),
};
