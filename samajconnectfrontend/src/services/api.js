import axios from "axios";
import { auth } from "../firebase/config";

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
    : "/api"
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else if (api.defaults.headers.common["Authorization"]) {
      // Carry forward the local mock authorization header set by AuthContext
      config.headers.Authorization = api.defaults.headers.common["Authorization"];
    }
  } catch (error) {
    console.error("Error setting auth token:", error);
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token expired — sign out and redirect to login
      auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
