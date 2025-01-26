<template>
  <div class="container mt-4 text-white">
    <h1>Placówki do zaktualizowania</h1>

    <!-- Komponent filtrów (opcjonalne) -->
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

    <!-- Przykładowy komponent listy z paginacją -->
    <SchoolPageList
      :schools="filteredSchools"
      :currentPage="currentPage"
      :itemsPerPage="pageSize"
      :totalItems="totalItems"
      :pagination="true"
      @pageChanged="onPageChanged"
    />
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
      filteredSchools: [],    // Dane wyświetlane w tabeli/listcie
      currentPage: 1,         // Numer aktualnej strony
      pageSize: 20,           // Liczba elementów na stronę
      totalItems: 0,          // Łączna liczba elementów (z `schoolsCount`)
      filters: {}             // Opcjonalnie obiekt filtrów
    };
  },
  async created() {
    await this.fetchData(this.currentPage);
  },
  methods: {
    /**
     * Pobiera jedną, konkretną stronę z serwera, bazując na `currentPage` i `pageSize`.
     */
    async fetchData(page = 1) {
      try {
        // Wywołanie endpointu
        const response = await axios.get('/api/Schools/GetChanges', {
          params: {
            page: page,
            size: this.pageSize,
            ...this.filters
          }
        });

        // Oczekujemy struktury:
        // {
        //   changedSchools: [...],
        //   schoolsCount: number,
        //   corruptedRSPO: [...]
        // }
        const { changedSchools = [], schoolsCount = 0 } = response.data;

        // Ustawiamy totalItems, co pozwala nam zbudować paginację
        this.totalItems = schoolsCount;

        // Filtrujemy i mapujemy to, co ma `schoolBeforeChanges` i `schoolsAfterChanges`
        const updatable = changedSchools.filter(
          (item) => item.schoolBeforeChanges && item.schoolsAfterChanges
        );

        this.filteredSchools = updatable.map((item) => ({
          ...item.schoolsAfterChanges,
          id: item.schoolBeforeChanges.id,
          isInLocalDb: true
        }));
      } catch (error) {
        console.error('Błąd pobierania zmian (GetChanges):', error);
      }
    },

    /**
     * Wywoływana, gdy user przełączy się na inną stronę w paginacji.
     */
    onPageChanged(newPage) {
      this.currentPage = newPage;
      this.fetchData(newPage);
    },

    /**
     * Wywoływana, gdy user zmieni filtry w SchoolPageFilters.
     * Pobieramy od nowa stronę 1, bo filtry się zmieniły.
     */
    onApplyFilters(newFilters) {
      this.filters = newFilters;
      this.currentPage = 1;
      this.fetchData(1);
    }
  }
};
</script>

<style scoped>

</style>
