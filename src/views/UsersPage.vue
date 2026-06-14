<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import api from "@/services/api";
import { useUserStore } from "@/stores/userStore";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  idRole: number;
}

const userStore = useUserStore();
const users = ref<User[]>([]);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);

// Modal states
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const isEditMode = ref(false);

const selectedUser = ref<User | null>(null);
const deleteTargetUser = ref<User | null>(null);

// Form data for editing/adding
const editForm = ref({
  email: "",
  firstName: "",
  lastName: "",
  idRole: 2,
  password: ""
});

const formErrors = ref({
  email: "",
  firstName: "",
  lastName: "",
  password: ""
});

async function fetchUsers() {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const response = await api.get("/api/user");
    const rawData = response.data;
    users.value = Array.isArray(rawData) ? rawData : (rawData as any).$values ?? [];
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || "Nie udało się pobrać listy użytkowników.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchUsers();
});

function openEditModal(user: User) {
  isEditMode.value = true;
  selectedUser.value = user;
  editForm.value = {
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    idRole: user.idRole,
    password: ""
  };
  formErrors.value = {
    email: "",
    firstName: "",
    lastName: "",
    password: ""
  };
  showEditModal.value = true;
}

function openAddModal() {
  isEditMode.value = false;
  selectedUser.value = null;
  editForm.value = {
    email: "",
    firstName: "",
    lastName: "",
    idRole: 2,
    password: ""
  };
  formErrors.value = {
    email: "",
    firstName: "",
    lastName: "",
    password: ""
  };
  showEditModal.value = true;
}

function openDeleteModal(user: User) {
  if (user.id === userStore.user?.id) {
    alert("Nie możesz usunąć samego siebie!");
    return;
  }
  deleteTargetUser.value = user;
  showDeleteModal.value = true;
}

const isFormValid = computed(() => {
  const baseValid =
    (editForm.value.email || "").trim() !== "" &&
    (editForm.value.firstName || "").trim() !== "" &&
    (editForm.value.lastName || "").trim() !== "" &&
    !formErrors.value.email &&
    !formErrors.value.firstName &&
    !formErrors.value.lastName &&
    !formErrors.value.password;

  if (isEditMode.value) {
    return baseValid;
  }
  return baseValid && editForm.value.password.trim() !== "";
});

function validateForm() {
  let valid = true;
  formErrors.value = {
    email: "",
    firstName: "",
    lastName: "",
    password: ""
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!editForm.value.email) {
    formErrors.value.email = "Email jest wymagany";
    valid = false;
  } else if (!emailRegex.test(editForm.value.email)) {
    formErrors.value.email = "Niepoprawny format email";
    valid = false;
  }

  if (!(editForm.value.firstName || "").trim()) {
    formErrors.value.firstName = "Imię jest wymagane";
    valid = false;
  }

  if (!(editForm.value.lastName || "").trim()) {
    formErrors.value.lastName = "Nazwisko jest wymagane";
    valid = false;
  }

  if (!isEditMode.value && !editForm.value.password) {
    formErrors.value.password = "Hasło jest wymagane";
    valid = false;
  } else if (editForm.value.password && editForm.value.password.length < 3) {
    formErrors.value.password = "Hasło musi mieć co najmniej 3 znaki";
    valid = false;
  }

  return valid;
}

async function handleSaveUser() {
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    if (isEditMode.value) {
      if (!selectedUser.value) return;
      await api.put(`/api/user/${selectedUser.value.id}`, {
        email: editForm.value.email,
        firstName: editForm.value.firstName,
        lastName: editForm.value.lastName,
        idRole: editForm.value.idRole,
        password: editForm.value.password || null
      });
      // If the updated user is the currently logged-in user, refresh their store data as well!
      if (selectedUser.value.id === userStore.user?.id) {
        await userStore.fetchCurrentUser();
      }
    } else {
      await api.post("/api/user/Register", {
        email: editForm.value.email,
        firstName: editForm.value.firstName,
        lastName: editForm.value.lastName,
        password: editForm.value.password,
        idRole: editForm.value.idRole
      });
    }
    showEditModal.value = false;
    await fetchUsers();
  } catch (err: any) {
    const errorText = err.response?.data || "Wystąpił błąd podczas zapisywania zmian.";
    alert(errorText);
  } finally {
    isLoading.value = false;
  }
}

