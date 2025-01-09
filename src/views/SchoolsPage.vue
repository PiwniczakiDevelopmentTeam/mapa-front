<template>
  <div class="container">
    <div class="row">
      <div class="col-12 text-white">
        <h1 class="mt-4 mb-4">Placówki</h1>

        <!-- Filtry (opcjonalnie) -->
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

        <!-- Lista z paginacją -->
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
axios.defaults.baseURL = 'https://api.dev.mapa.tomekb530.me'; 
// lub inna domena, jeśli Twoje API stoi gdzieś indziej

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
      schools: [],        // pobrana lista z danej strony
      totalItems: 0,      // łączna liczba placówek (do paginacji)
      currentPage: 1,     // numer aktualnej strony
      itemsPerPage: 20,   // ile wyników na stronę
      filters: {},        // filtry (jeśli potrzebne)
    };
  },
  async created() {
    // Po załadowaniu komponentu pobierz liczbę placówek i pierwszą stronę.
    // Możesz to zrobić w jednej metodzie, tutaj robię prosto w created():
    await this.fetchSchoolsCount();  // (A) pobierz total
    await this.fetchSchools();       // (B) pobierz pierwszą stronę
  },
  methods: {
    // (A) Pobieranie łącznej liczby placówek
    async fetchSchoolsCount() {
      try {
        const response = await axios.get('/api/Schools/GetSchoolsCount');
        this.totalItems = response.data; // zakładamy, że to jest integer
      } catch (error) {
        console.error('Błąd podczas pobierania łącznej liczby placówek:', error);
      }
    },

    // (B) Pobieranie listy (strony) placówek
    async fetchSchools() {
      try {
        const params = {
          size: this.itemsPerPage,
          pageNumber: this.currentPage,
          // ewentualne filtry z this.filters
        };
        const response = await axios.get('/api/Schools/GetSchoolPage', { params });
        this.schools = response.data || [];
      } catch (error) {
        console.error('Błąd podczas pobierania listy placówek:', error);
      }
    },

    // Wywoływane, gdy w paginacji klikniemy na inną stronę
    onPageChanged(newPage) {
      this.currentPage = newPage;
      this.fetchSchools();
    },

    // Gdy użytkownik kliknie "Zastosuj filtry"
    onApplyFilters(newFilters) {
      this.filters = newFilters;
      this.currentPage = 1;
      // Możesz zaktualizować total, jeśli filtry zmieniają liczbę wyników
      // czekaj: 
      // await this.fetchSchoolsCount();
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
