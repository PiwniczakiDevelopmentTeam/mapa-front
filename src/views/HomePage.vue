<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import api from "@/services/api";

interface SyncStatus {
  actualPage: number;
  isSyncInProgress: boolean;
  invalidRspoNumbers?: number[];
  exceptions?: string[];
}

const totalSchools = ref<number | null>(null);
const missingInOurDb = ref<number | null>(null); // present in RSPO, missing locally
const missingInRspo = ref<number | null>(null);  // present locally, missing in RSPO
const syncStatus = ref<SyncStatus | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function unwrapNumber(res: { data: unknown }): number | null {
  if (typeof res.data === "number") return res.data;
  return null;
}

async function fetchCount(url: string): Promise<number | null> {
  try {
    const res = await api.get<number>(url);
    return unwrapNumber(res);
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    // GetSchoolsCount returns 404 when count is 0 (backend quirk).
    if (status === 404) return 0;
    return null;
  }
}

async function fetchSyncStatus(): Promise<void> {
  try {
    const res = await api.get<SyncStatus>("/api/Schools/GetRSPOBackgroundSyncProgress");
    syncStatus.value = res.data;
  } catch {
    // leave previous value
  }
}

async function fetchAll(): Promise<void> {
  loading.value = true;
  error.value = null;
  const [total, missingDb, missingRspo] = await Promise.all([
    fetchCount("/api/Schools/GetSchoolsCount"),
    fetchCount("/api/Schools/GetMissingSchoolsInSchoolsTableCount"),
    fetchCount("/api/Schools/GetMissingSchoolsInRSPOTableCount"),
    fetchSyncStatus(),
  ]);
  totalSchools.value = total;
  missingInOurDb.value = missingDb;
  missingInRspo.value = missingRspo;
  loading.value = false;
}

const syncStatusLabel = computed(() => {
  if (!syncStatus.value) return "—";
  return syncStatus.value.isSyncInProgress ? "W trakcie" : "Bezczynny";
});

const syncStatusSub = computed(() => {
  if (!syncStatus.value) return "—";
  if (syncStatus.value.isSyncInProgress) {
    return `Strona ${syncStatus.value.actualPage.toLocaleString("pl-PL")}`;
  }
  const exc = syncStatus.value.exceptions?.length ?? 0;
  const invalid = syncStatus.value.invalidRspoNumbers?.length ?? 0;
  if (exc > 0) return `Ostatnio: ${exc} ${exc === 1 ? "wyjątek" : "wyjątków"}`;
  if (invalid > 0) return `Pominięto ${invalid} rekordów`;
  return "Gotowy do uruchomienia";
});

const syncStatusColor = computed(() => {
  if (!syncStatus.value) return "bg-gray-400";
  if (syncStatus.value.isSyncInProgress) return "bg-amber-600";
  if ((syncStatus.value.exceptions?.length ?? 0) > 0) return "bg-red-600";
  return "bg-emerald-600";
});

const fmt = (v: number | null): string => (v === null ? "—" : v.toLocaleString("pl-PL"));

const stats = computed(() => [
  {
    label: "Placówki w systemie",
    value: fmt(totalSchools.value),
    sub: "w lokalnej bazie",
    color: "bg-[#051330]",
  },
  {
    label: "Do dodania z RSPO",
    value: fmt(missingInOurDb.value),
    sub: "obecne w RSPO, brak u nas",
    color: "bg-blue-600",
  },
  {
    label: "Nieistniejące w RSPO",
    value: fmt(missingInRspo.value),
    sub: "u nas, brak w RSPO",
    color: "bg-red-600",
  },
  {
    label: "Status integracji",
    value: syncStatusLabel.value,
    sub: syncStatusSub.value,
    color: syncStatusColor.value,
    smallValue: true,
  },
]);

const quickLinks = [
  {
    label: "Lista placówek",
    desc: "Przeglądaj, wyszukuj i filtruj placówki",
    to: "/placowki",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>`,
  },
  {
    label: "Import z RSPO",
    desc: "Pobierz dane do lokalnej kopii RSPO",
    to: "/import",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>`,
  },
  {
    label: "Auto-sync RSPO",
    desc: "Wprowadź dane z RSPO do aktywnych placówek",
    to: "/auto-sync",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>`,
  },
  {
    label: "Użytkownicy",
    desc: "Zarządzaj kontami i uprawnieniami",
    to: "/uzytkownicy",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>`,
  },
];

onMounted(() => {
  fetchAll();
  // Refresh sync status every 5s so dashboard reflects ongoing imports without manual refresh.
  pollTimer = setInterval(fetchSyncStatus, 5000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <AppLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-gray-800 font-semibold text-lg">Dashboard</h2>
        <button
          @click="fetchAll"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50"
          title="Odśwież statystyki"
        >
          <svg class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Odśwież
        </button>
      </div>
    </template>

    <div class="space-y-6">
      <div v-if="error" class="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
        {{ error }}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          :class="[stat.color, 'rounded-lg p-5 text-white']"
        >
          <p class="text-white/70 text-xs uppercase tracking-wide mb-1">{{ stat.label }}</p>
          <p :class="['font-bold mb-0.5', stat.smallValue ? 'text-xl' : 'text-3xl']">
            {{ stat.value }}
          </p>
          <p class="text-white/60 text-xs">{{ stat.sub }}</p>
        </div>
      </div>

      <div>
        <h3 class="text-gray-700 font-medium text-sm mb-3">Szybki dostęp</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
