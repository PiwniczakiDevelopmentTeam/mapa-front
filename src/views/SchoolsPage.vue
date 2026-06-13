<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import MissingSchoolsTab from "@/components/school/MissingSchoolsTab.vue";
import ObsoleteSchoolsTab from "@/components/school/ObsoleteSchoolsTab.vue";
import DiffSchoolsTab from "@/components/school/DiffSchoolsTab.vue";
import ChangedFieldsTab from "@/components/school/ChangedFieldsTab.vue";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";
import type { PagedResult } from "@/models/common/PagedResult";
import type { FilterParams } from "@/models/common/FilterParams";

const router = useRouter();

type Tab = "all" | "missing" | "obsolete" | "diff" | "update";
const activeTab = ref<Tab>("all");

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const schools = ref<SchoolDTO[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);

const search = ref("");
const filterWoj = ref("");
const filterPodmiot = ref("");
const filterTyp = ref("");
const filterStatus = ref("");
const filterKategoria = ref("");
const filterSpecyfika = ref("");
const filterGminaRodzaj = ref("");
const filterPowiat = ref("");
const filterMiejscowosc = ref("");

const showMoreFilters = ref(false);
const totalPages = ref(0);

const schoolToDelete = ref<SchoolDTO | null>(null);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

const selectMode = ref(false);
const selectedRspoIds = ref<Set<number>>(new Set());
const showConfirmManyDelete = ref(false);
const deletingMany = ref(false);
const deleteManyError = ref<string | null>(null);

const selectedCount = computed(() => selectedRspoIds.value.size);
const allOnPageSelected = computed(
  () => schools.value.length > 0 && schools.value.every((s) => selectedRspoIds.value.has(s.numerRspo)),
);
const someOnPageSelected = computed(
  () => schools.value.some((s) => selectedRspoIds.value.has(s.numerRspo)),
);

const activeExtraFiltersCount = computed(() =>
  [filterTyp, filterStatus, filterKategoria, filterSpecyfika, filterGminaRodzaj, filterPowiat, filterMiejscowosc]
    .filter((f) => f.value).length
);

