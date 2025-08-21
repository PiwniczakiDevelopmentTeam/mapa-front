<template>
    <nav class="navbar navbar-expand-md navbar-dark">
      <div class="container">
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainMenu"
          aria-controls="mainMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainMenu">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Strona główna</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/schools">Placówki</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/admin">
                <i class="bi bi-gear me-1"></i>
                Administracja
              </router-link>
            </li>
          </ul>
          
          <!-- Status synchronizacji RSPO -->
          <div class="d-flex align-items-center me-3">
            <SyncProgress />
          </div>
          
          <ul class="navbar-nav ms-auto">
            <li class="nav-item dropdown" v-if="userStore.user">
              <a
                class="nav-link dropdown-toggle"
                href="#"
                id="userDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="bi bi-person-circle me-1"></i>
                {{ userStore.user.name || userStore.user.email || 'Użytkownik' }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i>Profil</a></li>
                <li><a class="dropdown-item" href="#"><i class="bi bi-gear me-2"></i>Ustawienia</a></li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a 
                    class="dropdown-item" 
                    href="#" 
                    @click.prevent="handleLogout"
                    :disabled="userStore.isLoading"
                  >
                    <i class="bi bi-box-arrow-right me-2"></i>
                    {{ userStore.isLoading ? 'Wylogowywanie...' : 'Wyloguj' }}
                  </a>
                </li>
              </ul>
            </li>
            <li class="nav-item" v-else>
              <a 
                class="nav-link" 
                href="#" 
                @click.prevent="handleLogout"
                :disabled="userStore.isLoading"
              >
                <i class="bi bi-box-arrow-right me-1"></i>
                {{ userStore.isLoading ? 'Wylogowywanie...' : 'Wyloguj' }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </template>
  
  <script>
  import { useUserStore } from '@/store/userStore';
  import { useRouter } from 'vue-router';
  import SyncProgress from './SyncProgress.vue';

  export default {
    name: "AppMainMenu",
    components: {
      SyncProgress,
    },
    setup() {
      const userStore = useUserStore();
      const router = useRouter();

      const handleLogout = async () => {
        const result = await userStore.logout();
        if (result.success) {
          router.push('/login');
        }
      };

      return {
        userStore,
        handleLogout,
      };
    },
  };
  </script>

  <style scoped>
  .dropdown-item:disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  .nav-link:disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  </style>