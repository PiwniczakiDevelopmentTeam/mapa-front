<template>
  <div class="table-container">
    <div class="table-header d-flex">
      <div class="table-cell header-cell lp-cell">Lp.</div>
      <div class="table-cell header-cell">Nazwa placówki</div>
      <div class="table-cell header-cell">Adres</div>
      <div class="table-cell header-cell">Kontakt</div>
      <div class="table-cell header-cell">Status</div>
      <div class="table-cell header-cell">Akcja</div>
    </div>
    
    <!-- Wyświetlamy szkoły w pętli -->
    <div
      v-for="(school, index) in schools"
      :key="school.id"
      :class="['table-row', index % 2 === 0 ? 'table-row-odd' : 'table-row-even']"
    >
      <!-- Lp. liczymy od 1 (dla danej strony) -->
      <div class="table-cell lp-cell">
        {{ (currentPage - 1) * itemsPerPage + (index + 1) }}.
      </div>

      <!-- Nazwa placówki -->
      <div class="table-cell">
        {{ school.nazwa }}
      </div>

      <!-- Adres -->
      <div class="table-cell">
        <span v-if="school.ulica">
          {{ school.ulica }} {{ school.numerBudynku }}
        </span>,
        <span>{{ school.kodPocztowy }} {{ school.miejscowosc }}</span>
      </div>

      <!-- Kontakt (email) -->
      <div class="table-cell">
        <a :href="'mailto:' + school.email" class="text-white">
          {{ school.email }}
        </a>
      </div>

      <!-- Status np. statusPublicznoPrawny -->
      <div class="table-cell">
        {{ school.statusPublicznoPrawny }}
      </div>

      <!-- Ikonki akcji -->
      <div class="table-cell text-center">
        <i
          class="bi bi-pencil-square me-2 icon-action"
          @click="goToEditPage(school)"
        ></i>
        <i class="bi bi-trash icon-action"></i>
      </div>
    </div>

    <!-- Paginacja -->
    <SchoolPagePagination
      :currentPage="currentPage"
      :totalItems="totalItems"
      :itemsPerPage="itemsPerPage"
      @page-changed="changePage"
    />
  </div>
</template>

<script>
import SchoolPagePagination from "./SchoolPagePagination.vue";

export default {
  name: "SchoolPageList",
  components: {
    SchoolPagePagination,
  },
  props: {
    schools: {
      type: Array,
      default: () => []
    },
    currentPage: {
      type: Number,
      default: 1
    },
    itemsPerPage: {
      type: Number,
      default: 20
    },
    totalItems: {
      type: Number,
      default: 0
    }
  },
  methods: {
    changePage(newPage) {
      // Emit do rodzica
      this.$emit('page-changed', newPage);
    },
    goToEditPage(school) {
      // Przekazujemy CAŁY OBIEKT w query, a ID w params
      this.$router.push({
        name: 'SchoolEdit',
        params: { id: school.id },
        query: {
          // Zmieniamy obiekt "school" na string JSON:
          schoolData: JSON.stringify(school)
        }
      });
    },
  },
};
</script>

<style scoped>
.table-container {
  font-size: 14px;
  margin-top: 2rem;
}

.table-header {
  display: flex;
  background-color: #544e4e;
  color: white;
  font-weight: bold;
}

.table-row {
  display: flex;
}

.table-row-odd {
  background-color: #221f1f;
}

.table-row-even {
  background-color: #322b2b;
}

.table-cell {
  flex: 1;
  padding: 10px;
  border-bottom: 1px solid #444;
}

.lp-cell {
  flex: 0 0 50px;
}

.header-cell {
  padding-top: 15px;
  padding-bottom: 15px;
}

.icon-action {
  cursor: pointer;
  font-size: 1.2rem;
  color: #ffffff;
  transition: color 0.3s;
}
.icon-action:hover {
  color: #0dcaf0;
}
</style>
