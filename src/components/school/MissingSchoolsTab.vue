<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";
import Pagination from "@/components/common/Pagination.vue";

const router = useRouter();

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const allMissing = ref<SchoolDTO[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);

const addingIds = ref<Set<number>>(new Set());
const addedIds = ref<Set<number>>(new Set());
const addErrorIds = ref<Set<number>>(new Set());
const addingAll = ref(false);

// Filters (mirror the ones in SchoolsPage "Wszystkie" tab)
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

const activeExtraFiltersCount = computed(() =>
  [filterTyp, filterStatus, filterKategoria, filterSpecyfika, filterGminaRodzaj, filterPowiat, filterMiejscowosc]
    .filter((f) => f.value).length,
);

function unwrapValues<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "$values" in raw) {
    return ((raw as { $values: T[] }).$values ?? []) as T[];
  }
  return [];
}

function includesCi(haystack: string | undefined | null, needle: string): boolean {
  if (!haystack) return false;
  return haystack.toLocaleLowerCase("pl-PL").includes(needle.toLocaleLowerCase("pl-PL"));
}

const filteredMissing = computed(() => {
  const s = search.value.trim();
  const powiat = filterPowiat.value.trim();
  const miejscowosc = filterMiejscowosc.value.trim();

  return allMissing.value.filter((school) => {
    if (s && !includesCi(school.nazwa, s)) return false;
    if (filterWoj.value && school.wojewodztwo !== filterWoj.value) return false;
    if (filterPodmiot.value && school.podmiotProwadzacyTyp !== filterPodmiot.value) return false;
    if (filterTyp.value && school.typ !== filterTyp.value) return false;
    if (filterStatus.value && school.statusPublicznoPrawny !== filterStatus.value) return false;
    if (filterKategoria.value && school.kategoriaUczniow !== filterKategoria.value) return false;
    if (filterSpecyfika.value && school.specyfikaSzkoly !== filterSpecyfika.value) return false;
    if (filterGminaRodzaj.value && school.gminaRodzaj !== filterGminaRodzaj.value) return false;
    if (powiat && !includesCi(school.powiat, powiat)) return false;
    if (miejscowosc && !includesCi(school.miejscowosc, miejscowosc)) return false;
    return true;
  });
});

const totalCount = computed(() => filteredMissing.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));
const pagedItems = computed(() =>
  filteredMissing.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value),
);

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
  addedIds.value = new Set();
  addErrorIds.value = new Set();
  try {
    // Backend GetMissingSchoolsInSchoolsTable has no server-side filtering; fetch the
    // full list and filter client-side. Could be tens of thousands right after a fresh
    // import, so bump the timeout well above the 10s default in services/api.ts.
    const res = await api.get<SchoolDTO[]>(
      "/api/Schools/GetMissingSchoolsInSchoolsTable?size=999999&page=1",
      { timeout: 300000 },
    );
    const items = unwrapValues<SchoolDTO>(res.data as unknown);
    allMissing.value = items;
    currentPage.value = 1;
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status === 204 || status === 404) {
      allMissing.value = [];
    } else {
      error.value = "Nie udało się pobrać listy brakujących placówek.";
      allMissing.value = [];
    }
  } finally {
    loading.value = false;
  }
}

async function addAllOnPage(): Promise<void> {
  const pending = pagedItems.value.filter((s) => !addedIds.value.has(s.numerRspo));
  if (!pending.length) return;
  addingAll.value = true;
  await Promise.allSettled(pending.map((s) => addDirectly(s)));
  addingAll.value = false;
}

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

// Reset to first page whenever filters or page size change.
watch(
  [filterWoj, filterPodmiot, filterTyp, filterStatus, filterKategoria, filterSpecyfika, filterGminaRodzaj, pageSize],
  () => {
    currentPage.value = 1;
  },
);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch([search, filterPowiat, filterMiejscowosc], () => {
  currentPage.value = 1;
  if (searchTimeout) clearTimeout(searchTimeout);
  // Tiny debounce so we don't recompute on every keystroke for huge lists.
  searchTimeout = setTimeout(() => {
    // computed re-evaluates automatically; this just yields a frame.
  }, 200);
});

