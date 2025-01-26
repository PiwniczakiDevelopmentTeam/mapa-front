<template>
  <div class="container">
    <div class="row">
      <div class="col-12 text-white">
        <h1 class="mt-4 mb-4">Nowe placówki</h1>

        <!-- Komponent filtrów (opcjonalnie) -->
        <SchoolPageFilters @applyFilters="onApplyFilters" />

        <div class="row mb-3">
          <!-- Pokaż nowe placówki -->
          <div
            class="col-4 text-white d-flex align-items-center"
            style="cursor: pointer;"
            @click="$router.push('/schools/new')"
          >
            <i class="bi bi-plus-circle me-2 icon-large"></i>
            Pokaż nowe placówki
          </div>

          <!-- Pokaż placówki do zaktualizowania -->
          <div
            class="col-4 text-white d-flex align-items-center"
            style="cursor: pointer;"
            @click="$router.push('/schools/update')"
          >
            <i class="bi bi-pencil-square me-2 icon-large"></i>
            Pokaż placówki do zaktualizowania
          </div>

          <!-- Pokaż placówki do usunięcia -->
          <div
            class="col-4 text-white d-flex align-items-center"
            style="cursor: pointer;"
            @click="$router.push('/schools/delete')"
          >
            <i class="bi bi-trash me-2 icon-large"></i>
            Pokaż placówki do usunięcia
          </div>
        </div>

        <!-- Lista z paginacją -->
        <SchoolPageList
          :schools="filteredSchools"
          :currentPage="currentPage"
          :itemsPerPage="itemsPerPage"
          :totalItems="totalItems"
          @page-changed="onPageChanged"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
axios.defaults.baseURL = 'https://api.dev.mapa.tomekb530.me';

import SchoolPageFilters from '@/components/SchoolPageComponents/SchoolPageFilters.vue';
import SchoolPageList from '@/components/SchoolPageComponents/SchoolPageList.vue';

export default {
  name: 'NewSchoolsPage',
  components: {
    SchoolPageFilters,
    SchoolPageList
  },
  data() {
    return {
      filteredSchools: [],
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      filters: {}
    };
  },
  async created() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        // Pobierz łączną liczbę "nowych" placówek
        const totalResponse = await axios.get('/api/Schools/GetMissingSchoolsInSchoolsTableCount');
        this.totalItems = totalResponse.data;

        // Pobierz bieżącą stronę danych
        const response = await axios.get('/api/Schools/GetMissingSchoolsInSchoolsTable', {
          params: {
            page: this.currentPage,
            size: this.itemsPerPage,
            ...this.filters
          }
        });

        this.filteredSchools = response.data;
      } catch (error) {
        console.error('Błąd pobierania nowych placówek:', error);
      }
    },

    onPageChanged(newPage) {
      this.currentPage = newPage;
      this.fetchData();
    },

    onApplyFilters(newFilters) {
      this.filters = newFilters;
      this.currentPage = 1;
      this.fetchData();
    }
  }
};
</script>

<style scoped>
.icon-large {
  font-size: 1.2rem;
}
</style>
