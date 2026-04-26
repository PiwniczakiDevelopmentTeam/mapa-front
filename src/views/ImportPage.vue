<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";
import api from "@/services/api";
import { ref } from "vue";

const syncing = ref(false);
const progress = ref<{ currentPage: number; maxPage: number; isSyncInProgress: boolean } | null>(null);
const error = ref<string | null>(null);

async function startSync() {
  syncing.value = true;
  error.value = null;
  try {
    await api.post("/api/schools/sync");
    pollProgress();
  } catch {
    error.value = "Nie udało się uruchomić synchronizacji.";
    syncing.value = false;
  }
}

async function pollProgress() {
  try {
    const res = await api.get("/api/schools/sync/progress");
    progress.value = res.data;
    if (res.data.isSyncInProgress) {
      setTimeout(pollProgress, 2000);
    } else {
      syncing.value = false;
    }
  } catch {
    syncing.value = false;
  }
}

const percent = () =>
  progress.value && progress.value.maxPage > 0
    ? Math.round((progress.value.currentPage / progress.value.maxPage) * 100)
    : 0;
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
          Pobiera dane wszystkich placówek z publicznego API RSPO i aktualizuje lokalną bazę.
          Pola oznaczone jako zweryfikowane ręcznie nie zostaną nadpisane.
        </p>

        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <div v-if="syncing && progress" class="mb-5">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Strona {{ progress.currentPage }} / {{ progress.maxPage }}</span>
            <span>{{ percent() }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-[#051330] h-2 rounded-full transition-all duration-300"
              :style="{ width: percent() + '%' }"
            />
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
            <svg class="w-4 h-4 text-[#051330] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Import pobiera dane stronicami z API RSPO (api-rspo.men.gov.pl).
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-[#051330] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Rekordy z błędami są pomijane i trafiają do rejestru błędów integracji.
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-[#051330] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Pola ręcznie zweryfikowane (manual_override) nie są nadpisywane przez import.
          </li>
        </ul>
      </div>
    </div>
  </AppLayout>
</template>
