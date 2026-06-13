<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";
import api from "@/services/api";
import { onMounted, ref } from "vue";

interface SyncProgress {
  actualPage: number;
  isSyncInProgress: boolean;
  invalidRspoNumbers?: number[];
  exceptions?: string[];
}

const syncing = ref(false);
const progress = ref<SyncProgress | null>(null);
const error = ref<string | null>(null);
const justFinished = ref(false);

async function pollProgress() {
  try {
    const res = await api.get<SyncProgress>("/api/Schools/GetRSPOBackgroundSyncProgress");
    const wasSyncing = syncing.value;
    progress.value = res.data;
    syncing.value = res.data.isSyncInProgress;
    if (res.data.isSyncInProgress) {
      setTimeout(pollProgress, 2000);
    } else if (wasSyncing) {
      justFinished.value = true;
    }
  } catch {
    syncing.value = false;
  }
}

async function startSync() {
  if (syncing.value) return;
  error.value = null;
  justFinished.value = false;
  try {
    await api.get("/api/Schools/GetDataFromRSPO");
    syncing.value = true;
    // small delay so backend has time to flip IsSyncInProgress
    setTimeout(pollProgress, 500);
  } catch {
    error.value = "Nie udało się uruchomić synchronizacji.";
    syncing.value = false;
  }
}

// Check on mount whether a sync is already running (e.g. user navigated away mid-sync).
onMounted(pollProgress);
</script>

<template>
  <AppLayout>
    <template #header>
      <h2 class="text-gray-800 font-semibold text-lg">Import z RSPO</h2>
    </template>

    <div class="space-y-4 max-w-2xl">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="font-medium text-gray-800 mb-1">Synchronizacja z rejestrem RSPO</h3>
        <p class="text-gray-500 text-sm mb-5">
          Pobiera dane wszystkich placówek z publicznego API RSPO i zapisuje je
          do <strong>lokalnej kopii RSPO</strong> (tabeli <code class="px-1 py-0.5 bg-gray-100 rounded text-xs">SchoolsFromRSPO</code>) —
          odrębnej od tabeli aktywnych placówek. Aby przenieść te dane na mapę, użyj „Auto-sync RSPO".
        </p>

        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <!-- In-progress indicator -->
        <div v-if="syncing" class="mb-5 space-y-2">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-gray-800">
              <svg class="animate-spin w-4 h-4 text-[#051330]" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="font-medium">Trwa import z RSPO…</span>
            </div>
            <span v-if="progress && progress.actualPage > 0" class="text-xs text-gray-500 font-mono">
              Strona {{ progress.actualPage.toLocaleString("pl-PL") }}
            </span>
          </div>
          <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full w-1/3 bg-[#051330] rounded-full progress-indeterminate" />
          </div>
          <p class="text-xs text-gray-400">
            API RSPO nie podaje całkowitej liczby stron — postęp jest pokazywany jako licznik bieżącej strony.
          </p>
        </div>

        <!-- Completion summary -->
        <div
          v-else-if="justFinished && progress"
          class="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-sm"
        >
          <div class="flex items-center gap-2 font-medium">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Import zakończony</span>
          </div>
          <div class="text-xs text-emerald-600/90 mt-1 space-x-2">
            <span>Pobrano <strong>{{ progress.actualPage.toLocaleString("pl-PL") }}</strong> stron</span>
            <template v-if="(progress.invalidRspoNumbers?.length ?? 0) > 0">
              <span>·</span>
              <span>pominięto {{ progress.invalidRspoNumbers!.length }} rekordów</span>
            </template>
            <template v-if="(progress.exceptions?.length ?? 0) > 0">
              <span>·</span>
              <span>{{ progress.exceptions!.length }} wyjątków</span>
            </template>
          </div>
        </div>

        <button
          @click="startSync"
          :disabled="syncing"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors',
            syncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#051330] hover:bg-[#072244]',
          ]"
        >
          <svg v-if="syncing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          {{ syncing ? "Synchronizacja..." : "Uruchom synchronizację" }}
        </button>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="font-medium text-gray-800 mb-3">Informacje</h3>
        <ul class="space-y-2 text-sm text-gray-600">
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/>
            </svg>
            <span>
              <strong>Wszystkie dane w lokalnej kopii RSPO zostają usunięte</strong>
              przed importem i zastąpione świeżymi rekordami z API RSPO.
              Tabela aktywnych placówek nie jest tym dotknięta.
            </span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-[#051330] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Import pobiera dane z API RSPO (api-rspo.men.gov.pl).
          </li>
        </ul>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
@keyframes progress-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
.progress-indeterminate {
  animation: progress-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
</style>