function formatAddress(s: SchoolDTO): string {
  return [
    s.ulica ? `ul. ${s.ulica}${s.numerBudynku ? ` ${s.numerBudynku}` : ""}${s.numerLokalu ? `/${s.numerLokalu}` : ""}` : null,
    s.kodPocztowy && s.miejscowosc ? `${s.kodPocztowy} ${s.miejscowosc}` : (s.miejscowosc ?? null),
    s.gmina ? `gm. ${s.gmina}` : null,
    s.powiat ? `pow. ${s.powiat}` : null,
  ].filter(Boolean).join(", ") || "—";
}

fetchMissing();
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-500">
      Placówki widoczne w RSPO, których brakuje w lokalnej bazie danych. Filtry działają na danych pobranych z RSPO.
    </p>

    <!-- Filter card (mirrors SchoolsPage "Wszystkie") -->
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

    <!-- Counters / bulk action -->
    <div v-if="!loading && allMissing.length > 0" class="flex flex-wrap items-center justify-between gap-3">
      <span class="text-sm text-gray-500">
        <strong>{{ totalCount.toLocaleString("pl-PL") }}</strong>
        z {{ allMissing.length.toLocaleString("pl-PL") }} brakujących pasuje do filtrów
      </span>
      <button
        @click="addAllOnPage"
        :disabled="addingAll || pagedItems.length === 0 || pagedItems.every((s) => addedIds.has(s.numerRspo))"
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
    </div>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div v-if="error" class="px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
        {{ error }}
      </div>

      <!-- Mobile: card list -->
      <div class="sm:hidden">
        <div v-if="loading" class="px-4 py-12 text-center">
          <div class="flex items-center justify-center gap-2 text-gray-400">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm">Ładowanie...</span>
          </div>
        </div>
        <div v-else-if="pagedItems.length === 0" class="px-4 py-12 text-center text-gray-400 text-sm">
          <template v-if="allMissing.length === 0">Brak placówek — lokalna baza jest zsynchronizowana z RSPO</template>
          <template v-else>Brak placówek spełniających kryteria filtra</template>
        </div>
        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="school in pagedItems"
            :key="school.numerRspo"
            class="p-4"
            :class="addedIds.has(school.numerRspo) ? 'opacity-50' : ''"
          >
            <div class="flex items-start justify-between gap-2 mb-3">
              <div class="min-w-0 flex-1">
                <div class="font-medium text-sm text-gray-800 leading-snug">{{ school.nazwa }}</div>
                <div class="text-xs font-mono text-gray-400 mt-0.5">{{ school.numerRspo }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ formatAddress(school) }}</div>
                <div v-if="school.podmiotProwadzacyTyp" class="text-xs text-gray-400">{{ school.podmiotProwadzacyTyp }}</div>
              </div>
              <span v-if="addedIds.has(school.numerRspo)" class="shrink-0 text-xs text-emerald-600 font-medium">Dodano</span>
              <span v-else-if="addErrorIds.has(school.numerRspo)" class="shrink-0 text-xs text-red-500">Błąd</span>
            </div>
            <div v-if="!addedIds.has(school.numerRspo)" class="flex gap-2">
              <button
                @click="router.push(`/placowki/${school.numerRspo}/dodaj`)"
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Zweryfikuj
              </button>
              <button
                @click="addDirectly(school)"
                :disabled="addingIds.has(school.numerRspo)"
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-white bg-[#051330] hover:bg-[#072244] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <svg v-if="addingIds.has(school.numerRspo)" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Dodaj
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop: table -->
      <div class="hidden sm:block overflow-x-auto">
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
            <tr v-else-if="pagedItems.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-gray-400 text-sm">
                <template v-if="allMissing.length === 0">Brak placówek — lokalna baza jest zsynchronizowana z RSPO</template>
                <template v-else>Brak placówek spełniających kryteria filtra</template>
              </td>
            </tr>
            <tr
              v-else
              v-for="school in pagedItems"
              :key="school.numerRspo"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              :class="addedIds.has(school.numerRspo) ? 'opacity-50' : ''"
            >
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ school.numerRspo }}</td>
              <td class="px-4 py-3" colspan="4">
                <div class="font-medium text-gray-800 mb-1.5">{{ school.nazwa }}</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-0.5 text-xs text-gray-400 leading-relaxed">
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
      </div>

      <div v-if="!loading && totalPages > 1" class="px-4 py-3 border-t border-gray-100">
        <Pagination :current-page="currentPage" :total-pages="totalPages" @change="goToPage" />
      </div>
    </div>
  </div>
</template>
