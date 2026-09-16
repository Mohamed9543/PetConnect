import axios from "axios";
import { secureStorage } from "../utils/secureStorage";

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
