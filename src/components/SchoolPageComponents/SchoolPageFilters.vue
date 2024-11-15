<template>
    <div class="container mt-4 text-white">
      <div class="row">
        <div class="col-12 col-md-6 col-lg-3">
          <div class="form-group">
            <label for="type">Typ szkoły:</label>
            <select class="form-control form-control-sm" id="type" v-model="filters.type">
              <option value="">Wybierz typ</option>
              <option value="primary">Podstawowa</option>
              <option value="secondary">Średnia</option>
              <option value="university">Uniwersytet</option>
            </select>
          </div>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <div class="form-group">
            <label for="voivodeship">Województwo:</label>
            <input type="text" class="form-control form-control-sm" id="voivodeship" v-model="filters.voivodeship" placeholder="Wpisz województwo">
          </div>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <div class="form-group">
            <label for="county">Powiat:</label>
            <input type="text" class="form-control form-control-sm" id="county" v-model="filters.county" placeholder="Wpisz powiat">
          </div>
        </div>
        <div class="col-12 col-lg-2 mt-4">
          <button class="btn btn-primary w-100" @click="applyFilters">Zastosuj filtry</button>
        </div>
        <div class="col-12 col-md-6 col-lg-1 d-flex align-items-center justify-content-end">
          <button
            class="btn btn-link d-flex align-items-center"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#moreFilters"
            aria-expanded="false"
            aria-controls="moreFilters"
          >
            <i class="bi bi-chevron-down ms-2 collapse-icon" :class="{ 'rotate-icon': isExpanded }"></i>
          </button>
        </div>
      </div>
      <div class="collapse" id="moreFilters">
        <div class="row">
          <div class="col-12 col-md-6 col-lg-3">
            <div class="form-group">
              <label for="town">Miejscowość:</label>
              <input type="text" class="form-control form-control-sm" id="town" v-model="filters.town" placeholder="Wpisz miejscowość">
            </div>
          </div>
          <div class="col-12 col-md-6 col-lg-3">
            <div class="form-group">
              <label for="street">Ulica:</label>
              <input type="text" class="form-control form-control-sm" id="street" v-model="filters.street" placeholder="Wpisz ulicę">
            </div>
          </div>
          <div class="col-12 col-md-6 col-lg-3">
            <div class="form-group">
              <label for="name">Nazwa:</label>
              <input type="text" class="form-control form-control-sm" id="name" v-model="filters.name" placeholder="Wpisz nazwę szkoły">
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        filters: {
          type: '',
          voivodeship: '',
          county: '',
          municipality: '',
          town: '',
          street: '',
          name: ''
        },
        isExpanded: false,
      };
    },
    methods: {
      applyFilters() {
        console.log('Zastosowane filtry:', this.filters);
      },
    },
    watch: {
      isExpanded() {
        this.isExpanded = !this.isExpanded;
      },
    },
  };
  </script>
  
  <style scoped>
  .rotate-icon {
    transform: rotate(180deg);
    transition: transform 0.3s ease;
  }

  .collapse-icon{
    font-size: 2.5rem;
    color:white;
  }
  </style>
  