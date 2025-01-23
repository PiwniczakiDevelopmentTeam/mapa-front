<template>
    <div class="container">
      <div class="row">
        <div class="col-12 text-white">
          <h1 class="mt-4 mb-4">Nowe placówki</h1>
  
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
            :schools="filteredSchools"
            :currentPage="currentPage"
            :itemsPerPage="itemsPerPage"
            :totalItems="filteredSchools.length"
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
      SchoolPageList,
    },
    data() {
      return {
        filteredSchools: [],
        currentPage: 1,
        itemsPerPage: 20,
        filters: {},
      };
    },
    async created() {
      await this.fetchData();
    },
    methods: {
      async fetchData() {
        try {
          const response = await axios.get('/api/Schools/GetChanges', {
            params: {
              page: this.currentPage,
              size: this.itemsPerPage,
            },
          });
  
          const all = response.data.changedSchools || [];
  
          const newOnes = all.filter((item) =>
            item.schoolBeforeChanges === null &&
            item.schoolsAfterChanges !== null
          );
  

          this.filteredSchools = newOnes.map((item) => ({
            ...item.schoolsAfterChanges,
            id: null,
          }));
        } catch (error) {
          console.error('Błąd pobierania changes (new):', error);
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
      },
    },
  };
  </script>
  
  <style scoped>
  .icon-large {
    font-size: 1.2rem;
  }
  </style>
  