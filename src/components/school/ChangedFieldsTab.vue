<script setup lang="ts">
import { ref, computed, watch } from "vue";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";
import type { PagedResult } from "@/models/common/PagedResult";

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

interface Row {
  db: SchoolDTO;
  rspo: SchoolDTO | null;
  status: "loading" | "loaded" | "missing-rspo" | "error";
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const selectedField = ref<FieldKey>("liczbaUczniow");
const showOnlyDiffs = ref(true);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);

const rows = ref<Row[]>([]);
const totalCount = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

const updatingIds = ref<Set<number>>(new Set());
const updatedIds = ref<Set<number>>(new Set());
const updateErrorIds = ref<Set<number>>(new Set());
const updatingAll = ref(false);
const updateAllSuccess = ref<string | null>(null);
const updateAllError = ref<string | null>(null);

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

function differs(row: Row, field: FieldKey): boolean {
  if (!row.rspo) return false;
  return normalize(getFieldValue(row.db, field)) !== normalize(getFieldValue(row.rspo, field));
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

const visibleRows = computed(() => {
  if (!showOnlyDiffs.value) return rows.value;
  return rows.value.filter((r) => r.status === "loading" || differs(r, selectedField.value));
});

const diffCountOnPage = computed(
  () => rows.value.filter((r) => r.status === "loaded" && differs(r, selectedField.value)).length,
);
const stillLoadingOnPage = computed(() => rows.value.some((r) => r.status === "loading"));

async function fetchComparisonFor(row: Row): Promise<void> {
  try {
    const res = await api.get(
      `/api/Schools/GetSingleSchoolWithChanges?rspoId=${row.db.numerRspo}`,
    );
    const body = res.data as
      | { schoolBeforeChanges?: Record<string, unknown>; schoolsAfterChanges?: Record<string, unknown> }
      | undefined;
    // GetSingleSchoolWithChanges constructs ChangedSchool(singleSchool, singleSchoolFromRSPO),
    // so schoolBeforeChanges = our DB, schoolsAfterChanges = RSPO.
    const rspoEntity = body?.schoolsAfterChanges;
    if (!rspoEntity) {
      row.status = "missing-rspo";
      return;
    }
    row.rspo = entityToDto(rspoEntity);
    row.status = "loaded";
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status === 404 || status === 500) {
      // Service throws SchoolServiceException when the RSPO mirror has no matching school,
      // which the controller surfaces as 500. Treat both as "no RSPO data".
      row.status = "missing-rspo";
    } else {
      row.status = "error";
    }
  }
}

async function fetchPage(): Promise<void> {
  loading.value = true;
  error.value = null;
  updatedIds.value = new Set();
  updateErrorIds.value = new Set();
  updateAllSuccess.value = null;
  updateAllError.value = null;
  rows.value = [];

  try {
    const res = await api.post<PagedResult<SchoolDTO>>(
      `/api/Schools/GetSchoolPage?size=${pageSize.value}&pageNumber=${currentPage.value}`,
      [],
    );
    const items = unwrapValues<Record<string, unknown>>(res.data.items);
    totalCount.value = res.data.totalCount ?? 0;

    rows.value = items.map<Row>((entity) => ({
      db: entityToDto(entity),
      rspo: null,
      status: "loading",
    }));

    // Fetch RSPO comparison for each row in parallel.
    await Promise.all(rows.value.map((r) => fetchComparisonFor(r)));
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status === 404) {
      totalCount.value = 0;
      rows.value = [];
    } else {
      error.value = "Nie udało się pobrać listy placówek.";
      rows.value = [];
    }
  } finally {
    loading.value = false;
  }
}

