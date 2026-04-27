<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const schools = ref<SchoolDTO[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);
const totalPages = ref(0);

const deletingIds = ref<Set<number>>(new Set());
const deletedIds = ref<Set<number>>(new Set());
const deleteErrorIds = ref<Set<number>>(new Set());
const deletingAll = ref(false);

async function deleteOne(rspoId: number): Promise<void> {
  deletingIds.value = new Set([...deletingIds.value, rspoId]);
  deleteErrorIds.value = new Set([...deleteErrorIds.value].filter((id) => id !== rspoId));
  try {
    await api.delete(`/api/Schools/DeleteSchool?rspoId=${rspoId}`);
    deletedIds.value = new Set([...deletedIds.value, rspoId]);
  } catch {
    deleteErrorIds.value = new Set([...deleteErrorIds.value, rspoId]);
  } finally {
    deletingIds.value = new Set([...deletingIds.value].filter((id) => id !== rspoId));
  }
}

async function deleteAllOnPage(): Promise<void> {
  const pending = schools.value
    .filter((s) => !deletedIds.value.has(s.numerRspo))
    .map((s) => s.numerRspo);
  if (!pending.length) return;
  deletingAll.value = true;
  try {
    await api.delete("/api/Schools/DeleteManySchools", { data: pending });
    pending.forEach((id) => {
      deletedIds.value = new Set([...deletedIds.value, id]);
    });
  } catch {
    pending.forEach((id) => {
      deleteErrorIds.value = new Set([...deleteErrorIds.value, id]);
    });
  } finally {
    deletingAll.value = false;
  }
}

async function fetchObsolete(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const [listRes, countRes] = await Promise.all([
      api.get<SchoolDTO[]>(
        `/api/Schools/GetMissingSchoolsInRSPOTable?size=${pageSize.value}&page=${currentPage.value}`
      ),
      api.get<number>("/api/Schools/GetMissingSchoolsInRSPOTableCount"),
    ]);

    const items = listRes.data as unknown as { $values?: SchoolDTO[] } | SchoolDTO[];
    schools.value = Array.isArray(items) ? items : (items as { $values: SchoolDTO[] }).$values ?? [];
    totalCount.value = countRes.data;
    totalPages.value = Math.ceil(countRes.data / pageSize.value);
  } catch {
    error.value = "Nie udało się pobrać listy placówek do usunięcia.";
    schools.value = [];
  } finally {
    loading.value = false;
  }
}

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchObsolete();
}

function changePageSize(size: number): void {
  pageSize.value = size;
  currentPage.value = 1;
  fetchObsolete();
}

function formatAddress(s: SchoolDTO): string {
  return [
    s.ulica ? `ul. ${s.ulica}${s.numerBudynku ? ` ${s.numerBudynku}` : ""}${s.numerLokalu ? `/${s.numerLokalu}` : ""}` : null,
    s.kodPocztowy && s.miejscowosc ? `${s.kodPocztowy} ${s.miejscowosc}` : (s.miejscowosc ?? null),
    s.gmina ? `gm. ${s.gmina}` : null,
    s.powiat ? `pow. ${s.powiat}` : null,
  ].filter(Boolean).join(", ") || "—";
}

