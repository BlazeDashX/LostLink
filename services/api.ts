import axios from "axios";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://lostlink-api-osca.onrender.com";

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