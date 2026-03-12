import api from "@/services/api";

export const authService = {
  async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const response = await api.post("/api/user/login", {
        email,
        password,
      });

      return {
        success: true,
        token: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      let errorMessage = "Błąd podczas logowania";

      if (axiosError.response?.status === 401) {
        errorMessage = "Nieprawidłowe hasło";
      } else if (axiosError.response?.status === 404) {
        errorMessage = "Użytkownik nie istnieje";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  logout(): Promise<void> {
    return Promise.resolve();
  },
};
