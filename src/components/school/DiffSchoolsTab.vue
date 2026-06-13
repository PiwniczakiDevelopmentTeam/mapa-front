<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";
import type { PagedResult } from "@/models/common/PagedResult";

const router = useRouter();

const COMPARED_FIELDS = [
  { key: "nazwa", label: "Nazwa" },
  { key: "typ", label: "Typ" },
  { key: "statusPublicznoPrawny", label: "Status publiczno-prawny" },
  { key: "wojewodztwo", label: "Województwo" },
  { key: "gmina", label: "Gmina" },
  { key: "powiat", label: "Powiat" },
  { key: "miejscowosc", label: "Miejscowość" },
  { key: "gminaRodzaj", label: "Rodzaj gminy" },
  { key: "kodPocztowy", label: "Kod pocztowy" },
  { key: "ulica", label: "Ulica" },
  { key: "numerBudynku", label: "Nr budynku" },
  { key: "numerLokalu", label: "Nr lokalu" },
  { key: "email", label: "Email" },
  { key: "telefon", label: "Telefon" },
  { key: "stronaInternetowa", label: "Strona WWW" },
  { key: "dyrektorImie", label: "Imię dyrektora" },
  { key: "dyrektorNazwisko", label: "Nazwisko dyrektora" },
  { key: "nip", label: "NIP" },
  { key: "regon", label: "REGON" },
  { key: "liczbaUczniow", label: "Liczba uczniów" },
  { key: "kategoriaUczniow", label: "Kategoria uczniów" },
  { key: "specyfikaSzkoly", label: "Specyfika szkoły" },
  { key: "podmiotProwadzacyTyp", label: "Typ podmiotu" },
  { key: "podmiotProwadzacyNazwa", label: "Nazwa podmiotu" },
] as const;

type FieldKey = (typeof COMPARED_FIELDS)[number]["key"];

interface FieldDiff {
  key: FieldKey;
  label: string;
  dbValue: string | number | null;
  rspoValue: string | number | null;
}

interface Row {
  db: SchoolDTO;
  rspo: SchoolDTO | null;
  status: "loading" | "loaded" | "missing-rspo" | "error";
  diffs: FieldDiff[];
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const showAutoSyncOff = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);
const rows = ref<Row[]>([]);
const totalCount = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

const syncingIds = ref<Set<number>>(new Set());
const syncedIds = ref<Set<number>>(new Set());
const syncErrorIds = ref<Set<number>>(new Set());

const syncingAll = ref(false);
const syncAllSuccess = ref<string | null>(null);
const syncAllError = ref<string | null>(null);

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

function computeDiffs(db: SchoolDTO, rspo: SchoolDTO): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const f of COMPARED_FIELDS) {
    const dbV = (db as unknown as Record<string, unknown>)[f.key];
    const rspoV = (rspo as unknown as Record<string, unknown>)[f.key];
    if (normalize(dbV) !== normalize(rspoV)) {
      diffs.push({
        key: f.key,
        label: f.label,
        dbValue: (dbV ?? null) as string | number | null,
        rspoValue: (rspoV ?? null) as string | number | null,
      });
    }
  }
  return diffs;
}

function formatValue(val: string | number | null): string {
  if (val === null || val === undefined || val === "") return "—";
  return String(val);
}

const visibleRows = computed(() =>
  rows.value.filter((r) => {
    // Hide schools with auto-sync explicitly disabled unless user opts in.
    if (!showAutoSyncOff.value && r.db.autoUpdate === false) return false;
    if (r.status === "loading") return true;
    return r.diffs.length > 0;
  }),
);

const diffCountOnPage = computed(
  () => rows.value.filter((r) => r.status === "loaded" && r.diffs.length > 0).length,
);

const stillLoadingOnPage = computed(() => rows.value.some((r) => r.status === "loading"));

const syncableRows = computed(() =>
  rows.value.filter(
    (r) =>
      r.status === "loaded" &&
      r.diffs.length > 0 &&
      r.db.autoUpdate !== false &&
      !syncedIds.value.has(r.db.numerRspo),
  ),
);

const lockedCount = computed(
  () =>
    rows.value.filter(
      (r) =>
        r.status === "loaded" &&
        r.diffs.length > 0 &&
        r.db.autoUpdate === false,
    ).length,
);

async function fetchComparisonFor(row: Row): Promise<void> {
  try {
    const res = await api.get(
      `/api/Schools/GetSingleSchoolWithChanges?rspoId=${row.db.numerRspo}`,
    );
    const body = res.data as
      | { schoolBeforeChanges?: Record<string, unknown>; schoolsAfterChanges?: Record<string, unknown> }
      | undefined;
    // GetSingleSchoolWithChanges constructs ChangedSchool(singleSchool, singleSchoolFromRSPO),
    // so schoolsAfterChanges = RSPO side.
    const rspoEntity = body?.schoolsAfterChanges;
    if (!rspoEntity) {
      row.status = "missing-rspo";
      return;
    }
    row.rspo = entityToDto(rspoEntity);
    row.diffs = computeDiffs(row.db, row.rspo);
    row.status = "loaded";
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status === 404 || status === 500) {
      row.status = "missing-rspo";
    } else {
      row.status = "error";
    }
  }
}

