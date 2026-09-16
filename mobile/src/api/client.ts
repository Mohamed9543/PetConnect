import axios from "axios";
import { router } from "expo-router";
import { secureStorage } from "../utils/secureStorage";
import { useAuthStore } from "../store/authStore";

// Replace with your machine's LAN IP when testing on a physical device,
// e.g. "http://192.168.1.10:5000/api"
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

// Render's free tier can take 30-50s to wake a sleeping backend from cold
// start, so the timeout needs real headroom above that — this only guards
// against a truly hung request, not a slow-but-alive one.
export const api = axios.create({ baseURL: API_URL, timeout: 45000 });

api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 from any *protected* endpoint means the stored token is expired,
// revoked, or was signed with an old JWT_SECRET — without this, every
// screen just keeps re-sending the dead token and failing forever, with no
// way back to the login screen short of manually clearing app data. Login
// itself also returns 401 for a wrong password, which is a normal, expected
// rejection (not a dead session) and must not trigger this.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthEndpoint) {
      await useAuthStore.getState().logout();
      router.replace("/(auth)/login");
    }
    return Promise.reject(error);
  }
);