async function updateSingle(row: Row): Promise<void> {
  if (!row.rspo) return;
  const rspoId = row.db.numerRspo;
  updatingIds.value = new Set([...updatingIds.value, rspoId]);
  updateErrorIds.value = new Set([...updateErrorIds.value].filter((id) => id !== rspoId));
  try {
    const rspoVal = getFieldValue(row.rspo, selectedField.value);
    const payload: SchoolDTO & Record<string, unknown> = {
      ...row.db,
      [selectedField.value]: rspoVal,
    };
    await api.put("/api/Schools/UpdateSingleSchool", payload);
    // Reflect the new value locally so the diff disappears.
    (row.db as unknown as Record<string, unknown>)[selectedField.value] = rspoVal;
    updatedIds.value = new Set([...updatedIds.value, rspoId]);
  } catch {
    updateErrorIds.value = new Set([...updateErrorIds.value, rspoId]);
  } finally {
    updatingIds.value = new Set([...updatingIds.value].filter((id) => id !== rspoId));
  }
}

async function updateAllOnPage(): Promise<void> {
  const pending = rows.value.filter(
    (r) =>
      r.status === "loaded" &&
      differs(r, selectedField.value) &&
      !updatedIds.value.has(r.db.numerRspo),
  );
  if (!pending.length) return;

  updatingAll.value = true;
  updateAllSuccess.value = null;
  updateAllError.value = null;
  try {
    const payload: SchoolDTO[] = pending.map((r) => ({
      ...r.db,
      [selectedField.value]: getFieldValue(r.rspo, selectedField.value),
    }));
    await api.put("/api/Schools/UpdateManySchools", payload);
    pending.forEach((r) => {
      const rspoVal = getFieldValue(r.rspo, selectedField.value);
      (r.db as unknown as Record<string, unknown>)[selectedField.value] = rspoVal;
      updatedIds.value = new Set([...updatedIds.value, r.db.numerRspo]);
    });
    updateAllSuccess.value = `Zaktualizowano ${pending.length.toLocaleString("pl-PL")} placówek na tej stronie.`;
  } catch {
    updateAllError.value = "Nie udało się zaktualizować placówek.";
  } finally {
    updatingAll.value = false;
  }
}

watch(pageSize, () => {
  currentPage.value = 1;
  fetchPage();
});

watch(currentPage, () => {
  fetchPage();
});

watch(selectedField, () => {
  // No re-fetch needed: we have both sides cached. Just clear update state.
  updatedIds.value = new Set();
  updateErrorIds.value = new Set();
  updateAllSuccess.value = null;
  updateAllError.value = null;
});

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

