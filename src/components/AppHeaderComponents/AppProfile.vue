<template>
    <div class="app-profile me-5">
      <div class="d-flex align-items-center">
        <div class="user-info me-3 text-end" v-if="userStore.user">
          <div class="user-name">{{ userStore.user.name || 'Użytkownik' }}</div>
          <div class="user-email text-muted small">{{ userStore.user.email || '' }}</div>
        </div>
        <img
          :src="profileImageUrl"
          alt="Profile"
          class="rounded-circle profile-pic"
          id="profileDropdown"
          data-bs-toggle="dropdown"
        />
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
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
      </div>
    </div>
  </template>
  
  <script>
  import { computed } from 'vue';
  import { useUserStore } from '@/store/userStore';
  import { useRouter } from 'vue-router';

  export default {
    name: "AppProfile",
    setup() {
      const userStore = useUserStore();
      const router = useRouter();

      const profileImageUrl = computed(() => {
        // Możesz użyć obrazka użytkownika z API lub domyślnego
        if (userStore.user?.avatar) {
          return userStore.user.avatar;
        }
        // Użyj Gravatar lub domyślnego obrazka
        return 'https://via.placeholder.com/80';
      });

      const handleLogout = async () => {
        const result = await userStore.logout();
        if (result.success) {
          router.push('/login');
        }
      };

      return {
        userStore,
        profileImageUrl,
        handleLogout,
      };
    },
  };
  </script>
  
  <style scoped>
  .profile-pic {
    width: 80px;
    height: 80px;
    cursor: pointer;
    border: 2px solid #fff;
    transition: transform 0.2s;
  }

  .profile-pic:hover {
    transform: scale(1.05);
  }

  .user-info {
    color: white;
  }

  .user-name {
    font-weight: 500;
    font-size: 0.95rem;
  }

  .user-email {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .dropdown-item:disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  </style>
  