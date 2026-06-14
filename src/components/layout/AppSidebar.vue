<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/userStore";

defineProps<{ mobileOpen: boolean }>();
const emit = defineEmits<{ close: [] }>();

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const navItems = [
  {
    label: "Dashboard",
    to: "/",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`,
  },
  {
    label: "Placówki",
    to: "/placowki",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>`,
  },
  {
    label: "Import RSPO",
    to: "/import",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>`,
  },
  {
    label: "Auto-sync RSPO",
    to: "/auto-sync",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>`,
  },
  {
    label: "Użytkownicy",
    to: "/uzytkownicy",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>`,
    adminOnly: true,
  },
];

function isActive(to: string) {
  return to === "/" ? route.path === "/" : route.path.startsWith(to);
}

function navigate(to: string) {
  router.push(to);
  emit("close");
}

function logout() {
  userStore.logout();
  router.push("/login");
}
</script>

<template>
  <aside
    :class="[
      'w-64 shrink-0 bg-[#051330] flex flex-col',
      'fixed inset-y-0 left-0 z-30 lg:static lg:inset-auto',
      'transition-transform duration-200 ease-in-out',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <div class="px-6 py-5 border-b border-white/10 flex items-center justify-between">
      <div>
        <h1 class="text-white font-semibold text-base leading-tight">
          System Zarządzania
        </h1>
        <p class="text-white/50 text-xs mt-0.5">Placówki RSPO</p>
      </div>
      <button
        class="lg:hidden p-1.5 rounded-md text-white/60 hover:bg-white/10 transition-colors"
        @click="emit('close')"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <template v-for="item in navItems" :key="item.to">
        <button
          v-if="!item.adminOnly || userStore.isAdmin"
          @click="navigate(item.to)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left',
            isActive(item.to)
              ? 'bg-white/15 text-white font-medium'
              : 'text-white/60 hover:bg-white/8 hover:text-white',
          ]"
        >
          <svg
            class="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            v-html="item.icon"
          />
          {{ item.label }}
        </button>
      </template>
    </nav>

    <div class="px-3 py-4 border-t border-white/10">
      <div class="flex items-center gap-3 px-3 py-2 mb-1">
        <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <span class="text-white text-xs font-medium">
            {{ userStore.user?.firstName?.[0] ?? userStore.user?.email?.[0]?.toUpperCase() ?? "?" }}
          </span>
        </div>
        <div class="min-w-0">
          <p class="text-white text-xs font-medium truncate">
            {{ userStore.user?.firstName ? `${userStore.user.firstName} ${userStore.user.lastName}` : userStore.user?.email ?? "Użytkownik" }}
          </p>
          <p class="text-white/40 text-xs truncate">{{ userStore.user?.email }}</p>
        </div>
      </div>
      <button
        @click="logout"
        class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/60 hover:bg-white/8 hover:text-white transition-colors"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Wyloguj się
      </button>
    </div>
  </aside>
</template>
