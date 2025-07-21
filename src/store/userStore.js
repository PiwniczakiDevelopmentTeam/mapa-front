import { defineStore } from "pinia";
import { authService } from "@/services/authService";

export const useUserStore = defineStore("user", {
  state: () => ({
    authKey: null,
    user: null,
    isLoading: false,
    loginError: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.authKey,
  },
  actions: {
    setAuthKey(key) {
      this.authKey = key;
      this.loginError = null;
    },
    
    clearAuthKey() {
      this.authKey = null;
      this.user = null;
      this.loginError = null;
    },

    setUser(userData) {
      this.user = userData;
    },

    async login(email, password) {
      this.isLoading = true;
      this.loginError = null;

      try {
        const result = await authService.login(email, password);
        
        if (result.success) {
          this.setAuthKey(result.token);
          // Jeśli API zwraca dane użytkownika, zapisz je
          if (result.data.user) {
            this.setUser(result.data.user);
          }
          return { success: true };
        } else {
          this.loginError = result.error;
          return { success: false, error: result.error };
        }
      } catch (error) {
        this.loginError = "Wystąpił nieoczekiwany błąd";
        return { success: false, error: "Wystąpił nieoczekiwany błąd" };
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      this.isLoading = true;
      try {
        await authService.logout();
        this.clearAuthKey();
        return { success: true };
      } catch (error) {
        console.error("Błąd podczas wylogowania:", error);
        // Wyczyść dane lokalne nawet jeśli wystąpił błąd
        this.clearAuthKey();
        return { success: false, error: "Błąd podczas wylogowania" };
      } finally {
        this.isLoading = false;
      }
    },
  },
  persist: {
    paths: ["authKey", "user"],
  }
});