async function fetchPage(): Promise<void> {
  loading.value = true;
  error.value = null;
  syncedIds.value = new Set();
  syncErrorIds.value = new Set();
  syncAllSuccess.value = null;
  syncAllError.value = null;
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
      diffs: [],
    }));

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

async function syncFromRspo(row: Row): Promise<void> {
  if (!row.rspo || row.diffs.length === 0) return;
  if (row.db.autoUpdate === false) return; // auto-sync disabled for this school
  const rspoId = row.db.numerRspo;
  syncingIds.value = new Set([...syncingIds.value, rspoId]);
  syncErrorIds.value = new Set([...syncErrorIds.value].filter((id) => id !== rspoId));
  try {
    const payload: SchoolDTO = { ...row.db };
    for (const diff of row.diffs) {
      (payload as unknown as Record<string, unknown>)[diff.key] = diff.rspoValue;
    }
    await api.put("/api/Schools/UpdateSingleSchool", payload);
    row.db = payload;
    row.diffs = [];
    syncedIds.value = new Set([...syncedIds.value, rspoId]);
  } catch {
    syncErrorIds.value = new Set([...syncErrorIds.value, rspoId]);
  } finally {
    syncingIds.value = new Set([...syncingIds.value].filter((id) => id !== rspoId));
  }
}

async function syncAllOnPage(): Promise<void> {
  const targets = syncableRows.value;
  if (!targets.length) return;

  syncingAll.value = true;
  syncAllSuccess.value = null;
  syncAllError.value = null;
  try {
    const payload: SchoolDTO[] = targets.map((r) => {
      const merged: SchoolDTO = { ...r.db };
      for (const diff of r.diffs) {
        (merged as unknown as Record<string, unknown>)[diff.key] = diff.rspoValue;
      }
      return merged;
    });
    await api.put("/api/Schools/UpdateManySchools", payload);
    targets.forEach((r) => {
      const merged: SchoolDTO = { ...r.db };
      for (const diff of r.diffs) {
        (merged as unknown as Record<string, unknown>)[diff.key] = diff.rspoValue;
      }
      r.db = merged;
      r.diffs = [];
      syncedIds.value = new Set([...syncedIds.value, r.db.numerRspo]);
    });
    syncAllSuccess.value = `Zsynchronizowano ${targets.length.toLocaleString("pl-PL")} placówek.`;
  } catch {
    syncAllError.value = "Nie udało się zsynchronizować placówek. Spróbuj ponownie.";
  } finally {
    syncingAll.value = false;
  }
}

watch(pageSize, () => {
  currentPage.value = 1;
  fetchPage();
});

watch(currentPage, () => {
  fetchPage();
});

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

function goToEdit(rspoId: number): void {
  router.push(`/placowki/${rspoId}/edytuj`);
}

fetchPage();
</script>

