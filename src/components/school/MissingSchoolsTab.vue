<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";

const router = useRouter();

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const schools = ref<SchoolDTO[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);
const totalPages = ref(0);

const addingIds = ref<Set<number>>(new Set());
const addedIds = ref<Set<number>>(new Set());
const addErrorIds = ref<Set<number>>(new Set());

async function addDirectly(school: SchoolDTO): Promise<void> {
  addingIds.value = new Set([...addingIds.value, school.numerRspo]);
  addErrorIds.value = new Set([...addErrorIds.value].filter((id) => id !== school.numerRspo));
  try {
    await api.post("/api/Schools/AddSingleSchool", school);
    addedIds.value = new Set([...addedIds.value, school.numerRspo]);
  } catch {
    addErrorIds.value = new Set([...addErrorIds.value, school.numerRspo]);
  } finally {
    addingIds.value = new Set([...addingIds.value].filter((id) => id !== school.numerRspo));
  }
}

async function fetchMissing(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const [listRes, countRes] = await Promise.all([
      api.get<SchoolDTO[]>(
        `/api/Schools/GetMissingSchoolsInSchoolsTable?size=${pageSize.value}&page=${currentPage.value}`
      ),
      api.get<number>("/api/Schools/GetMissingSchoolsInSchoolsTableCount"),
    ]);

    const items = listRes.data as unknown as { $values?: SchoolDTO[] } | SchoolDTO[];
    schools.value = Array.isArray(items) ? items : (items as { $values: SchoolDTO[] }).$values ?? [];
    totalCount.value = countRes.data;
    totalPages.value = Math.ceil(countRes.data / pageSize.value);
  } catch {
    error.value = "Nie udało się pobrać listy brakujących placówek.";
    schools.value = [];
  } finally {
    loading.value = false;
  }
}

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchMissing();
}

function changePageSize(size: number): void {
  pageSize.value = size;
  currentPage.value = 1;
  fetchMissing();
}

const addingAll = ref(false);

async function addAllOnPage(): Promise<void> {
  const pending = schools.value.filter((s) => !addedIds.value.has(s.numerRspo));
  if (!pending.length) return;
  addingAll.value = true;
  await Promise.allSettled(pending.map((s) => addDirectly(s)));
  addingAll.value = false;
}

function formatAddress(s: SchoolDTO): string {
  return [
    s.ulica ? `ul. ${s.ulica}${s.numerBudynku ? ` ${s.numerBudynku}` : ""}${s.numerLokalu ? `/${s.numerLokalu}` : ""}` : null,
    s.kodPocztowy && s.miejscowosc ? `${s.kodPocztowy} ${s.miejscowosc}` : (s.miejscowosc ?? null),
    s.gmina ? `gm. ${s.gmina}` : null,
    s.powiat ? `pow. ${s.powiat}` : null,
  ].filter(Boolean).join(", ") || "—";
}

onMounted(fetchMissing);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500">
        Placówki widoczne w RSPO, których brakuje w lokalnej bazie danych.
      </p>
      <div v-if="totalCount > 0" class="flex items-center gap-3 text-sm text-gray-500">
        <button
          @click="addAllOnPage"
          :disabled="addingAll || schools.every((s) => addedIds.has(s.numerRspo))"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#051330] hover:bg-[#072244] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="addingAll" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ addingAll ? "Dodawanie..." : "Dodaj wszystkie na tej stronie" }}
        </button>
        <span>{{ totalCount.toLocaleString("pl-PL") }} brakujących</span>
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
            <th class="px-4 py-3 w-44"></th>
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
              Brak placówek — lokalna baza jest zsynchronizowana z RSPO
            </td>
          </tr>
          <tr
            v-else
            v-for="school in schools"
            :key="school.numerRspo"
            class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
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
                <span v-if="addedIds.has(school.numerRspo)" class="text-xs text-emerald-600 font-medium">Dodano</span>
                <span v-else-if="addErrorIds.has(school.numerRspo)" class="text-xs text-red-500">Błąd</span>

                <button
                  v-if="!addedIds.has(school.numerRspo)"
                  @click="router.push(`/placowki/${school.numerRspo}/dodaj`)"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Zweryfikuj
                </button>

                <button
                  v-if="!addedIds.has(school.numerRspo)"
                  @click="addDirectly(school)"
                  :disabled="addingIds.has(school.numerRspo)"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-[#051330] hover:bg-[#072244] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <svg v-if="addingIds.has(school.numerRspo)" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Dodaj
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
