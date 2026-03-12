import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authService } from "@/services/authService";

export const useUserStore = defineStore(
  "user",
  () => {
    const authKey = ref<string | null>(null);
    const user = ref<{
      email?: string;
      firstName?: string;
      lastName?: string;
    } | null>(null);
    const isLoading = ref(false);
    const loginError = ref<string | null>(null);

    const isAuthenticated = computed(() => !!authKey.value);

    function setAuthKey(key: string) {
      authKey.value = key;
      loginError.value = null;
    }

    function clearAuthKey() {
      authKey.value = null;
      user.value = null;
      loginError.value = null;
    }

    function setUser(userData: typeof user.value) {
      user.value = userData;
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
      setAuthKey,
      clearAuthKey,
      setUser,
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
