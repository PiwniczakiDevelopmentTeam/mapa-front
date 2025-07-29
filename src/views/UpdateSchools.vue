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
    <SchoolPageList
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
      totalItems: 0
    }
  },
  async created () {
    await this.fetchData()
  },
  methods: {
    async fetchData (page = 1) {
      try {
        const { data } = await api.get('/api/Schools/GetChanges', {
          params: { page, size: this.pageSize }
        })

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
            numerRspo: i.schoolBeforeChanges.numerRspo, // <--- DODAJ TO!
            isInLocalDb: true
          }))
      } catch (e) {
        console.error('Błąd pobierania zmian (GetChanges):', e)
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
