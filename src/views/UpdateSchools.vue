<template>
  <div class="container">
    <div class="row">
      <div class="col-12 text-white">
        <h1 class="mt-4 mb-4">Placówki do zaktualizowania</h1>

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

        <!-- SchoolPageList bez paginacji -->
        <SchoolPageList
          :schools="filteredSchools"
          :currentPage="1"
          :itemsPerPage="20"
          :totalItems="filteredSchools.length"
          :pagination="false"
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
  name: 'UpdateSchools',
  components: {
    SchoolPageFilters,
    SchoolPageList
  },
  data() {
    return {
      filteredSchools: [],
      currentPage: 1,
      itemsPerPage: 20,
      filters: {}
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
            page: 1,
            size: 20
          }
        });

        const all = response.data.changedSchools || [];

        const updatable = all.filter(item =>
          item.schoolBeforeChanges !== null &&
          item.schoolsAfterChanges !== null
        );
        
        this.filteredSchools = updatable.map(item => {
          return {
            ...item.schoolsAfterChanges,
            id: item.schoolBeforeChanges.id
          };
        });

      } catch (error) {
        console.error('Błąd pobierania changes - update:', error);
      }
    },
    onApplyFilters(newFilters) {
      this.filters = newFilters;
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
