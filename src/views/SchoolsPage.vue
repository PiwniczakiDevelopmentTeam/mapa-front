<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";
import type { PagedResult } from "@/models/common/PagedResult";
import type { FilterParams } from "@/models/common/FilterParams";

const router = useRouter();

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const schools = ref<SchoolDTO[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);

const search = ref("");
const filterWoj = ref("");
const filterTyp = ref("");

const totalPages = ref(0);

async function fetchSchools(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const filters: FilterParams[] = [];
    if (search.value.trim()) filters.push({ field: "nazwa", value: search.value.trim() });
    if (filterWoj.value) filters.push({ field: "wojewodztwo", value: filterWoj.value });
    if (filterTyp.value) filters.push({ field: "typ", value: filterTyp.value });

    const res = await api.post<PagedResult<SchoolDTO>>(
      `/api/Schools/GetSchoolPage?size=${pageSize.value}&pageNumber=${currentPage.value}`,
      filters,
    );

    const items = (res.data.items as unknown as { $values?: SchoolDTO[] } | SchoolDTO[]);
    schools.value = Array.isArray(items) ? items : (items as { $values: SchoolDTO[] }).$values ?? [];
    totalCount.value = res.data.totalCount;
    totalPages.value = Math.ceil(res.data.totalCount / pageSize.value);
  } catch {
    error.value = "Nie udało się pobrać listy placówek.";
    schools.value = [];
  } finally {
    loading.value = false;
  }
}

watch([filterWoj, filterTyp], () => {
  currentPage.value = 1;
  fetchSchools();
});

watch(pageSize, () => {
  currentPage.value = 1;
  fetchSchools();
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  currentPage.value = 1;
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchSchools, 400);
});

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchSchools();
}

fetchSchools();
</script>

<template>
  <AppLayout>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-gray-800 font-semibold text-lg">Placówki</h2>
        <span v-if="totalCount > 0" class="text-sm text-gray-500">
          {{ totalCount.toLocaleString("pl-PL") }} placówek łącznie
        </span>
      </div>
    </template>

    <div class="space-y-4">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex gap-3">
          <div class="flex-1 relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input
              v-model="search"
              type="text"
              placeholder="Szukaj po nazwie..."
              class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]"
            />
          </div>
          <select
            v-model="filterWoj"
            class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600"
          >
            <option value="">Wszystkie województwa</option>
            <option>dolnośląskie</option>
            <option>kujawsko-pomorskie</option>
            <option>lubelskie</option>
            <option>lubuskie</option>
            <option>łódzkie</option>
            <option>małopolskie</option>
            <option>mazowieckie</option>
            <option>opolskie</option>
            <option>podkarpackie</option>
            <option>podlaskie</option>
            <option>pomorskie</option>
            <option>śląskie</option>
            <option>świętokrzyskie</option>
            <option>warmińsko-mazurskie</option>
            <option>wielkopolskie</option>
            <option>zachodniopomorskie</option>
          </select>
          <select
            v-model="filterTyp"
            class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600"
          >
            <option value="">Wszystkie typy</option>
            <option>Szkoła podstawowa</option>
            <option>Liceum ogólnokształcące</option>
            <option>Technikum</option>
            <option>Branżowa szkoła I stopnia</option>
            <option>Przedszkole</option>
            <option>Szkoła policealna</option>
          </select>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="whitespace-nowrap">Wierszy:</span>
            <select
              v-model.number="pageSize"
              class="border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]"
            >
              <option v-for="opt in PAGE_SIZE_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
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
              <th class="text-left px-4 py-3 font-medium text-gray-600">Nazwa</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-48">Typ</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-36">Miejscowość</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-36">Województwo</th>
              <th class="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-12 text-center">
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
              <td colspan="6" class="px-4 py-12 text-center text-gray-400 text-sm">
                Brak placówek spełniających kryteria
              </td>
            </tr>
            <tr
              v-else
              v-for="school in schools"
              :key="school.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ school.numerRspo }}</td>
              <td class="px-4 py-3 font-medium text-gray-800">{{ school.nazwa }}</td>
              <td class="px-4 py-3 text-gray-600">{{ school.typ ?? "—" }}</td>
              <td class="px-4 py-3 text-gray-600">{{ school.miejscowosc ?? "—" }}</td>
              <td class="px-4 py-3 text-gray-600">{{ school.wojewodztwo ?? "—" }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  @click="router.push(`/placowki/${school.numerRspo}/edytuj`)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#051330] border border-[#051330]/20 hover:bg-[#051330] hover:text-white transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edytuj
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="!loading && totalPages > 1"
          class="flex items-center justify-between px-4 py-3 border-t border-gray-100"
        >
          <span class="text-xs text-gray-500">
            Strona {{ currentPage }} z {{ totalPages }}
          </span>
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
  </AppLayout>
</template>
