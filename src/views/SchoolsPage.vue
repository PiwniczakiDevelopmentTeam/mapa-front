<template>
  <div class="container">
    <div class="row">
      <div class="col-12 text-white">

        <h1 class="mt-4 mb-4">Placówki</h1>

        <!-- Komponent filtrów -->
        <SchoolPageFilters @applyFilters="onApplyFilters" />

        <div class="row">
          <div class="col-4 text-white d-flex align-items-center">
            <i class="bi bi-arrow-repeat me-2 icon-large"></i>
            Zaktualizuj listę placówek
          </div>
          <div class="col-4 text-white d-flex align-items-center">
            <i class="bi bi-arrow-repeat me-2 icon-large"></i>
            Zaktualizuj dane istniejących placówek
          </div>
          <div class="col-4 text-white d-flex align-items-center">
            <i class="bi bi-trash me-2 icon-large"></i>
            Usuń nieistniejące placówki
          </div>
        </div>

        <!-- Lista szkół z paginacją -->
        <SchoolPageList
          :schools="schools"
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
// Ustaw, jeśli masz osobną domenę dla API
axios.defaults.baseURL = 'https://api.dev.mapa.tomekb530.me';

import SchoolPageFilters from '@/components/SchoolPageComponents/SchoolPageFilters.vue';
import SchoolPageList from '@/components/SchoolPageComponents/SchoolPageList.vue';

export default {
  name: 'SchoolsPage',
  components: {
    SchoolPageFilters,
    SchoolPageList,
  },
  data() {
    return {
      schools: [],         // pobrana lista szkół
      currentPage: 1,      // numer aktualnej strony
      itemsPerPage: 20,    // ile wyników na stronę
      totalItems: 0,       // łączna liczba szkół
      filters: {},         // obiekt z filtrami (z SchoolPageFilters)
    };
  },
  created() {
    // Na starcie pobieramy listę szkół
    this.fetchSchools();
  },
  methods: {
    async fetchSchools() {
      try {
        // Parametry do API
        const params = {
          size: this.itemsPerPage,
          pageNumber: this.currentPage,
          // + ewentualne filtry
        };

        // GET /api/Schools/GetSchoolPage
        const response = await axios.get('/api/Schools/GetSchoolPage', { params });
        
        // Zakładam, że API zwraca tablicę szkół
        this.schools = response.data || [];

        // Ewentualnie zapisz total, jeśli API nie zwraca osobno:
        this.totalItems = this.schools.length;

      } catch (error) {
        console.error('Błąd podczas pobierania danych:', error);
      }
    },

    onPageChanged(newPage) {
      this.currentPage = newPage;
      this.fetchSchools();
    },

    onApplyFilters(newFilters) {
      // Odbieramy filtry i odświeżamy
      this.filters = newFilters;
      this.currentPage = 1;
      this.fetchSchools();
    },
  },
};
</script>

<style scoped>
.icon-large {
  font-size: 1.2rem;
}
</style>