async function handleDeleteUser() {
  if (!deleteTargetUser.value) return;

  isLoading.value = true;
  try {
    await api.delete(`/api/user/${deleteTargetUser.value.id}`);
    showDeleteModal.value = false;
    await fetchUsers();
  } catch (err: any) {
    const errorText = err.response?.data || "Wystąpił błąd podczas usuwania użytkownika.";
    alert(errorText);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <AppLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h2 class="text-gray-900 font-bold text-xl tracking-tight">Użytkownicy</h2>
          <p class="text-gray-500 text-xs mt-0.5">Zarządzaj kontami użytkowników i ich uprawnieniami w systemie</p>
        </div>
        <button 
          @click="openAddModal"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#051330] hover:bg-[#08204d] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Dodaj użytkownika
        </button>
      </div>
    </template>

    <!-- Error state -->
    <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-3">
      <svg class="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>{{ errorMsg }}</div>
    </div>

    <!-- Users Table Container -->
    <div class="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden transition-all duration-250">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-semibold uppercase tracking-wider text-xs">
              <th class="px-6 py-4">Użytkownik</th>
              <th class="px-6 py-4">Email</th>
              <th class="px-6 py-4">Rola</th>
              <th class="px-6 py-4 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="isLoading && users.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-gray-400">
                <div class="flex flex-col items-center justify-center gap-3">
                  <svg class="animate-spin h-8 w-8 text-[#051330]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Wczytywanie listy użytkowników...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="users.length === 0" class="hover:bg-gray-50/50 transition-colors duration-150">
              <td colspan="4" class="px-6 py-12 text-center text-gray-400">
                Brak użytkowników w systemie
              </td>
            </tr>
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50/40 transition-colors duration-150 group">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#051330] to-[#0a2c66] flex items-center justify-center text-white font-medium shadow-sm transition-transform group-hover:scale-105">
                    {{ user.firstName ? user.firstName.charAt(0).toUpperCase() : '' }}{{ user.lastName ? user.lastName.charAt(0).toUpperCase() : '' }}
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">
                      {{ (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Użytkownik' }}
                    </div>
                    <div v-if="user.id === userStore.user?.id" class="text-xs text-blue-600 font-semibold mt-0.5">To Ty</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-gray-600 font-medium">
                {{ user.email }}
              </td>
              <td class="px-6 py-4">
                <span v-if="user.idRole === 1" class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                  Admin
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  Użytkownik
                </span>
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-2.5">
                  <button 
                    @click="openEditModal(user)"
                    class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edytuj
                  </button>
                  <button 
                    @click="openDeleteModal(user)"
                    :disabled="user.id === userStore.user?.id"
                    :class="[
                      'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors',
                      user.id === userStore.user?.id
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50/50'
                        : 'border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer'
                    ]"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Usuń
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" @click="showEditModal = false"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 duration-300 border border-gray-100">
        <div class="bg-[#051330] text-white px-6 py-4 flex items-center justify-between">
          <h3 class="text-base font-bold tracking-wide">
            {{ isEditMode ? 'Edycja Użytkownika' : 'Dodawanie Użytkownika' }}
          </h3>
          <button @click="showEditModal = false" class="text-white/70 hover:text-white transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSaveUser" class="p-6 space-y-4">
          <div>
            <label for="firstName" class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Imię</label>
            <input 
              type="text" 
              id="firstName" 
              v-model="editForm.firstName" 
              :class="[
                'w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all duration-200',
                formErrors.firstName ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300'
              ]"
            />
            <p v-if="formErrors.firstName" class="text-red-500 text-xs mt-1">{{ formErrors.firstName }}</p>
          </div>

          <div>
            <label for="lastName" class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nazwisko</label>
            <input 
              type="text" 
              id="lastName" 
              v-model="editForm.lastName" 
              :class="[
                'w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all duration-200',
                formErrors.lastName ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300'
              ]"
            />
            <p v-if="formErrors.lastName" class="text-red-500 text-xs mt-1">{{ formErrors.lastName }}</p>
          </div>

          <div>
            <label for="email" class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="editForm.email" 
              :class="[
                'w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all duration-200',
                formErrors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300'
              ]"
            />
            <p v-if="formErrors.email" class="text-red-500 text-xs mt-1">{{ formErrors.email }}</p>
          </div>

          <div>
            <label for="idRole" class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Rola</label>
            <select 
              id="idRole" 
              v-model="editForm.idRole" 
              class="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all duration-200 cursor-pointer"
            >
              <option :value="1">Admin</option>
              <option :value="2">Użytkownik</option>
            </select>
          </div>

          <div class="pt-2 border-t border-gray-100">
            <label for="password" class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              {{ isEditMode ? 'Nowe hasło (opcjonalnie)' : 'Hasło' }}
            </label>
            <input 
              type="password" 
              id="password" 
              v-model="editForm.password" 
              :placeholder="isEditMode ? 'Pozostaw puste, aby nie zmieniać' : 'Wprowadź hasło'"
              :class="[
                'w-full px-3.5 py-2 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all duration-200',
                formErrors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300'
              ]"
            />
            <p v-if="formErrors.password" class="text-red-500 text-xs mt-1">{{ formErrors.password }}</p>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              @click="showEditModal = false" 
              class="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              Anuluj
            </button>
            <button 
              type="submit" 
              :disabled="isLoading || !isFormValid"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-[#051330] hover:bg-[#08204d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Zapisywanie...' : (isEditMode ? 'Zapisz zmiany' : 'Dodaj użytkownika') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete User Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" @click="showDeleteModal = false"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 duration-300 border border-gray-100 p-6 space-y-4">
        <div class="flex items-center gap-3 text-red-600">
          <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-bold text-gray-900">Usuwanie Użytkownika</h3>
          </div>
        </div>

        <p class="text-sm text-gray-600">
          Czy na pewno chcesz usunąć użytkownika <span class="font-bold text-gray-900">{{ deleteTargetUser?.firstName }} {{ deleteTargetUser?.lastName }}</span> ({{ deleteTargetUser?.email }})? Tej operacji nie można cofnąć.
        </p>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button 
            type="button" 
            @click="showDeleteModal = false" 
            class="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            Anuluj
          </button>
          <button 
            type="button" 
            @click="handleDeleteUser"
            :disabled="isLoading"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {{ isLoading ? 'Usuwanie...' : 'Usuń użytkownika' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