fetchPage();
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

      <div class="flex flex-wrap items-center gap-3">
        <label class="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input v-model="showOnlyDiffs" type="checkbox" class="rounded border-gray-300 text-[#051330] focus:ring-[#051330]/30" />
          Pokaż tylko różnice
        </label>
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
          @click="updateAllOnPage"
          :disabled="updatingAll || stillLoadingOnPage || diffCountOnPage === 0"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          :title="stillLoadingOnPage ? 'Trwa pobieranie porównań' : ''"
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
              : `Zmień „${selectedFieldLabel}" w ${diffCountOnPage} placówkach`
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
        Lista paginowana po wszystkich {{ totalCount.toLocaleString("pl-PL") }} placówkach. Na tej stronie
        <strong>{{ diffCountOnPage }}</strong> placówek różni się polem „{{ selectedFieldLabel }}" od RSPO.
        Przycisk po prawej zmieni wartości w tych {{ diffCountOnPage }} placówkach. Przejdź na kolejne strony,
        aby zaktualizować pozostałe.
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
        <div v-else-if="visibleRows.length === 0" class="px-4 py-12 text-center text-gray-400 text-sm">
          {{ showOnlyDiffs ? "Brak różnic na tej stronie" : "Brak placówek" }}
        </div>
        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="row in visibleRows"
            :key="row.db.numerRspo"
            class="p-4 space-y-2"
            :class="updatedIds.has(row.db.numerRspo) ? 'opacity-50' : ''"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="font-medium text-sm text-gray-800 leading-snug">{{ row.db.nazwa }}</div>
                <div class="text-xs font-mono text-gray-400 mt-0.5">{{ row.db.numerRspo }}</div>
              </div>
              <span v-if="updatedIds.has(row.db.numerRspo)" class="shrink-0 text-xs text-emerald-600 font-medium">Zaktualizowano</span>
              <span v-else-if="updateErrorIds.has(row.db.numerRspo)" class="shrink-0 text-xs text-red-500">Błąd zapisu</span>
              <span v-else-if="row.status === 'loading'" class="shrink-0 text-xs text-gray-400">Wczytywanie...</span>
              <span v-else-if="row.status === 'missing-rspo'" class="shrink-0 text-xs text-gray-400">Brak w RSPO</span>
              <span v-else-if="row.status === 'error'" class="shrink-0 text-xs text-red-500">Błąd RSPO</span>
            </div>
            <div v-if="row.status === 'loaded'" class="grid grid-cols-2 gap-2 text-xs">
              <div class="rounded bg-gray-50 px-2 py-1.5">
                <div class="text-gray-400 mb-0.5">W bazie</div>
                <div class="font-medium text-gray-700 break-all">
                  {{ formatValue(getFieldValue(row.db, selectedField)) }}
                </div>
              </div>
              <div class="rounded px-2 py-1.5" :class="differs(row, selectedField) ? 'bg-amber-50' : 'bg-gray-50'">
                <div :class="differs(row, selectedField) ? 'text-amber-600' : 'text-gray-400'" class="mb-0.5">W RSPO</div>
                <div class="font-medium break-all" :class="differs(row, selectedField) ? 'text-amber-800' : 'text-gray-700'">
                  {{ formatValue(getFieldValue(row.rspo, selectedField)) }}
                </div>
              </div>
            </div>
            <div v-if="row.status === 'loaded' && differs(row, selectedField) && !updatedIds.has(row.db.numerRspo)">
              <button
                @click="updateSingle(row)"
                :disabled="updatingIds.has(row.db.numerRspo)"
                class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-white bg-[#051330] hover:bg-[#072244] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <svg v-if="updatingIds.has(row.db.numerRspo)" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
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
              <th class="px-4 py-3 w-44"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="px-4 py-12 text-center">
                <div class="flex items-center justify-center gap-2 text-gray-400">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span class="text-sm">Ładowanie...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="visibleRows.length === 0">
              <td colspan="5" class="px-4 py-12 text-center text-gray-400 text-sm">
                {{ showOnlyDiffs ? "Brak różnic na tej stronie — wszystkie placówki zgodne z RSPO" : "Brak placówek" }}
              </td>
            </tr>
            <tr
              v-else
              v-for="row in visibleRows"
              :key="row.db.numerRspo"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              :class="updatedIds.has(row.db.numerRspo) ? 'opacity-50' : ''"
            >
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ row.db.numerRspo }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800">{{ row.db.nazwa }}</div>
                <div class="text-xs text-gray-400 mt-0.5">
                  {{ [row.db.miejscowosc, row.db.powiat].filter(Boolean).join(", ") || "—" }}
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600 text-sm break-all">
                {{ formatValue(getFieldValue(row.db, selectedField)) }}
              </td>
              <td class="px-4 py-3 text-sm break-all">
                <span v-if="row.status === 'loading'" class="text-gray-400 italic">wczytywanie...</span>
                <span v-else-if="row.status === 'missing-rspo'" class="text-gray-400 italic">brak w RSPO</span>
                <span v-else-if="row.status === 'error'" class="text-red-500 italic">błąd</span>
                <span v-else :class="differs(row, selectedField) ? 'text-amber-700 font-medium' : 'text-gray-500'">
                  {{ formatValue(getFieldValue(row.rspo, selectedField)) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <span v-if="updatedIds.has(row.db.numerRspo)" class="text-xs text-emerald-600 font-medium">Zaktualizowano</span>
                  <span v-else-if="updateErrorIds.has(row.db.numerRspo)" class="text-xs text-red-500">Błąd</span>
                  <button
                    v-if="row.status === 'loaded' && differs(row, selectedField) && !updatedIds.has(row.db.numerRspo)"
                    @click="updateSingle(row)"
                    :disabled="updatingIds.has(row.db.numerRspo)"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-[#051330] hover:bg-[#072244] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg v-if="updatingIds.has(row.db.numerRspo)" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
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
