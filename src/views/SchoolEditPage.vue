<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import SchoolFormField from "@/components/school/SchoolFormField.vue";
import api from "@/services/api";
import type { SchoolDTO } from "@/models/school/SchoolDTO";

const route = useRoute();
const router = useRouter();

const isAddMode = computed(() => route.name === "SchoolAdd");
const rspoId = Number(route.params.rspoId);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const saveError = ref<string | null>(null);
const saved = ref(false);

const form = ref<SchoolDTO>({
  id: 0,
  numerRspo: 0,
  nazwa: "",
  geography: { x: 0, y: 0 },
});

const rspoForm = ref<SchoolDTO | null>(null);

onMounted(async () => {
  try {
    if (isAddMode.value) {
      const rspoRes = await api.post<SchoolDTO>(`/api/Schools/GetSingleSchoolFromRSPO?rspoId=${rspoId}`);
      form.value = rspoRes.data;
      if (!form.value.geography) form.value.geography = { x: 0, y: 0 };
      rspoForm.value = { ...form.value, geography: { ...form.value.geography! } };
    } else {
      const [schoolRes, rspoRes] = await Promise.allSettled([
        api.post<SchoolDTO>(`/api/Schools/GetSingleSchool?rspoId=${rspoId}`),
        api.post<SchoolDTO>(`/api/Schools/GetSingleSchoolFromRSPO?rspoId=${rspoId}`),
      ]);

      if (schoolRes.status === "fulfilled") {
        form.value = schoolRes.value.data;
        if (!form.value.geography) form.value.geography = { x: 0, y: 0 };
      } else {
        error.value = "Nie udało się pobrać danych placówki.";
      }

      if (rspoRes.status === "fulfilled") {
        rspoForm.value = rspoRes.value.data;
        if (rspoForm.value && !rspoForm.value.geography) rspoForm.value.geography = { x: 0, y: 0 };
      }
    }
  } catch {
    error.value = "Nie udało się pobrać danych placówki z RSPO.";
  } finally {
    loading.value = false;
  }
});

async function handleSave(): Promise<void> {
  saving.value = true;
  saveError.value = null;
  saved.value = false;
  try {
    if (isAddMode.value) {
      await api.post("/api/Schools/AddSingleSchool", form.value);
      router.push("/placowki");
    } else {
      await api.put("/api/Schools/UpdateSingleSchool", form.value);
      saved.value = true;
    }
  } catch {
    saveError.value = isAddMode.value
      ? "Nie udało się dodać placówki."
      : "Nie udało się zapisać zmian.";
  } finally {
    saving.value = false;
  }
}

function restoreFromRspo(): void {
  if (!rspoForm.value) return;
  form.value = { ...rspoForm.value };
  if (!form.value.geography) form.value.geography = { x: 0, y: 0 };
}

function setLat(v: string | number | null): void {
  if (form.value.geography) form.value.geography.y = Number(v);
}

function setLng(v: string | number | null): void {
  if (form.value.geography) form.value.geography.x = Number(v);
}

function goBack(): void {
  router.push("/placowki");
}
</script>

