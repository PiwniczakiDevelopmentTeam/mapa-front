import axios from "axios";
import { useUserStore } from "@/stores/userStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.authKey) {
      config.headers.Authorization = `Bearer ${userStore.authKey}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearAuthKey();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
