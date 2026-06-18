<script setup lang="ts">
import { ref, computed, watch } from "vue";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";
import Pagination from "@/components/common/Pagination.vue";

const FIELDS = [
  { key: "liczbaUczniow", label: "Liczba uczniów" },
  { key: "dyrektorImie", label: "Imię dyrektora" },
  { key: "dyrektorNazwisko", label: "Nazwisko dyrektora" },
  { key: "email", label: "Adres e-mail" },
  { key: "telefon", label: "Numer telefonu" },
  { key: "stronaInternetowa", label: "Strona internetowa" },
  { key: "podmiotProwadzacyNazwa", label: "Nazwa podmiotu prowadzącego" },
  { key: "podmiotProwadzacyTyp", label: "Typ podmiotu prowadzącego" },
  { key: "statusPublicznoPrawny", label: "Status publiczno-prawny" },
  { key: "kodPocztowy", label: "Kod pocztowy" },
  { key: "ulica", label: "Ulica" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

interface SchoolFieldDiff {
  school: SchoolDTO;     // our DB version
  rspoSchool: SchoolDTO; // RSPO mirror version
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const selectedField = ref<FieldKey>("liczbaUczniow");
const rawDiffs = ref<SchoolFieldDiff[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);

const updatingIds = ref<Set<number>>(new Set());
const updatedIds = ref<Set<number>>(new Set());
const updateErrorIds = ref<Set<number>>(new Set());

const updatingAll = ref(false);
const updateAllSuccess = ref<string | null>(null);
const updateAllError = ref<string | null>(null);

const togglingAutoUpdateIds = ref<Set<number>>(new Set());
const autoUpdateErrorIds = ref<Set<number>>(new Set());

const selectedFieldLabel = computed(
  () => FIELDS.find((f) => f.key === selectedField.value)?.label ?? selectedField.value,
);

function unwrapValues<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "$values" in raw) {
    return ((raw as { $values: T[] }).$values ?? []) as T[];
  }
  return [];
}

function entityToDto(entity: Record<string, unknown>): SchoolDTO {
  const { $id, latitude, longitude, podmiotProwadzacy, geography, ...rest } = entity as Record<
    string,
    unknown
  > & { $id?: string };
  void $id;

  const dto = { ...rest } as unknown as SchoolDTO & Record<string, unknown>;

  if (podmiotProwadzacy !== undefined && dto.podmiotProwadzacyNazwa === undefined) {
    dto.podmiotProwadzacyNazwa = podmiotProwadzacy as string;
  }

  if (geography !== undefined) {
    dto.geography = geography as SchoolDTO["geography"];
  } else if (typeof latitude === "number" && typeof longitude === "number") {
    dto.geography = { x: longitude, y: latitude };
  }

  return dto;
}

function normalize(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  return String(val);
}

function differs(diff: SchoolFieldDiff, field: FieldKey): boolean {
  return normalize(getFieldValue(diff.school, field)) !== normalize(getFieldValue(diff.rspoSchool, field));
}

function getFieldValue(obj: SchoolDTO | null, field: FieldKey): string | number | null {
  if (!obj) return null;
  const val = (obj as unknown as Record<string, unknown>)[field];
  if (val === undefined) return null;
  return val as string | number | null;
}

function formatValue(val: string | number | null): string {
  if (val === null || val === undefined || val === "") return "—";
  return String(val);
}

const filteredDiffs = computed(() =>
  rawDiffs.value.filter((d) => differs(d, selectedField.value)),
);
const totalCount = computed(() => filteredDiffs.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));
const pagedItems = computed(() =>
  filteredDiffs.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value),
);

const pendingCount = computed(
  () => filteredDiffs.value.filter((d) => !updatedIds.value.has(d.school.numerRspo)).length,
);

