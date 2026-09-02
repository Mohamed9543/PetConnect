import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your machine's LAN IP when testing on a physical device,
// e.g. "http://192.168.1.10:5000/api"
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
