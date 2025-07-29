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

        <SchoolPageList
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
      totalItems: 0
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
      try {
        const { data } = await api.get('/api/Schools/GetChanges', {
          params: { size: this.itemsPerPage, page: this.currentPage }
        })
        const rawNew = data.newSchools?.$values || data.NewSchools || []
        this.totalItems = data.totalItems ?? data.schoolsCount ?? rawNew.length
        this.schools = rawNew.map(s => ({
          ...s,
          numerRspo: s.numerRspo ?? s.numerRspoFromApi, // fallback jeśli masz inne źródło
          isInLocalDb: false
        }));     
       } catch (e) {
        console.error('Błąd pobierania nowych placówek:', e)
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
