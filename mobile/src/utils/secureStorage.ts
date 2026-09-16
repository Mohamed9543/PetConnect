import AsyncStorage from "@react-native-async-storage/async-storage";

// expo-secure-store was tried here for the auth token (Keychain/Keystore
// instead of plain AsyncStorage) but caused an immediate native crash
// ("keeps stopping", before any JS/React code runs) on the test device —
// reproduced across newArchEnabled true and false, with no JS-level error
// to catch since the crash happens below the JS bridge. Reverted to
// AsyncStorage, which is what this app used before and is known to work.
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return withTimeout(AsyncStorage.getItem(key), 5000, null);
  },
  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  },
};
