<template>
  <div class="container mt-4 text-white">
    <div class="row gy-2">
      <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label" for="typ">Typ szkoły:</label>
        <select id="typ" class="form-select form-select-sm" v-model="filters.typ">
          <option value="">Wybierz typ</option>
          <option value="podstawowa">Podstawowa</option>
          <option value="srednia">Średnia</option>
          <option value="wyzsza">Wyższa</option>
        </select>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label" for="status">Status (publicz./pryw.):</label>
        <select id="status" class="form-select form-select-sm" v-model="filters.statusPublicznoPrawny">
          <option value="">Dowolny</option>
          <option value="publiczna">Publiczna</option>
          <option value="niepubliczna">Niepubliczna</option>
        </select>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label" for="woj">Województwo:</label>
        <input id="woj" type="text" class="form-control form-control-sm"
               v-model="filters.wojewodztwo" placeholder="Województwo" />
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label" for="powiat">Powiat:</label>
        <input id="powiat" type="text" class="form-control form-control-sm"
               v-model="filters.powiat" placeholder="Powiat" />
      </div>

      <div class="col-12 col-lg-2 mt-3 mt-lg-4">
        <button class="btn btn-primary w-100" @click="applyFilters">Zastosuj</button>
      </div>
      <div class="col-12 col-md-6 col-lg-1 d-flex align-items-center justify-content-end">
        <button class="btn btn-link d-flex align-items-center" type="button"
                data-bs-toggle="collapse" data-bs-target="#moreFilters"
                aria-expanded="false" aria-controls="moreFilters">
          <i class="bi bi-chevron-down ms-2 collapse-icon"
             :class="{ rotate: isExpanded }"></i>
        </button>
      </div>
    </div>

    <div id="moreFilters" class="collapse mt-2" @shown="isExpanded=true" @hidden="isExpanded=false">
      <div class="row gy-2">
        <div class="col-12 col-md-6 col-lg-3">
          <label class="form-label" for="gmina">Gmina:</label>
          <input id="gmina" type="text" class="form-control form-control-sm"
                 v-model="filters.gmina" placeholder="Gmina" />
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <label class="form-label" for="miejscowosc">Miejscowość:</label>
          <input id="miejscowosc" type="text" class="form-control form-control-sm"
                 v-model="filters.miejscowosc" placeholder="Miejscowość" />
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <label class="form-label" for="ulica">Ulica:</label>
          <input id="ulica" type="text" class="form-control form-control-sm"
                 v-model="filters.ulica" placeholder="Ulica" />
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <label class="form-label" for="nazwa">Nazwa:</label>
          <input id="nazwa" type="text" class="form-control form-control-sm"
                 v-model="filters.nazwa" placeholder="Nazwa" />
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <label class="form-label" for="rspo">Numer RSPO:</label>
          <input id="rspo" type="number" class="form-control form-control-sm"
                 v-model="filters.numerRspo" placeholder="Numer RSPO" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SchoolPageFilters',
  data() {
    return {
      filters: {
        typ: '',
        statusPublicznoPrawny: '',
        wojewodztwo: '',
        powiat: '',
        gmina: '',
        miejscowosc: '',
        ulica: '',
        nazwa: '',
        numerRspo: ''
      },
      isExpanded: false
    };
  },
  methods: {
    applyFilters() {
      this.$emit('applyFilters', { ...this.filters });
    }
  }
};
</script>

<style scoped>
.rotate {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
.collapse-icon {
  font-size: 2rem;
  color: white;
}
</style>
