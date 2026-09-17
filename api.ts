import axios from "axios";

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const BASE_URL = configuredBaseUrl || "http://localhost:3000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});
