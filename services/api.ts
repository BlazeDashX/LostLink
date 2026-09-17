import axios from "axios";

import { Platform } from "react-native";

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:3000";
  }
  return "https://lostlink-api-osca.onrender.com";
};

export const BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn(`[API Error] ${error.config?.baseURL}${error.config?.url}:`, error.message);
    return Promise.reject(error);
  }
);