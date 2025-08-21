<template>
  <div class="container mt-4 text-white">
    <h1>Placówki do zaktualizowania</h1>
    <div class="row mb-3">
      <div class="col-4 text-white d-flex align-items-center" style="cursor:pointer;" @click="$router.push('/schools/new')">
        <i class="bi bi-plus-circle me-2 icon-large"></i>
        Pokaż nowe placówki
      </div>
      <div class="col-4 text-white d-flex align-items-center" style="cursor:pointer;" @click="$router.push('/schools/update')">
        <i class="bi bi-pencil-square me-2 icon-large"></i>
        Pokaż placówki do zaktualizowania
      </div>
      <div class="col-4 text-white d-flex align-items-center" style="cursor:pointer;" @click="$router.push('/schools/delete')">
        <i class="bi bi-trash me-2 icon-large"></i>
        Pokaż placówki do usunięcia
      </div>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Ładowanie...</span>
      </div>
      <span class="ms-3 text-white">Pobieranie placówek do aktualizacji...</span>
    </div>

    <!-- Błąd -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ error }}
      <button @click="fetchData" class="btn btn-outline-danger btn-sm ms-3">
        <i class="bi bi-arrow-clockwise me-1"></i>
        Spróbuj ponownie
      </button>
    </div>

    <!-- Lista szkół -->
    <SchoolPageList
      v-else
      :schools="schools"
      :currentPage="currentPage"
      :itemsPerPage="pageSize"
      :totalItems="totalItems"
      @page-changed="onPageChanged"
    />
  </div>
</template>

<script>
import api from '@/services/api'
import SchoolPageList from '@/components/SchoolPageComponents/SchoolPageList.vue'

export default {
  name: 'UpdateSchools',
  components: { SchoolPageList },
  data () {
    return {
      schools: [],
      currentPage: 1,
      pageSize: 20,
      totalItems: 0,
      isLoading: false,
      error: null
    }
  },
  async created () {
    await this.fetchData()
  },
  methods: {
    async fetchData (page = 1) {
      this.isLoading = true
      this.error = null
      
      try {
        const { data } = await api.get('/api/Schools/GetChanges', {
          params: { page, size: this.pageSize }
        })

        console.log('API Response (UpdateSchools):', data) // Debug

        const container =
          data.changedSchools ??
          data.ChangedSchools ??
          {}

        const raw =
          Array.isArray(container)
            ? container
            : container.$values ?? []

        this.totalItems =
          data.schoolsCount ??
          data.totalItems ??
          raw.length

        this.schools = raw
          .filter(i => i?.schoolBeforeChanges && i?.schoolsAfterChanges)
          .map(i => ({
            ...i.schoolsAfterChanges,
            id: i.schoolBeforeChanges.id,
            numerRspo: i.schoolBeforeChanges.numerRspo,
            isInLocalDb: true
          }))
          
        console.log('Mapped schools (UpdateSchools):', this.schools) // Debug
        
      } catch (e) {
        console.error('Błąd pobierania zmian (GetChanges):', e)
        this.error = `Błąd pobierania danych: ${e.response?.data?.message || e.message}`
      } finally {
        this.isLoading = false
      }
    },
    onPageChanged (p) {
      this.currentPage = p
      this.fetchData(p)
    }
  }
}
</script>

<style scoped>
.icon-large{font-size:1.2rem;}
</style>