async function fetchAll(): Promise<void> {
  loading.value = true;
  error.value = null;
  updatedIds.value = new Set();
  updateErrorIds.value = new Set();
  updateAllSuccess.value = null;
  updateAllError.value = null;
  try {
    // GetChanges has a paging bug — returns the full list regardless of size/page.
    // For our use case (need global counts), this is exactly what we want. But the
    // backend loads both whole tables into memory and runs a full Except, so on a real
    // RSPO database (~50k rows) it easily exceeds the 10s default axios timeout from
    // services/api.ts. Bump it to 5 minutes for this specific call.
    const res = await api.get("/api/Schools/GetChanges?size=999999&page=1", {
      timeout: 300000,
    });
    const body = res.data as { changedSchools?: unknown } | undefined;
    const rawChanges = unwrapValues<{
      schoolBeforeChanges?: Record<string, unknown>;
      schoolsAfterChanges?: Record<string, unknown>;
    }>(body?.changedSchools);

    // In GetChangedSchoolsList the constructor is new ChangedSchool(archived, current),
    // so schoolBeforeChanges = RSPO mirror, schoolsAfterChanges = our DB.
    rawDiffs.value = rawChanges
      .map<SchoolFieldDiff | null>((c) => {
        const rspoEntity = c.schoolBeforeChanges;
        const dbEntity = c.schoolsAfterChanges;
        if (!rspoEntity || !dbEntity) return null;
        return {
          school: entityToDto(dbEntity),
          rspoSchool: entityToDto(rspoEntity),
        };
      })
      .filter((x): x is SchoolFieldDiff => x !== null);
    currentPage.value = 1;
  } catch {
    error.value = "Nie udało się pobrać listy placówek.";
    rawDiffs.value = [];
  } finally {
    loading.value = false;
  }
}

async function updateSingle(diff: SchoolFieldDiff): Promise<void> {
  const rspoId = diff.school.numerRspo;
  updatingIds.value = new Set([...updatingIds.value, rspoId]);
  updateErrorIds.value = new Set([...updateErrorIds.value].filter((id) => id !== rspoId));
  try {
    const rspoVal = getFieldValue(diff.rspoSchool, selectedField.value);
    const payload: SchoolDTO = { ...diff.school, [selectedField.value]: rspoVal } as SchoolDTO;
    await api.put("/api/Schools/UpdateSingleSchool", payload);
    (diff.school as unknown as Record<string, unknown>)[selectedField.value] = rspoVal;
    updatedIds.value = new Set([...updatedIds.value, rspoId]);
  } catch {
    updateErrorIds.value = new Set([...updateErrorIds.value, rspoId]);
  } finally {
    updatingIds.value = new Set([...updatingIds.value].filter((id) => id !== rspoId));
  }
}

async function updateAll(): Promise<void> {
  const pending = filteredDiffs.value.filter((d) => !updatedIds.value.has(d.school.numerRspo));
  if (!pending.length) return;

  updatingAll.value = true;
  updateAllSuccess.value = null;
  updateAllError.value = null;
  try {
    const payload: SchoolDTO[] = pending.map((d) => ({
      ...d.school,
      [selectedField.value]: getFieldValue(d.rspoSchool, selectedField.value),
    } as SchoolDTO));
    await api.put("/api/Schools/UpdateManySchools", payload);
    pending.forEach((d) => {
      const rspoVal = getFieldValue(d.rspoSchool, selectedField.value);
      (d.school as unknown as Record<string, unknown>)[selectedField.value] = rspoVal;
      updatedIds.value = new Set([...updatedIds.value, d.school.numerRspo]);
    });
    updateAllSuccess.value = `Zaktualizowano ${pending.length.toLocaleString("pl-PL")} placówek.`;
  } catch {
    updateAllError.value = "Nie udało się zaktualizować wszystkich placówek.";
  } finally {
    updatingAll.value = false;
  }
}

