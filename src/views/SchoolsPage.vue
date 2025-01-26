<template>
  <div class="container">
    <div class="row">
      <div class="col-12 text-white">
        <h1 class="mt-4 mb-4">Placówki</h1>

        <SchoolPageFilters @applyFilters="onApplyFilters" />

        <div class="row mb-3">
          <div
            class="col-4 text-white d-flex align-items-center"
            style="cursor: pointer;"
            @click="$router.push('/schools/new')"
          >
            <i class="bi bi-plus-circle me-2 icon-large"></i>
            Pokaż nowe placówki
          </div>
          <div
            class="col-4 text-white d-flex align-items-center"
            style="cursor: pointer;"
            @click="$router.push('/schools/update')"
          >
            <i class="bi bi-pencil-square me-2 icon-large"></i>
            Pokaż placówki do zaktualizowania
          </div>
          <div
            class="col-4 text-white d-flex align-items-center"
            style="cursor: pointer;"
            @click="$router.push('/schools/delete')"
          >
            <i class="bi bi-trash me-2 icon-large"></i>
            Pokaż placówki do usunięcia
          </div>
        </div>

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
      schools: [],
      totalItems: 0,
      currentPage: 1,
      itemsPerPage: 20,
      filters: {},
    };
  },
  async created() {
    await this.fetchSchoolsCount();
    await this.fetchSchools();
  },
  methods: {
    async fetchSchoolsCount() {
      try {
        const response = await axios.get('/api/Schools/GetSchoolsCount');
        this.totalItems = response.data;
      } catch (error) {
        console.error('Błąd podczas pobierania łącznej liczby placówek:', error);
      }
    },
    async fetchSchools() {
      try {
        const params = {
          size: this.itemsPerPage,
          pageNumber: this.currentPage,
        };
        const response = await axios.get('/api/Schools/GetSchoolPage', { params });
    
        // Każdy rekord z serwera opakowujemy i ustawiamy isInLocalDb = true
        this.schools = (response.data || []).map(school => ({
          ...school,
          isInLocalDb: true
    }));
      } catch (error) {
        console.error('Błąd podczas pobierania listy placówek:', error);
      }
    },
    onPageChanged(newPage) {
      this.currentPage = newPage;
      this.fetchSchools();
    },
    onApplyFilters(newFilters) {
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
