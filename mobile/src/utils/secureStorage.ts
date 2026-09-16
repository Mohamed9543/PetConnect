import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The auth token is small and sensitive, so it belongs in the OS-backed
// keychain/keystore rather than AsyncStorage's unencrypted storage. Web has
// no keychain equivalent, so it falls back to localStorage there.

// authStore.restore() awaits getItem() before the app can render anything
// (see app/_layout.tsx's isReady gate). A try/catch there only helps if
// SecureStore's native call actually rejects — if the Keystore hangs
// without ever resolving *or* rejecting on some device, `await` suspends
// forever and no catch/finally runs, leaving a permanent blank screen. This
// race forces the promise to settle either way.
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
    if (Platform.OS === "web") return AsyncStorage.getItem(key);
    return withTimeout(SecureStore.getItemAsync(key), 5000, null);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};
