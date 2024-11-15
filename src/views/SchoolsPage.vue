<template>
    <div class="container">
      <div class="row">
        <div class="col-12 text-white">
          <h1 class="mt-4 mb-4">Placówki</h1>
          <SchoolPageFilters />
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
          <SchoolPageList />
        </div>
      </div>
    </div>
  </template>

<script>
import SchoolPageFilters from '@/components/SchoolPageComponents/SchoolPageFilters.vue';
import SchoolPageList from '@/components/SchoolPageComponents/SchoolPageList.vue';

    export default{
        name: 'SchoolsPage',
        components: {
            SchoolPageFilters,
            SchoolPageList,
        },
    }
</script>

<style scoped>
.icon-large {
  font-size: 1.2rem;
}
</style>