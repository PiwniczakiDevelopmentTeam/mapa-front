import api from './api';

export const authService = {
  /**
   * Logowanie użytkownika
   * @param {string} email - Email użytkownika
   * @param {string} password - Hasło użytkownika
   * @returns {Promise<Object>} - Obiekt z tokenem JWT
   */
  async login(email, password) {
    try {
      const response = await api.post('/api/user/login', {
        email,
        password
      });
      
      return {
        success: true,
        token: response.data.token || response.data,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Błąd podczas logowania',
        status: error.response?.status
      };
    }
  },

  /**
   * Wylogowanie użytkownika
   */
  logout() {
    // Tu można dodać dodatkową logikę wylogowania jeśli API tego wymaga
    return Promise.resolve();
  },

  /**
   * Sprawdzenie czy token jest ważny
   * @param {string} token - Token JWT
   * @returns {Promise<boolean>}
   */
  async validateToken(token) {
    try {
      // Można dodać endpoint do walidacji tokena jeśli API go udostępnia
      // Na razie zakładamy że token jest ważny jeśli istnieje
      return !!token;
    } catch (error) {
      return false;
    }
  }
};
