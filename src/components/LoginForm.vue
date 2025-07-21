<template>
  <div class="login-form-container">
    <div class="card">
      <div class="card-header text-center">
        <h4 class="mb-0">Logowanie</h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              type="email"
              class="form-control"
              id="email"
              v-model="formData.email"
              :class="{ 'is-invalid': errors.email }"
              required
              autocomplete="email"
            />
            <div v-if="errors.email" class="invalid-feedback">
              {{ errors.email }}
            </div>
          </div>

          <!-- Hasło -->
          <div class="mb-3">
            <label for="password" class="form-label">Hasło</label>
            <div class="input-group">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                id="password"
                v-model="formData.password"
                :class="{ 'is-invalid': errors.password }"
                required
                autocomplete="current-password"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="togglePasswordVisibility"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div v-if="errors.password" class="invalid-feedback">
                {{ errors.password }}
              </div>
            </div>
          </div>

          <!-- Błąd logowania -->
          <div v-if="userStore.loginError" class="alert alert-danger">
            {{ userStore.loginError }}
          </div>

          <!-- Przycisk logowania -->
          <div class="d-grid">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="userStore.isLoading || !isFormValid"
            >
              <span
                v-if="userStore.isLoading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ userStore.isLoading ? 'Logowanie...' : 'Zaloguj się' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';

export default {
  name: 'LoginForm',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    
    const formData = reactive({
      email: '',
      password: '',
    });

    const errors = reactive({
      email: null,
      password: null,
    });

    const showPassword = ref(false);

    const isFormValid = computed(() => {
      return formData.email.trim() !== '' && 
             formData.password.trim() !== '' && 
             !errors.email && 
             !errors.password;
    });

    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        return 'Email jest wymagany';
      }
      if (!emailRegex.test(email)) {
        return 'Niepoprawny format email';
      }
      return null;
    };

    const validatePassword = (password) => {
      if (!password) {
        return 'Hasło jest wymagane';
      }
      if (password.length < 3) {
        return 'Hasło musi mieć co najmniej 3 znaki';
      }
      return null;
    };

    const validateForm = () => {
      errors.email = validateEmail(formData.email);
      errors.password = validatePassword(formData.password);
      
      return !errors.email && !errors.password;
    };

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value;
    };

    const handleLogin = async () => {
      if (!validateForm()) {
        return;
      }

      const result = await userStore.login(formData.email, formData.password);
      
      if (result.success) {
        // Przekieruj na stronę główną lub wcześniej odwiedzaną
        const redirect = router.currentRoute.value.query.redirect || '/';
        router.push(redirect);
      }
    };

    return {
      formData,
      errors,
      showPassword,
      isFormValid,
      userStore,
      togglePasswordVisibility,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.login-form-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.card {
  width: 100%;
  max-width: 400px;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  background-color: #051330;
  color: white;
  border-bottom: none;
}

.form-label {
  font-weight: 500;
  color: #333;
}

.btn-primary {
  background-color: #051330;
  border-color: #051330;
}

.btn-primary:hover {
  background-color: #072244;
  border-color: #072244;
}

.alert-danger {
  font-size: 0.9rem;
}

.input-group .btn-outline-secondary {
  border-left: none;
}

.input-group .form-control:focus + .btn-outline-secondary {
  border-color: #86b7fe;
}
</style>
