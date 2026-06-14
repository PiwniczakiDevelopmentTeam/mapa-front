<script setup lang="ts">
import { ref, computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/userStore";

const router = useRouter();
const userStore = useUserStore();

const formData = reactive({
  email: "",
  password: "",
});

const errors = reactive({
  email: null as string | null,
  password: null as string | null,
});

const showPassword = ref(false);

watch(
  () => formData.email,
  () => {
    errors.email = null;
  },
);
watch(
  () => formData.password,
  () => {
    errors.password = null;
  },
);

const isFormValid = computed(() => {
  return (
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    !errors.email &&
    !errors.password
  );
});

function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return "Email jest wymagany";
  }
  if (!emailRegex.test(email)) {
    return "Niepoprawny format email";
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) {
    return "Hasło jest wymagane";
  }
  if (password.length < 3) {
    return "Hasło musi mieć co najmniej 3 znaki";
  }
  return null;
}

function validateForm(): boolean {
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password);

  return !errors.email && !errors.password;
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}

async function handleLogin() {
  if (!validateForm()) {
    return;
  }

  const result = await userStore.login(formData.email, formData.password);

  if (result.success) {
    const redirect =
      (router.currentRoute.value.query.redirect as string) || "/dashboard";
    router.push(redirect);
  }
}
</script>

<template>
  <div class="w-full">
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      <div class="bg-[#051330] text-white text-center py-4">
        <h4 class="text-lg font-medium">Logowanie</h4>
      </div>
      <div class="p-6">
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Email</label
            >
            <input
              type="email"
              id="email"
              v-model="formData.email"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.email ? 'border-red-500' : 'border-gray-300',
              ]"
              required
              autocomplete="email"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-500">
              {{ errors.email }}
            </p>
          </div>

          <div class="mb-4">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Hasło</label
            >
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="formData.password"
                :class="[
                  'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.password ? 'border-red-500' : 'border-gray-300',
                ]"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <svg
                  v-if="showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-500">
              {{ errors.password }}
            </p>
          </div>

          <div
            v-if="userStore.loginError"
            class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm"
          >
            {{ userStore.loginError }}
          </div>

          <button
            type="submit"
            :disabled="userStore.isLoading || !isFormValid"
            :class="[
              'w-full py-2 px-4 rounded-md text-white font-medium transition-colors',
              userStore.isLoading || !isFormValid
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#051330] hover:bg-[#072244]',
            ]"
          >
            <span
              v-if="userStore.isLoading"
              class="flex items-center justify-center"
            >
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logowanie...
            </span>
            <span v-else>Zaloguj się</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
