import axios from 'axios';
import { useUserStore } from '@/store/userStore';

// Konfiguracja axios
const api = axios.create({
  baseURL: 'https://api.dev.mapa.tomekb530.me',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - dodawanie tokenu do nagłówków
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
  }
);

// Response interceptor - obsługa błędów autoryzacji
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearAuthKey();
      // Przekierowanie na stronę logowania
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