async function toggleAutoUpdate(diff: SchoolFieldDiff): Promise<void> {
  const rspoId = diff.school.numerRspo;
  const newValue = !(diff.school.autoUpdate ?? false);
  togglingAutoUpdateIds.value = new Set([...togglingAutoUpdateIds.value, rspoId]);
  autoUpdateErrorIds.value = new Set([...autoUpdateErrorIds.value].filter((id) => id !== rspoId));
  try {
    const payload: SchoolDTO = { ...diff.school, autoUpdate: newValue };
    await api.put("/api/Schools/UpdateSingleSchool", payload);
    diff.school.autoUpdate = newValue;
  } catch {
    autoUpdateErrorIds.value = new Set([...autoUpdateErrorIds.value, rspoId]);
  } finally {
    togglingAutoUpdateIds.value = new Set(
      [...togglingAutoUpdateIds.value].filter((id) => id !== rspoId),
    );
  }
}

watch(selectedField, () => {
  currentPage.value = 1;
  updatedIds.value = new Set();
  updateErrorIds.value = new Set();
  updateAllSuccess.value = null;
  updateAllError.value = null;
});

watch(pageSize, () => {
  currentPage.value = 1;
});

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

fetchAll();
</script>

<template>
  <div class="space-y-4">
    <!-- Header controls -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <p class="text-sm text-gray-500 whitespace-nowrap">Porównaj z RSPO według pola:</p>
        <select
          v-model="selectedField"
          class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330] text-gray-700"
        >
          <option v-for="f in FIELDS" :key="f.key" :value="f.key">{{ f.label }}</option>
        </select>
      </div>

      <div v-if="!loading" class="flex flex-wrap items-center gap-3">
        <button
          @click="fetchAll"
          :disabled="loading"
          class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50"
          title="Odśwież dane z serwera"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Odśwież
        </button>
        <span class="text-gray-300 hidden sm:inline">|</span>
        <span class="text-sm text-gray-500 hidden sm:inline">Wierszy:</span>
        <select
          :value="pageSize"
          @change="pageSize = Number(($event.target as HTMLSelectElement).value)"
          class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]"
        >
          <option v-for="opt in PAGE_SIZE_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <button
          v-if="totalCount > 0"
          @click="updateAll"
          :disabled="updatingAll || pendingCount === 0"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="updatingAll" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{
            updatingAll
              ? "Aktualizowanie..."
              : `Zmień „${selectedFieldLabel}" w ${pendingCount} placówkach`
          }}
        </button>
      </div>
    </div>

    <!-- Info banner -->
    <div
      v-if="!loading && totalCount > 0"
      class="flex items-start gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-lg"
    >
      <svg class="w-4 h-4 shrink-0 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        <strong>{{ totalCount.toLocaleString("pl-PL") }}</strong>
        {{ totalCount === 1 ? "placówka różni się" : "placówek różni się" }} polem „{{ selectedFieldLabel }}" od RSPO.
        Przycisk po prawej zmieni wartości we wszystkich z nich naraz.
      </span>
    </div>

    <!-- Success / error banners -->
    <div
      v-if="updateAllSuccess"
      class="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      {{ updateAllSuccess }}
    </div>
    <div
      v-if="updateAllError"
      class="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {{ updateAllError }}
    </div>

    <!-- Table card -->
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
          Brak różnic — wszystkie placówki zgodne z RSPO dla pola „{{ selectedFieldLabel }}"
        </div>
        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="diff in pagedItems"
            :key="diff.school.numerRspo"
            class="p-4 space-y-2"
            :class="updatedIds.has(diff.school.numerRspo) ? 'opacity-50' : ''"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="font-medium text-sm text-gray-800 leading-snug">{{ diff.school.nazwa }}</div>
                <div class="text-xs font-mono text-gray-400 mt-0.5">{{ diff.school.numerRspo }}</div>
              </div>
              <span v-if="updatedIds.has(diff.school.numerRspo)" class="shrink-0 text-xs text-emerald-600 font-medium">Zaktualizowano</span>
              <span v-else-if="updateErrorIds.has(diff.school.numerRspo)" class="shrink-0 text-xs text-red-500">Błąd zapisu</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="rounded bg-gray-50 px-2 py-1.5">
                <div class="text-gray-400 mb-0.5">W bazie</div>
                <div class="font-medium text-gray-700 break-all">
                  {{ formatValue(getFieldValue(diff.school, selectedField)) }}
                </div>
              </div>
              <div class="rounded bg-amber-50 px-2 py-1.5">
                <div class="text-amber-600 mb-0.5">W RSPO</div>
                <div class="font-medium text-amber-800 break-all">
                  {{ formatValue(getFieldValue(diff.rspoSchool, selectedField)) }}
                </div>
              </div>
            </div>
            <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                :checked="diff.school.autoUpdate ?? false"
                :disabled="togglingAutoUpdateIds.has(diff.school.numerRspo)"
                @change="toggleAutoUpdate(diff)"
                class="rounded border-gray-300 text-[#051330] focus:ring-[#051330]/30 disabled:opacity-50"
              />
              <span>Auto-sync z RSPO</span>
              <span v-if="autoUpdateErrorIds.has(diff.school.numerRspo)" class="text-red-500">(błąd)</span>
            </label>
            <div v-if="!updatedIds.has(diff.school.numerRspo)">
              <button
                @click="updateSingle(diff)"
                :disabled="updatingIds.has(diff.school.numerRspo)"
                class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-white bg-[#051330] hover:bg-[#072244] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <svg v-if="updatingIds.has(diff.school.numerRspo)" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Zaktualizuj z RSPO
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
              <th class="text-left px-4 py-3 font-medium text-gray-600">Nazwa</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-44">
                <span class="text-gray-500">W bazie</span>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-44">
                <span class="text-amber-600">W RSPO</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-gray-600 w-24" title="Auto-aktualizacja z RSPO przy synchronizacji">
                Auto-sync
              </th>
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
                Brak różnic — wszystkie placówki zgodne z RSPO dla pola „{{ selectedFieldLabel }}"
              </td>
            </tr>
            <tr
              v-else
              v-for="diff in pagedItems"
              :key="diff.school.numerRspo"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              :class="updatedIds.has(diff.school.numerRspo) ? 'opacity-50' : ''"
            >
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ diff.school.numerRspo }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800">{{ diff.school.nazwa }}</div>
                <div class="text-xs text-gray-400 mt-0.5">
                  {{ [diff.school.miejscowosc, diff.school.powiat].filter(Boolean).join(", ") || "—" }}
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600 text-sm break-all">
                {{ formatValue(getFieldValue(diff.school, selectedField)) }}
              </td>
              <td class="px-4 py-3 text-sm break-all">
                <span class="text-amber-700 font-medium">
                  {{ formatValue(getFieldValue(diff.rspoSchool, selectedField)) }}
                </span>
              </td>
              <td class="px-3 py-3 text-center">
                <label class="inline-flex items-center justify-center cursor-pointer" :title="diff.school.autoUpdate ? 'Wyłącz auto-sync z RSPO' : 'Włącz auto-sync z RSPO'">
                  <input
                    type="checkbox"
                    :checked="diff.school.autoUpdate ?? false"
                    :disabled="togglingAutoUpdateIds.has(diff.school.numerRspo)"
                    @change="toggleAutoUpdate(diff)"
                    class="rounded border-gray-300 text-[#051330] focus:ring-[#051330]/30 disabled:opacity-50"
                  />
                </label>
                <div v-if="autoUpdateErrorIds.has(diff.school.numerRspo)" class="text-[10px] text-red-500 mt-0.5">błąd</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <span v-if="updatedIds.has(diff.school.numerRspo)" class="text-xs text-emerald-600 font-medium">Zaktualizowano</span>
                  <span v-else-if="updateErrorIds.has(diff.school.numerRspo)" class="text-xs text-red-500">Błąd</span>
                  <button
                    v-if="!updatedIds.has(diff.school.numerRspo)"
                    @click="updateSingle(diff)"
                    :disabled="updatingIds.has(diff.school.numerRspo)"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-[#051330] hover:bg-[#072244] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg v-if="updatingIds.has(diff.school.numerRspo)" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Zaktualizuj z RSPO
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