onMounted(fetchObsolete);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500">
        Placówki w lokalnej bazie danych, których nie ma już w rejestrze RSPO.
      </p>
      <div v-if="totalCount > 0" class="flex items-center gap-3 text-sm text-gray-500">
        <button
          @click="deleteAllOnPage"
          :disabled="deletingAll || schools.every((s) => deletedIds.has(s.numerRspo))"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="deletingAll" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {{ deletingAll ? "Usuwanie..." : "Usuń wszystkie na tej stronie" }}
        </button>
        <span>{{ totalCount.toLocaleString("pl-PL") }} do usunięcia</span>
        <span class="text-gray-300">|</span>
        <span>Wierszy:</span>
        <select
          :value="pageSize"
          @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
          class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]"
        >
          <option v-for="opt in PAGE_SIZE_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div v-if="error" class="px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
        {{ error }}
      </div>

      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-4 py-3 font-medium text-gray-600 w-28">Nr RSPO</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600" colspan="4">Placówka</th>
            <th class="px-4 py-3 w-28"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="3" class="px-4 py-12 text-center">
              <div class="flex items-center justify-center gap-2 text-gray-400">
                <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span class="text-sm">Ładowanie...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="schools.length === 0">
            <td colspan="3" class="px-4 py-12 text-center text-gray-400 text-sm">
              Brak placówek do usunięcia — lokalna baza jest zsynchronizowana z RSPO
            </td>
          </tr>
          <tr
            v-else
            v-for="school in schools"
            :key="school.numerRspo"
            :class="['border-b border-gray-50 transition-colors', deletedIds.has(school.numerRspo) ? 'opacity-40' : 'hover:bg-gray-50']"
          >
            <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ school.numerRspo }}</td>
            <td class="px-4 py-3" colspan="4">
              <div class="font-medium text-gray-800 mb-1.5">{{ school.nazwa }}</div>
              <div class="grid grid-cols-6 gap-x-4 gap-y-0.5 text-xs text-gray-400 leading-relaxed">
                <div v-if="school.statusPublicznoPrawny">
                  <span class="text-gray-300">Status:</span> {{ school.statusPublicznoPrawny }}
                </div>
                <div v-if="school.podmiotProwadzacyTyp">
                  <span class="text-gray-300">Podmiot:</span> {{ school.podmiotProwadzacyTyp }}
                </div>
                <div v-if="school.podmiotProwadzacyNazwa" class="col-span-3">
                  <span class="text-gray-300">Nazwa podmiotu:</span> {{ school.podmiotProwadzacyNazwa }}
                </div>
                <div v-if="school.dyrektorImie || school.dyrektorNazwisko">
                  <span class="text-gray-300">Dyrektor:</span> {{ [school.dyrektorImie, school.dyrektorNazwisko].filter(Boolean).join(" ") }}
                </div>
                <div v-if="school.email">
                  <span class="text-gray-300">Email:</span> {{ school.email }}
                </div>
                <div v-if="school.telefon">
                  <span class="text-gray-300">Tel:</span> {{ school.telefon }}
                </div>
                <div v-if="school.stronaInternetowa">
                  <span class="text-gray-300">WWW:</span> {{ school.stronaInternetowa }}
                </div>
                <div v-if="school.nip">
                  <span class="text-gray-300">NIP:</span> {{ school.nip }}
                </div>
                <div v-if="school.regon">
                  <span class="text-gray-300">REGON:</span> {{ school.regon }}
                </div>
                <div v-if="school.specyfikaSzkoly">
                  <span class="text-gray-300">Specyfika:</span> {{ school.specyfikaSzkoly }}
                </div>
                <div v-if="school.kategoriaUczniow">
                  <span class="text-gray-300">Kategoria:</span> {{ school.kategoriaUczniow }}
                </div>
                <div v-if="school.liczbaUczniow">
                  <span class="text-gray-300">Uczniów:</span> {{ school.liczbaUczniow }}
                </div>
                <div v-if="school.gminaRodzaj">
                  <span class="text-gray-300">Rodzaj gminy:</span> {{ school.gminaRodzaj }}
                </div>
                <div v-if="school.dataRozpoczecia">
                  <span class="text-gray-300">Rozpoczęcie:</span> {{ school.dataRozpoczecia.slice(0, 10) }}
                </div>
                <div v-if="school.dataZalozenia">
                  <span class="text-gray-300">Założenie:</span> {{ school.dataZalozenia.slice(0, 10) }}
                </div>
                <div v-if="school.dataZakonczenia">
                  <span class="text-gray-300">Zakończenie:</span> {{ school.dataZakonczenia.slice(0, 10) }}
                </div>
                <div v-if="school.dataLikwidacji">
                  <span class="text-gray-300">Likwidacja:</span> {{ school.dataLikwidacji.slice(0, 10) }}
                </div>
                <div class="col-span-3">
                  <span class="text-gray-300">Adres:</span> {{ formatAddress(school) }}
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <span v-if="deletedIds.has(school.numerRspo)" class="text-xs text-emerald-600 font-medium">Usunięto</span>
                <span v-else-if="deleteErrorIds.has(school.numerRspo)" class="text-xs text-red-500">Błąd</span>

                <button
                  v-if="!deletedIds.has(school.numerRspo)"
                  @click="deleteOne(school.numerRspo)"
                  :disabled="deletingIds.has(school.numerRspo)"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <svg v-if="deletingIds.has(school.numerRspo)" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Usuń
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="!loading && totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-100"
      >
        <span class="text-xs text-gray-500">Strona {{ currentPage }} z {{ totalPages }}</span>
        <div class="flex items-center gap-1">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Poprzednia
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Następna
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