<template>
  <AppLayout>
    <template #header>
      <div class="flex items-center gap-3">
        <button
          @click="goBack"
          class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Placówki
        </button>
        <span class="text-gray-300">/</span>
        <h2 class="text-gray-800 font-semibold text-lg truncate">
          {{ loading ? "Ładowanie..." : isAddMode ? `Dodaj: ${form.nazwa}` : form.nazwa }}
        </h2>
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400 gap-2">
      <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="text-sm">Ładowanie danych placówki...</span>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
      {{ error }}
    </div>

    <form v-else @submit.prevent="handleSave" class="space-y-4 max-w-4xl">
      <div v-if="isAddMode" class="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-sm">
        Formularz wypełniony danymi z RSPO. Możesz je zmodyfikować przed dodaniem do bazy.
      </div>
      <div v-if="saved" class="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
        Zmiany zostały zapisane.
      </div>
      <div v-if="saveError" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        {{ saveError }}
      </div>

      <!-- Dane podstawowe -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 class="font-medium text-gray-800 text-sm border-b border-gray-100 pb-3">Dane podstawowe</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SchoolFormField
            label="Numer RSPO"
            :modelValue="form.numerRspo"
            type="number"
            disabled
          />
          <SchoolFormField
            label="Nazwa"
            :modelValue="form.nazwa"
            :rspoValue="rspoForm?.nazwa"
            required
            @update:modelValue="form.nazwa = String($event ?? '')"
          />
          <SchoolFormField
            label="Typ placówki"
            :modelValue="form.typ"
            :rspoValue="rspoForm?.typ"
            @update:modelValue="form.typ = String($event ?? '')"
          />
          <SchoolFormField
            label="Status publiczno-prawny"
            :modelValue="form.statusPublicznoPrawny"
            :rspoValue="rspoForm?.statusPublicznoPrawny"
            @update:modelValue="form.statusPublicznoPrawny = String($event ?? '')"
          />
          <SchoolFormField
            label="Specyfika szkoły"
            :modelValue="form.specyfikaSzkoly"
            :rspoValue="rspoForm?.specyfikaSzkoly"
            @update:modelValue="form.specyfikaSzkoly = String($event ?? '')"
          />
          <SchoolFormField
            label="Kategoria uczniów"
            :modelValue="form.kategoriaUczniow"
            :rspoValue="rspoForm?.kategoriaUczniow"
            @update:modelValue="form.kategoriaUczniow = String($event ?? '')"
          />
          <SchoolFormField
            label="Liczba uczniów"
            :modelValue="form.liczbaUczniow"
            :rspoValue="rspoForm?.liczbaUczniow"
            type="number"
            @update:modelValue="form.liczbaUczniow = Number($event)"
          />
        </div>
      </div>

      <!-- Identyfikatory -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 class="font-medium text-gray-800 text-sm border-b border-gray-100 pb-3">Identyfikatory</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SchoolFormField
            label="NIP"
            :modelValue="form.nip"
            :rspoValue="rspoForm?.nip"
            @update:modelValue="form.nip = String($event ?? '')"
          />
          <SchoolFormField
            label="REGON"
            :modelValue="form.regon"
            :rspoValue="rspoForm?.regon"
            @update:modelValue="form.regon = String($event ?? '')"
          />
        </div>
      </div>

      <!-- Adres -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 class="font-medium text-gray-800 text-sm border-b border-gray-100 pb-3">Adres</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SchoolFormField
            label="Województwo"
            :modelValue="form.wojewodztwo"
            :rspoValue="rspoForm?.wojewodztwo"
            @update:modelValue="form.wojewodztwo = String($event ?? '')"
          />
          <SchoolFormField
            label="Powiat"
            :modelValue="form.powiat"
            :rspoValue="rspoForm?.powiat"
            @update:modelValue="form.powiat = String($event ?? '')"
          />
          <SchoolFormField
            label="Gmina"
            :modelValue="form.gmina"
            :rspoValue="rspoForm?.gmina"
            @update:modelValue="form.gmina = String($event ?? '')"
          />
          <SchoolFormField
            label="Rodzaj gminy"
            :modelValue="form.gminaRodzaj"
            :rspoValue="rspoForm?.gminaRodzaj"
            @update:modelValue="form.gminaRodzaj = String($event ?? '')"
          />
          <SchoolFormField
            label="Miejscowość"
            :modelValue="form.miejscowosc"
            :rspoValue="rspoForm?.miejscowosc"
            @update:modelValue="form.miejscowosc = String($event ?? '')"
          />
          <SchoolFormField
            label="Ulica"
            :modelValue="form.ulica"
            :rspoValue="rspoForm?.ulica"
            @update:modelValue="form.ulica = String($event ?? '')"
          />
          <SchoolFormField
            label="Kod pocztowy"
            :modelValue="form.kodPocztowy"
            :rspoValue="rspoForm?.kodPocztowy"
            @update:modelValue="form.kodPocztowy = String($event ?? '')"
          />
          <SchoolFormField
            label="Nr budynku"
            :modelValue="form.numerBudynku"
            :rspoValue="rspoForm?.numerBudynku"
            @update:modelValue="form.numerBudynku = String($event ?? '')"
          />
          <SchoolFormField
            label="Nr lokalu"
            :modelValue="form.numerLokalu"
            :rspoValue="rspoForm?.numerLokalu"
            @update:modelValue="form.numerLokalu = String($event ?? '')"
          />
        </div>
      </div>

      <!-- Kontakt -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 class="font-medium text-gray-800 text-sm border-b border-gray-100 pb-3">Kontakt</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SchoolFormField
            label="Email"
            :modelValue="form.email"
            :rspoValue="rspoForm?.email"
            type="email"
            @update:modelValue="form.email = String($event ?? '')"
          />
          <SchoolFormField
            label="Telefon"
            :modelValue="form.telefon"
            :rspoValue="rspoForm?.telefon"
            @update:modelValue="form.telefon = String($event ?? '')"
          />
          <SchoolFormField
            label="Strona internetowa"
            :modelValue="form.stronaInternetowa"
            :rspoValue="rspoForm?.stronaInternetowa"
            @update:modelValue="form.stronaInternetowa = String($event ?? '')"
          />
          <SchoolFormField
            label="Dyrektor — imię"
            :modelValue="form.dyrektorImie"
            :rspoValue="rspoForm?.dyrektorImie"
            @update:modelValue="form.dyrektorImie = String($event ?? '')"
          />
          <SchoolFormField
            label="Dyrektor — nazwisko"
            :modelValue="form.dyrektorNazwisko"
            :rspoValue="rspoForm?.dyrektorNazwisko"
            @update:modelValue="form.dyrektorNazwisko = String($event ?? '')"
          />
        </div>
      </div>

      <!-- Podmiot prowadzący -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 class="font-medium text-gray-800 text-sm border-b border-gray-100 pb-3">Podmiot prowadzący</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SchoolFormField
            label="Typ podmiotu"
            :modelValue="form.podmiotProwadzacyTyp"
            :rspoValue="rspoForm?.podmiotProwadzacyTyp"
            @update:modelValue="form.podmiotProwadzacyTyp = String($event ?? '')"
          />
          <SchoolFormField
            label="Nazwa podmiotu"
            :modelValue="form.podmiotProwadzacyNazwa"
            :rspoValue="rspoForm?.podmiotProwadzacyNazwa"
            @update:modelValue="form.podmiotProwadzacyNazwa = String($event ?? '')"
          />
        </div>
      </div>

      <!-- Daty -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 class="font-medium text-gray-800 text-sm border-b border-gray-100 pb-3">Daty</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SchoolFormField
            label="Data rozpoczęcia"
            :modelValue="form.dataRozpoczecia"
            :rspoValue="rspoForm?.dataRozpoczecia"
            type="date"
            @update:modelValue="form.dataRozpoczecia = String($event ?? '')"
          />
          <SchoolFormField
            label="Data założenia"
            :modelValue="form.dataZalozenia"
            :rspoValue="rspoForm?.dataZalozenia"
            type="date"
            @update:modelValue="form.dataZalozenia = String($event ?? '')"
          />
          <SchoolFormField
            label="Data zakończenia"
            :modelValue="form.dataZakonczenia"
            :rspoValue="rspoForm?.dataZakonczenia"
            type="date"
            @update:modelValue="form.dataZakonczenia = String($event ?? '')"
          />
          <SchoolFormField
            label="Data likwidacji"
            :modelValue="form.dataLikwidacji"
            :rspoValue="rspoForm?.dataLikwidacji"
            type="date"
            @update:modelValue="form.dataLikwidacji = String($event ?? '')"
          />
        </div>
      </div>

      <!-- Lokalizacja -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 class="font-medium text-gray-800 text-sm border-b border-gray-100 pb-3">Lokalizacja</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SchoolFormField
            label="Szerokość geograficzna (lat)"
            :modelValue="form.geography?.y"
            :rspoValue="rspoForm?.geography?.y"
            type="number"
            step="any"
            @update:modelValue="setLat"
          />
          <SchoolFormField
            label="Długość geograficzna (lng)"
            :modelValue="form.geography?.x"
            :rspoValue="rspoForm?.geography?.x"
            type="number"
            step="any"
            @update:modelValue="setLng"
          />
        </div>
      </div>

      <!-- Akcje -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          v-if="rspoForm"
          type="button"
          @click="restoreFromRspo"
          class="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-amber-400 text-amber-700 hover:bg-amber-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Przywróć wszystkie wartości z RSPO
        </button>
        <div v-else />
        <div class="flex items-center gap-3 sm:justify-end">
          <button
            type="button"
            @click="goBack"
            class="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            :disabled="saving"
            :class="[
              'flex items-center gap-2 px-4 py-2 text-sm rounded-md text-white font-medium transition-colors',
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#051330] hover:bg-[#072244]',
            ]"
          >
            <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? (isAddMode ? "Dodawanie..." : "Zapisywanie...") : (isAddMode ? "Dodaj do bazy" : "Zapisz zmiany") }}
          </button>
        </div>
      </div>
    </form>
  </AppLayout>
</template>
