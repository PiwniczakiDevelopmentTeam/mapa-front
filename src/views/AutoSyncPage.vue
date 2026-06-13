<script setup lang="ts">
import { ref } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import api from "@/services/api";

const syncing = ref(false);
const success = ref(false);
const error = ref<string | null>(null);
const showConfirm = ref(false);

function requestSync(): void {
  showConfirm.value = true;
  error.value = null;
  success.value = false;
}

function cancelSync(): void {
  if (syncing.value) return;
  showConfirm.value = false;
}

async function startSync(): Promise<void> {
  syncing.value = true;
  error.value = null;
  success.value = false;
  try {
    await api.put("/api/Schools/SyncRspoToActual");
    success.value = true;
    showConfirm.value = false;
  } catch {
    error.value = "Nie udało się uruchomić auto-synchronizacji.";
  } finally {
    syncing.value = false;
  }
}
</script>

<template>
  <AppLayout>
    <template #header>
      <h2 class="text-gray-800 font-semibold text-lg">Auto-sync z RSPO</h2>
    </template>

    <div class="space-y-4 max-w-2xl">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="font-medium text-gray-800 mb-1">Automatyczna synchronizacja danych z RSPO</h3>
        <p class="text-gray-500 text-sm mb-5">
          Podstawia dane z lokalnej kopii RSPO do tabeli aktywnych placówek.
          Dla każdej szkoły z włączoną flagą <strong>auto-sync</strong> nadpisuje wszystkie pola
          wartościami z RSPO. Brakujące placówki są dodawane jako nowe (z włączonym auto-sync).
          Szkoły z <strong>wyłączonym auto-sync</strong> są pomijane — ich ręcznie wprowadzone dane
          zostają zachowane.
        </p>

        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <div v-if="success" class="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-sm flex items-center gap-2">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Auto-synchronizacja zakończona pomyślnie. Wszystkie placówki z auto-sync zostały zaktualizowane.
        </div>

        <button
          @click="requestSync"
          :disabled="syncing"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors',
            syncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#051330] hover:bg-[#072244]',
          ]"
        >
          <svg v-if="syncing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ syncing ? "Synchronizowanie..." : "Uruchom auto-sync" }}
        </button>
      </div>
    </div>

    <!-- Confirmation modal -->
    <div
      v-if="showConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="cancelSync"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden" role="dialog" aria-modal="true">
        <div class="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-medium text-gray-800">Uruchomić auto-sync?</h3>
            <p class="text-xs text-gray-500 mt-0.5">Operacja nadpisze dane placówek z włączonym auto-sync.</p>
          </div>
        </div>

        <div class="px-5 py-4 space-y-2 text-sm text-gray-700">
          <p>
            Wszystkie placówki z <strong>auto-sync = włączone</strong> zostaną nadpisane wartościami
            z lokalnej kopii RSPO. Placówki z wyłączonym auto-sync zostaną pominięte.
          </p>
          <p class="text-xs text-gray-500">Tej operacji nie można cofnąć bezpośrednio — można jedynie ręcznie skorygować dane po fakcie.</p>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            @click="cancelSync"
            :disabled="syncing"
            class="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anuluj
          </button>
          <button
            type="button"
            @click="startSync"
            :disabled="syncing"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md font-medium text-white bg-[#051330] hover:bg-[#072244] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <svg v-if="syncing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ syncing ? "Synchronizowanie..." : "Uruchom" }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
