<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";

const stats = [
  { label: "Placówki w systemie", value: "—", sub: "z bazy RSPO", color: "bg-[#051330]" },
  { label: "Oczekuje weryfikacji", value: "—", sub: "zmian do akceptacji", color: "bg-amber-600" },
  { label: "Błędy importu", value: "—", sub: "ostatnia synchronizacja", color: "bg-red-600" },
  { label: "Ostatni import", value: "—", sub: "synchronizacja RSPO", color: "bg-emerald-600" },
];

const quickLinks = [
  { label: "Lista placówek", desc: "Przeglądaj, wyszukuj i filtruj placówki", to: "/placowki", icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>` },
  { label: "Import z RSPO", desc: "Uruchom synchronizację danych z rejestru", to: "/import", icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>` },
  { label: "Historia zmian", desc: "Przeglądaj audyt edycji placówek", to: "/audyt", icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>` },
  { label: "Błędy integracji", desc: "Sprawdź nieudane rekordy importu", to: "/bledy", icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>` },
];
</script>

<template>
  <AppLayout>
    <template #header>
      <h2 class="text-gray-800 font-semibold text-lg">Dashboard</h2>
    </template>

    <div class="space-y-6">
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          :class="[stat.color, 'rounded-lg p-5 text-white']"
        >
          <p class="text-white/70 text-xs uppercase tracking-wide mb-1">{{ stat.label }}</p>
          <p class="text-3xl font-bold mb-0.5">{{ stat.value }}</p>
          <p class="text-white/60 text-xs">{{ stat.sub }}</p>
        </div>
      </div>

      <div>
        <h3 class="text-gray-700 font-medium text-sm mb-3">Szybki dostęp</h3>
        <div class="grid grid-cols-2 gap-4">
          <router-link
            v-for="link in quickLinks"
            :key="link.to"
            :to="link.to"
            class="bg-white rounded-lg p-5 flex items-start gap-4 hover:shadow-md transition-shadow border border-gray-100 group"
          >
            <div class="w-10 h-10 rounded-md bg-[#051330]/10 flex items-center justify-center shrink-0 group-hover:bg-[#051330]/20 transition-colors">
              <svg class="w-5 h-5 text-[#051330]" fill="none" viewBox="0 0 24 24" stroke="currentColor" v-html="link.icon" />
            </div>
            <div>
              <p class="text-gray-800 font-medium text-sm">{{ link.label }}</p>
              <p class="text-gray-500 text-xs mt-0.5">{{ link.desc }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
