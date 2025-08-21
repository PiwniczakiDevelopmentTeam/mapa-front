<template>
  <div class="container">
    <div class="row">
      <div class="col-12 text-white">
        <h1 class="mt-4 mb-4">Placówki</h1>

        <SchoolPageFilters @applyFilters="onApplyFilters" />

        <!-- Loader -->
        <div v-if="isLoading" class="d-flex justify-content-center align-items-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Ładowanie...</span>
          </div>
          <span class="ms-3 text-white">Pobieranie listy placówek...</span>
        </div>

        <!-- Błąd -->
        <div v-else-if="error" class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle me-2"></i>
          {{ error }}
          <button @click="fetchSchools" class="btn btn-outline-danger btn-sm ms-3">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Spróbuj ponownie
          </button>
        </div>

        <!-- Lista szkół -->
        <div v-else>
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
  </div>
</template>

<script>
import api from '@/services/api';
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
      filterSets: [],
      isLoading: false,
      error: null
    };
  },
  async created() {
    await this.fetchSchoolsCount();
    await this.fetchSchools();
  },
  methods: {
     async onApplyFilters(rawFilters) {
      this.filterSets = Object.entries(rawFilters)
        .filter(([, val]) => val)
        .map(([field, value]) => ({ field, value }));

      this.currentPage = 1;
      await this.fetchSchoolsCount();
      await this.fetchSchools();
    },
    async fetchSchoolsCount() {
      try {
        const response = await api.get('/api/Schools/GetSchoolsCount');
        this.totalItems = response.data?.totalCount || 0;
      } catch (error) {
        console.error('Błąd podczas pobierania łącznej liczby placówek:', error);
        this.error = `Błąd pobierania liczby placówek: ${error.response?.data?.message || error.message}`;
      }
    },
    async fetchSchools() {
      this.isLoading = true
      this.error = null
      
      try {
        const queryParams = new URLSearchParams({
          size: this.itemsPerPage,
          pageNumber: this.currentPage,
        }).toString();

        const url = `/api/Schools/GetSchoolPage?${queryParams}`;

        const body = Array.isArray(this.filterSets) ? this.filterSets : [];
     
        const response = await api.post(url, body, {
          headers: { 'Content-Type': 'application/json' },
        });

        console.log('API Response (Schools):', response.data) // Debug

        const rawList = response.data?.items?.$values || [];

        this.schools = rawList.map((school) => ({
          ...school,
          isInLocalDb: true,
        }));
        
        console.log('Mapped schools (Schools):', this.schools) // Debug
        
      } catch (error) {
        console.error('Błąd podczas pobierania listy placówek:', error);
        this.error = `Błąd pobierania placówek: ${error.response?.data?.message || error.message}`;
      } finally {
        this.isLoading = false
      }
    },
onPageChanged(newPage) {
    this.currentPage = newPage;
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