<template>
  <div class="space-y-4">
    <!-- Header / controls -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p class="text-sm text-gray-500">
        Placówki, w których jakiekolwiek pole różni się od danych w RSPO.
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <label class="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            v-model="showAutoSyncOff"
            type="checkbox"
            class="rounded border-gray-300 text-[#051330] focus:ring-[#051330]/30"
          />
          <span>Pokaż z wyłączonym auto-sync</span>
          <span v-if="lockedCount > 0" class="text-xs text-gray-400">({{ lockedCount }})</span>
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
          @click="syncAllOnPage"
          :disabled="syncingAll || stillLoadingOnPage || syncableRows.length === 0"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          :title="stillLoadingOnPage ? 'Trwa pobieranie porównań' : (syncableRows.length === 0 ? 'Brak placówek do synchronizacji' : 'Nadpisz różniące się pola wartościami z RSPO dla wszystkich placówek na tej stronie, które mają włączony auto-sync')"
        >
          <svg v-if="syncingAll" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ syncingAll ? "Synchronizowanie..." : `Synchronizuj ${syncableRows.length} na stronie` }}
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
        Strona przegląda wszystkie {{ totalCount.toLocaleString("pl-PL") }} placówek.
        Na tej stronie <strong>{{ diffCountOnPage }}</strong> ma różnice względem RSPO.
        <template v-if="lockedCount > 0 && !showAutoSyncOff">
          <strong>{{ lockedCount }}</strong>
          {{ lockedCount === 1 ? "z nich ma wyłączony auto-sync i jest ukryta" : "z nich ma wyłączony auto-sync i są ukryte" }}
          — zaznacz „Pokaż z wyłączonym auto-sync", aby je wyświetlić.
        </template>
        <template v-else-if="lockedCount > 0 && showAutoSyncOff">
          <strong>{{ lockedCount }}</strong>
          {{ lockedCount === 1 ? "z nich ma wyłączony auto-sync — nie zostanie zaktualizowana" : "z nich ma wyłączony auto-sync — nie zostaną zaktualizowane" }}
          masowym przyciskiem.
        </template>
      </span>
    </div>

    <!-- Bulk sync banners -->
    <div
      v-if="syncAllSuccess"
      class="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      {{ syncAllSuccess }}
    </div>
    <div
      v-if="syncAllError"
      class="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {{ syncAllError }}
    </div>

    <!-- List -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div v-if="error" class="px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
        {{ error }}
      </div>

      <div v-if="loading" class="px-4 py-12 text-center">
        <div class="flex items-center justify-center gap-2 text-gray-400">
          <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span class="text-sm">Ładowanie...</span>
        </div>
      </div>

      <div v-else-if="visibleRows.length === 0 && !stillLoadingOnPage" class="px-4 py-12 text-center text-gray-400 text-sm">
        Brak różnic na tej stronie — wszystkie placówki zgodne z RSPO
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="row in visibleRows"
          :key="row.db.numerRspo"
          class="px-4 py-4"
          :class="syncedIds.has(row.db.numerRspo) ? 'opacity-50' : ''"
        >
          <!-- Header -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono text-xs text-gray-400">{{ row.db.numerRspo }}</span>
                <span
                  v-if="row.status === 'loaded' && row.diffs.length > 0"
                  class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700"
                >
                  {{ row.diffs.length }} {{ row.diffs.length === 1 ? "różnica" : row.diffs.length < 5 ? "różnice" : "różnic" }}
                </span>
                <span
                  v-if="row.db.autoUpdate === false"
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200"
                  title="Auto-sync z RSPO wyłączony — synchronizacja nie zaktualizuje tej placówki"
                >
                  <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Auto-sync off
                </span>
                <span v-if="row.status === 'loading'" class="text-xs text-gray-400 italic">wczytywanie...</span>
                <span v-else-if="row.status === 'missing-rspo'" class="text-xs text-gray-400 italic">brak w RSPO</span>
                <span v-else-if="row.status === 'error'" class="text-xs text-red-500 italic">błąd wczytywania</span>
              </div>
              <div class="font-medium text-sm text-gray-800 mt-0.5 break-words">{{ row.db.nazwa }}</div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ [row.db.miejscowosc, row.db.powiat, row.db.wojewodztwo].filter(Boolean).join(", ") || "—" }}
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span v-if="syncedIds.has(row.db.numerRspo)" class="text-xs text-emerald-600 font-medium">Zsynchronizowano</span>
              <span v-else-if="syncErrorIds.has(row.db.numerRspo)" class="text-xs text-red-500">Błąd zapisu</span>
              <button
                @click="goToEdit(row.db.numerRspo)"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#051330] border border-[#051330]/20 hover:bg-[#051330] hover:text-white transition-colors"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edytuj
              </button>
              <button
                v-if="row.status === 'loaded' && row.diffs.length > 0 && !syncedIds.has(row.db.numerRspo)"
                @click="syncFromRspo(row)"
                :disabled="syncingIds.has(row.db.numerRspo) || row.db.autoUpdate === false"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                :title="row.db.autoUpdate === false ? 'Auto-sync wyłączony — włącz go w edycji placówki, jeśli chcesz zsynchronizować z RSPO' : 'Nadpisz wszystkie różniące się pola wartościami z RSPO'"
              >
                <svg v-if="syncingIds.has(row.db.numerRspo)" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Synchronizuj z RSPO
              </button>
            </div>
          </div>

          <!-- Diff details -->
          <div
            v-if="row.status === 'loaded' && row.diffs.length > 0"
            class="mt-3 ml-0 sm:ml-2 grid grid-cols-1 gap-1.5"
          >
            <div
              v-for="diff in row.diffs"
              :key="diff.key"
              class="grid grid-cols-[120px_1fr_auto_1fr] sm:grid-cols-[160px_1fr_auto_1fr] items-start gap-2 text-xs py-1 border-b border-gray-50 last:border-b-0"
            >
              <div class="font-medium text-gray-500 truncate">{{ diff.label }}</div>
              <div class="text-gray-700 break-words" :title="formatValue(diff.dbValue)">
                {{ formatValue(diff.dbValue) }}
              </div>
              <div class="text-gray-300 self-center">→</div>
              <div class="text-amber-700 font-medium break-words" :title="formatValue(diff.rspoValue)">
                {{ formatValue(diff.rspoValue) }}
              </div>
            </div>
          </div>
        </div>
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