async function fetchSchools(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const filters: FilterParams[] = [];
    if (search.value.trim()) filters.push({ field: "nazwa", value: search.value.trim() });
    if (filterWoj.value) filters.push({ field: "wojewodztwo", value: filterWoj.value });
    if (filterPodmiot.value) filters.push({ field: "podmiotProwadzacyTyp", value: filterPodmiot.value });
    if (filterTyp.value) filters.push({ field: "typ", value: filterTyp.value });
    if (filterStatus.value) filters.push({ field: "statusPublicznoPrawny", value: filterStatus.value });
    if (filterKategoria.value) filters.push({ field: "kategoriaUczniow", value: filterKategoria.value });
    if (filterSpecyfika.value) filters.push({ field: "specyfikaSzkoly", value: filterSpecyfika.value });
    if (filterGminaRodzaj.value) filters.push({ field: "gminaRodzaj", value: filterGminaRodzaj.value });
    if (filterPowiat.value.trim()) filters.push({ field: "powiat", value: filterPowiat.value.trim() });
    if (filterMiejscowosc.value.trim()) filters.push({ field: "miejscowosc", value: filterMiejscowosc.value.trim() });

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

watch(
  [filterWoj, filterPodmiot, filterTyp, filterStatus, filterKategoria, filterSpecyfika, filterGminaRodzaj],
  () => {
    currentPage.value = 1;
    fetchSchools();
  }
);

let powiatTimeout: ReturnType<typeof setTimeout> | null = null;
watch(filterPowiat, () => {
  currentPage.value = 1;
  if (powiatTimeout) clearTimeout(powiatTimeout);
  powiatTimeout = setTimeout(fetchSchools, 400);
});

let miejscowoscTimeout: ReturnType<typeof setTimeout> | null = null;
watch(filterMiejscowosc, () => {
  currentPage.value = 1;
  if (miejscowoscTimeout) clearTimeout(miejscowoscTimeout);
  miejscowoscTimeout = setTimeout(fetchSchools, 400);
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

function requestDelete(school: SchoolDTO): void {
  schoolToDelete.value = school;
  deleteError.value = null;
}

function cancelDelete(): void {
  if (deleting.value) return;
  schoolToDelete.value = null;
  deleteError.value = null;
}

async function confirmDelete(): Promise<void> {
  if (!schoolToDelete.value) return;
  const rspoId = schoolToDelete.value.numerRspo;
  deleting.value = true;
  deleteError.value = null;
  try {
    await api.delete(`/api/Schools/DeleteSchool?rspoId=${rspoId}`);
    schoolToDelete.value = null;
    // Last item on page? Step back so we don't show an empty page.
    if (schools.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
    await fetchSchools();
  } catch {
    deleteError.value = "Nie udało się usunąć placówki. Spróbuj ponownie.";
  } finally {
    deleting.value = false;
  }
}

function toggleSelectMode(): void {
  selectMode.value = !selectMode.value;
  if (!selectMode.value) {
    selectedRspoIds.value = new Set();
  }
}

function isSelected(school: SchoolDTO): boolean {
  return selectedRspoIds.value.has(school.numerRspo);
}

function toggleSelection(school: SchoolDTO): void {
  const next = new Set(selectedRspoIds.value);
  if (next.has(school.numerRspo)) {
    next.delete(school.numerRspo);
  } else {
    next.add(school.numerRspo);
  }
  selectedRspoIds.value = next;
}

function toggleAllOnPage(): void {
  const next = new Set(selectedRspoIds.value);
  if (allOnPageSelected.value) {
    schools.value.forEach((s) => next.delete(s.numerRspo));
  } else {
    schools.value.forEach((s) => next.add(s.numerRspo));
  }
  selectedRspoIds.value = next;
}

function clearSelection(): void {
  selectedRspoIds.value = new Set();
}

function requestDeleteMany(): void {
  if (selectedCount.value === 0) return;
  showConfirmManyDelete.value = true;
  deleteManyError.value = null;
}

function cancelDeleteMany(): void {
  if (deletingMany.value) return;
  showConfirmManyDelete.value = false;
  deleteManyError.value = null;
}

async function confirmDeleteMany(): Promise<void> {
  const ids = Array.from(selectedRspoIds.value);
  if (!ids.length) return;
  deletingMany.value = true;
  deleteManyError.value = null;
  try {
    await api.delete("/api/Schools/DeleteManySchools", { data: ids });
    selectedRspoIds.value = new Set();
    showConfirmManyDelete.value = false;
    selectMode.value = false;
    // Likely emptied current page or earlier; step back to avoid landing on a blank page.
    if (currentPage.value > 1) {
      currentPage.value = 1;
    }
    await fetchSchools();
  } catch {
    deleteManyError.value = "Nie udało się usunąć zaznaczonych placówek. Spróbuj ponownie.";
  } finally {
    deletingMany.value = false;
  }
}

fetchSchools();
</script>

<template>
  <AppLayout>
    <template #header>
      <div class="flex items-center justify-between min-w-0">
        <h2 class="font-semibold text-gray-800">Placówki</h2>
        <span v-if="activeTab === 'all' && totalCount > 0" class="ml-4 text-sm text-gray-500 whitespace-nowrap hidden sm:block">
          {{ totalCount.toLocaleString("pl-PL") }} placówek łącznie
        </span>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Tab bar -->
      <div class="bg-white rounded-lg border border-gray-200 flex overflow-hidden">
        <button
          @click="activeTab = 'all'"
          :class="[
            'flex-1 py-3 px-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'all'
              ? 'border-[#051330] text-[#051330] bg-[#051330]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ]"
        >
          Wszystkie
        </button>
        <button
          @click="activeTab = 'missing'"
          :class="[
            'flex-1 py-3 px-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'missing'
              ? 'border-[#051330] text-[#051330] bg-[#051330]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ]"
        >
          <span class="hidden sm:inline">Dodaj do mapy</span>
          <span class="sm:hidden">Dodaj</span>
        </button>
        <button
          @click="activeTab = 'obsolete'"
          :class="[
            'flex-1 py-3 px-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'obsolete'
              ? 'border-red-500 text-red-600 bg-red-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ]"
        >
          <span class="hidden sm:inline">Usuń placówki</span>
          <span class="sm:hidden">Usuń</span>
        </button>
        <button
          @click="activeTab = 'diff'"
          :class="[
            'flex-1 py-3 px-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'diff'
              ? 'border-amber-500 text-amber-700 bg-amber-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ]"
        >
          <span class="hidden sm:inline">Różnice z RSPO</span>
          <span class="sm:hidden">Różnice</span>
        </button>
        <button
          @click="activeTab = 'update'"
          :class="[
            'flex-1 py-3 px-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'update'
              ? 'border-amber-500 text-amber-700 bg-amber-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ]"
        >
          <span class="hidden sm:inline">Edytuj dane</span>
          <span class="sm:hidden">Edytuj</span>
        </button>
      </div>

      <MissingSchoolsTab v-if="activeTab === 'missing'" />
      <ObsoleteSchoolsTab v-if="activeTab === 'obsolete'" />
      <DiffSchoolsTab v-if="activeTab === 'diff'" />
      <ChangedFieldsTab v-if="activeTab === 'update'" />

      <div v-if="activeTab === 'all'" class="space-y-4">
        <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1 relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input v-model="search" type="text" placeholder="Szukaj po nazwie..." class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]" />
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <span class="whitespace-nowrap">Wierszy:</span>
              <select v-model.number="pageSize" class="border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]">
                <option v-for="opt in PAGE_SIZE_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <button
              type="button"
              @click="toggleSelectMode"
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-colors whitespace-nowrap',
                selectMode
                  ? 'border-red-500 text-red-700 bg-red-50 hover:bg-red-100'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50',
              ]"
              :title="selectMode ? 'Wyjdź z trybu usuwania' : 'Zaznacz wiele placówek do usunięcia'"
            >
              <svg v-if="selectMode" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span class="hidden sm:inline">{{ selectMode ? "Zakończ" : "Tryb usuwania" }}</span>
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <select v-model="filterWoj" class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600">
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
            <select v-model="filterPodmiot" class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600">
              <option value="">Wszystkie podmioty prowadzące</option>
              <option>Fundacje</option>
              <option>Gmina</option>
              <option>Miasto na prawach powiatu</option>
              <option>Minister ds. rolnictwa i rozwoju wsi</option>
              <option>Minister ds. sprawiedliwości</option>
              <option>Organizacje Wyznaniowe</option>
              <option>Osoba Fizyczna - Pracodawca</option>
              <option>Osoba fizyczna</option>
              <option>Powiat ziemski</option>
              <option>Przedsiębiorstwa Osób Fizycznych</option>
              <option>Przedsiębiorstwo Państwowe</option>
              <option>Samorząd województwa</option>
              <option>Spółdzielnia</option>
              <option>Spółki Handlowe</option>
              <option>Stowarzyszenia</option>
              <option>Uczelnia Niepubliczna</option>
            </select>
            <button
              type="button"
              @click="showMoreFilters = !showMoreFilters"
              class="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-colors"
              :class="activeExtraFiltersCount > 0
                ? 'border-[#051330] text-[#051330] bg-[#051330]/5'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'"
            >
              <svg class="w-4 h-4 transition-transform" :class="showMoreFilters ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              Więcej filtrów
              <span v-if="activeExtraFiltersCount > 0" class="ml-0.5 bg-[#051330] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {{ activeExtraFiltersCount }}
              </span>
            </button>
          </div>

          <div v-show="showMoreFilters" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
            <select v-model="filterTyp" class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600">
              <option value="">Wszystkie typy placówek</option>
              <option>Biblioteki pedagogiczne</option>
              <option>Branżowa szkoła I stopnia</option>
              <option>Bursa</option>
              <option>Centrum Kształcenia Zawodowego</option>
              <option>Liceum ogólnokształcące</option>
              <option>Międzyszkolny ośrodek sportowy</option>
              <option>Młodzieżowy Ośrodek Socjoterapii ze szkołami</option>
              <option>Młodzieżowy Ośrodek Wychowawczy</option>
              <option>Młodzieżowy dom kultury</option>
              <option>Niepubliczna placówka oświatowo-wychowawcza w systemie oświaty</option>
              <option>Ośrodek Rewalidacyjno-Wychowawczy</option>
              <option>Pałac młodzieży</option>
              <option>Placówka Kształcenia Ustawicznego - bez szkół</option>
              <option>Placówka Kształcenia Ustawicznego ze szkołami</option>
              <option>Placówka doskonalenia nauczycieli</option>
              <option>Poradnia psychologiczno-pedagogiczna</option>
              <option>Poradnia specjalistyczna</option>
              <option>Przedszkole</option>
              <option>Punkt przedszkolny</option>
              <option>Specjalny Ośrodek Szkolno-Wychowawczy</option>
              <option>Specjalny Ośrodek Wychowawczy</option>
              <option>Szkolne schronisko młodzieżowe</option>
              <option>Szkoła muzyczna I stopnia</option>
              <option>Szkoła muzyczna II stopnia</option>
              <option>Szkoła podstawowa</option>
              <option>Szkoła policealna</option>
              <option>Szkoła specjalna przysposabiająca do pracy</option>
              <option>Technikum</option>
              <option>Zespół szkół i placówek oświatowych</option>
            </select>
            <select v-model="filterStatus" class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600">
              <option value="">Publiczne i niepubliczne</option>
              <option>publiczna</option>
              <option>niepubliczna</option>
            </select>
            <select v-model="filterKategoria" class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600">
              <option value="">Wszystkie kategorie uczniów</option>
              <option>Bez kategorii</option>
              <option>Dorośli</option>
              <option>Dzieci lub młodzież</option>
            </select>
            <select v-model="filterSpecyfika" class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600">
              <option value="">Wszystkie specyfiki szkół</option>
              <option>brak specyfiki</option>
              <option>specjalna</option>
            </select>
            <select v-model="filterGminaRodzaj" class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-600">
              <option value="">Wszystkie rodzaje gmin</option>
              <option>delegatura</option>
              <option>dzielnica</option>
              <option>gmina miejska</option>
              <option>gmina wiejska</option>
              <option>miasto</option>
              <option>obszar wiejski</option>
            </select>
            <input v-model="filterPowiat" type="text" placeholder="Filtruj po powiecie..." class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]" />
            <input v-model="filterMiejscowosc" type="text" placeholder="Filtruj po miejscowości..." class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]" />
          </div>
        </div>

        <!-- Bulk-selection action bar -->
        <div
          v-if="selectMode"
          class="bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3"
        >
          <div class="flex items-center gap-3 text-sm">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
              {{ selectedCount }}
            </span>
            <span class="text-gray-700">
              <template v-if="selectedCount === 0">Zaznacz placówki do usunięcia</template>
              <template v-else>zaznaczonych do usunięcia</template>
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="clearSelection"
              :disabled="selectedCount === 0"
              class="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Wyczyść
            </button>
            <button
              type="button"
              @click="requestDeleteMany"
              :disabled="selectedCount === 0"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Usuń zaznaczone
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div v-if="error" class="px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
            {{ error }}
          </div>

          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th v-if="selectMode" class="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    :checked="allOnPageSelected"
                    :indeterminate.prop="!allOnPageSelected && someOnPageSelected"
                    @change="toggleAllOnPage"
                    title="Zaznacz wszystkie na tej stronie"
                    class="rounded border-gray-300 text-red-600 focus:ring-red-500/30"
                  />
                </th>
                <th class="hidden sm:table-cell text-left px-4 py-3 font-medium text-gray-600 w-28">Nr RSPO</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Nazwa</th>
                <th class="hidden md:table-cell text-left px-4 py-3 font-medium text-gray-600 w-48">Typ</th>
                <th class="hidden lg:table-cell text-left px-4 py-3 font-medium text-gray-600 w-36">Miejscowość</th>
                <th class="hidden xl:table-cell text-left px-4 py-3 font-medium text-gray-600 w-36">Województwo</th>
                <th v-if="!selectMode" class="px-4 py-3 w-16"></th>
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
                class="border-b border-gray-50 transition-colors"
                :class="selectMode && isSelected(school) ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50'"
                @click="selectMode ? toggleSelection(school) : null"
                :style="selectMode ? 'cursor: pointer' : ''"
              >
                <td v-if="selectMode" class="px-3 py-3" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isSelected(school)"
                    @change="toggleSelection(school)"
                    class="rounded border-gray-300 text-red-600 focus:ring-red-500/30"
                  />
                </td>
                <td class="hidden sm:table-cell px-4 py-3 text-gray-500 font-mono text-xs">{{ school.numerRspo }}</td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-800">{{ school.nazwa }}</div>
                  <div class="sm:hidden text-xs text-gray-400 mt-0.5">
                    {{ [school.miejscowosc, school.typ].filter(Boolean).join(" · ") || "—" }}
                  </div>
                </td>
                <td class="hidden md:table-cell px-4 py-3 text-gray-600">{{ school.typ ?? "—" }}</td>
                <td class="hidden lg:table-cell px-4 py-3 text-gray-600">{{ school.miejscowosc ?? "—" }}</td>
                <td class="hidden xl:table-cell px-4 py-3 text-gray-600">{{ school.wojewodztwo ?? "—" }}</td>
                <td v-if="!selectMode" class="px-4 py-3 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      @click="router.push(`/placowki/${school.numerRspo}/edytuj`)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#051330] border border-[#051330]/20 hover:bg-[#051330] hover:text-white transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span class="hidden sm:inline">Edytuj</span>
                    </button>
                    <button
                      @click="requestDelete(school)"
                      title="Usuń placówkę"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span class="hidden sm:inline">Usuń</span>
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
    </div>

    <!-- Delete confirmation modal -->
    <div
      v-if="schoolToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden" role="dialog" aria-modal="true">
        <div class="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div class="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-medium text-gray-800">Usunąć placówkę?</h3>
            <p class="text-xs text-gray-500 mt-0.5">Tej operacji nie można cofnąć.</p>
          </div>
        </div>

        <div class="px-5 py-4 space-y-2">
          <div class="rounded-md bg-gray-50 border border-gray-200 px-3 py-2.5">
            <div class="font-medium text-sm text-gray-800 break-words">{{ schoolToDelete.nazwa }}</div>
            <div class="text-xs text-gray-500 font-mono mt-0.5">Nr RSPO: {{ schoolToDelete.numerRspo }}</div>
            <div v-if="schoolToDelete.miejscowosc || schoolToDelete.wojewodztwo" class="text-xs text-gray-500 mt-1">
              {{ [schoolToDelete.miejscowosc, schoolToDelete.wojewodztwo].filter(Boolean).join(", ") }}
            </div>
          </div>
          <div v-if="deleteError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {{ deleteError }}
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            @click="cancelDelete"
            :disabled="deleting"
            class="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anuluj
          </button>
          <button
            type="button"
            @click="confirmDelete"
            :disabled="deleting"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <svg v-if="deleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ deleting ? "Usuwanie..." : "Usuń" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk delete confirmation modal -->
    <div
      v-if="showConfirmManyDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="cancelDeleteMany"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden" role="dialog" aria-modal="true">
        <div class="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div class="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-medium text-gray-800">
              Usunąć {{ selectedCount }} {{ selectedCount === 1 ? "placówkę" : "placówek" }}?
            </h3>
            <p class="text-xs text-gray-500 mt-0.5">Tej operacji nie można cofnąć.</p>
          </div>
        </div>

        <div class="px-5 py-4 space-y-2">
          <div class="rounded-md bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm text-gray-700">
            Zostanie usuniętych <strong>{{ selectedCount }}</strong>
            {{ selectedCount === 1 ? "placówka" : "placówek" }} z lokalnej bazy danych.
          </div>
          <div v-if="deleteManyError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {{ deleteManyError }}
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            @click="cancelDeleteMany"
            :disabled="deletingMany"
            class="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anuluj
          </button>
          <button
            type="button"
            @click="confirmDeleteMany"
            :disabled="deletingMany"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <svg v-if="deletingMany" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ deletingMany ? "Usuwanie..." : `Usuń ${selectedCount}` }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
