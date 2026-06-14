import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authService } from "@/services/authService";
import api from "@/services/api";

export interface UserProfile {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  idRole?: number;
}

export const useUserStore = defineStore(
  "user",
  () => {
    const authKey = ref<string | null>(null);
    const user = ref<UserProfile | null>(null);
    const isLoading = ref(false);
    const loginError = ref<string | null>(null);

    const isAuthenticated = computed(() => !!authKey.value);
    const isAdmin = computed(() => user.value?.idRole === 1);

    function setAuthKey(key: string) {
      authKey.value = key;
      loginError.value = null;
    }

    function clearAuthKey() {
      authKey.value = null;
      user.value = null;
      loginError.value = null;
    }

    function setUser(userData: UserProfile | null) {
      user.value = userData;
    }

    async function fetchCurrentUser() {
      if (!authKey.value) return;
      try {
        const response = await api.get("/api/user/me");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch current user profile", error);
      }
    }

    async function login(
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> {
      isLoading.value = true;
      loginError.value = null;

      try {
        const result = await authService.login(email, password);

        if (result.success && result.token) {
          setAuthKey(result.token);
          await fetchCurrentUser();
          return { success: true };
        } else {
          loginError.value = result.error || "Błąd logowania";
          return { success: false, error: result.error };
        }
      } catch {
        loginError.value = "Wystąpił nieoczekiwany błąd";
        return { success: false, error: "Wystąpił nieoczekiwany błąd" };
      } finally {
        isLoading.value = false;
      }
    }

    function logout() {
      clearAuthKey();
    }

    return {
      authKey,
      user,
      isLoading,
      loginError,
      isAuthenticated,
      isAdmin,
      setAuthKey,
      clearAuthKey,
      setUser,
      fetchCurrentUser,
      login,
      logout,
    };
  },
  {
    persist: {
      pick: ["authKey", "user"],
    },
  },
);
