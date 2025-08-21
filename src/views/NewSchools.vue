<template>
  <div class="container">
    <div class="row">
      <div class="col-12 text-white">
        <h1 class="mt-4 mb-4">Nowe placówki</h1>

        <div class="row mb-3">
          <div class="col-4 d-flex align-items-center text-white" style="cursor:pointer;" @click="$router.push('/schools/new')">
            <i class="bi bi-plus-circle me-2 icon-large"></i> Pokaż nowe placówki
          </div>
          <div class="col-4 d-flex align-items-center text-white" style="cursor:pointer;" @click="$router.push('/schools/update')">
            <i class="bi bi-pencil-square me-2 icon-large"></i> Pokaż placówki do zaktualizowania
          </div>
          <div class="col-4 d-flex align-items-center text-white" style="cursor:pointer;" @click="$router.push('/schools/delete')">
            <i class="bi bi-trash me-2 icon-large"></i> Pokaż placówki do usunięcia
          </div>
        </div>

        <!-- Loader -->
        <div v-if="isLoading" class="d-flex justify-content-center align-items-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Ładowanie...</span>
          </div>
          <span class="ms-3 text-white">Pobieranie nowych placówek...</span>
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
          :itemsPerPage="itemsPerPage"
          :totalItems="totalItems"
          @page-changed="onPageChanged"
          @school-deleted="onSchoolDeleted"
        />
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'
import SchoolPageList from '@/components/SchoolPageComponents/SchoolPageList.vue'

export default {
  name: 'NewSchoolsPage',
  components: { SchoolPageList },
  data () {
    return {
      schools: [],
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      isLoading: false,
      error: null
    }
  },
  async created () {
    await this.fetchData()
  },
  methods: {
    onSchoolDeleted(rspo) {
      this.schools = this.schools.filter(s => s.numerRspo !== rspo);
    },
    async fetchData () {
      this.isLoading = true
      this.error = null
      
      try {
        const { data } = await api.get('/api/Schools/GetChanges', {
          params: { size: this.itemsPerPage, page: this.currentPage }
        })
        
        console.log('API Response:', data) // Debug
        
        // Pobierz nowe placówki z różnych możliwych struktur
        const container = data.newSchools ?? data.NewSchools ?? {}
        const rawNew = Array.isArray(container) ? container : (container.$values ?? [])
        
        this.totalItems = data.totalItems ?? data.schoolsCount ?? rawNew.length
        
        this.schools = rawNew.map(s => ({
          ...s,
          numerRspo: s.numerRspo ?? s.numerRspoFromApi ?? s.id,
          isInLocalDb: false
        }))
        
        console.log('Mapped schools:', this.schools) // Debug
        
      } catch (e) {
        console.error('Błąd pobierania nowych placówek:', e)
        this.error = `Błąd pobierania danych: ${e.response?.data?.message || e.message}`
      } finally {
        this.isLoading = false
      }
    },
    onPageChanged (p) {
      this.currentPage = p
      this.fetchData()
    }
  }
}
</script>

<style scoped>
.icon-large{font-size:1.2rem;}
</style>
