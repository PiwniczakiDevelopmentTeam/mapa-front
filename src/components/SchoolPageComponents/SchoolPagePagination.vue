<template>
  <div class="pagination-container">
    <!-- Przycisk Wstecz -->
    <button
      class="pagination-btn"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      &lt;
    </button>

    <!-- Generowanie widocznych numerów stron (z elipsami) -->
    <span
      v-for="(page, idx) in visiblePages"
      :key="idx"
      :class="['pagination-page', { 'active-page': page === currentPage }, { 'dots': page === '...' }]"
      @click="goToPage(page)"
    >
      {{ page }}
    </span>

    <!-- Przycisk Dalej -->
    <button
      class="pagination-btn"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      &gt;
    </button>
  </div>
</template>

<script>
export default {
  name: "SchoolPagePagination",
  props: {
    currentPage: {
      type: Number,
      default: 1,
    },
    totalItems: {
      type: Number,
      required: true,
    },
    itemsPerPage: {
      type: Number,
      default: 20,
    },
  },
  emits: ["page-changed"],

  computed: {
    totalPages() {
      return Math.ceil(this.totalItems / this.itemsPerPage);
    },

    visiblePages() {
      const total = this.totalPages;
      const current = this.currentPage;
      const pages = [];

      // Jeśli mamy 7 lub mniej stron, pokaż wszystkie:
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Jeśli jest więcej stron, to wyświetlamy:
        // 1) Zawsze stronę nr 1
        // 2) Blok stron wokół currentPage
        // 3) Zawsze ostatnią stronę (total)
        // Pomiędzy stosujemy "..." (elipsy)

        // Zawsze 1
        pages.push(1);

        // Determinujemy, czy wstawić "..." za jedynką
        // (tzn. jeśli currentPage jest powyżej 4)
        if (current > 4) {
          pages.push("...");
        }

        // Blok stron wokół currentPage
        // start: current - 1
        // end: current + 1
        // z uwzględnieniem granic
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        // Determinujemy, czy wstawić "..." przed ostatnią stroną
        if (current < total - 3) {
          pages.push("...");
        }

        // Zawsze total (ostatnia strona)
        pages.push(total);
      }

      return pages;
    },
  },

  methods: {
    goToPage(page) {
      // Jeśli klikniemy w "...", nic nie róbmy
      if (page === "...") {
        return;
      }
      // Upewnij się, że nie wyjdziemy poza 1..total
      if (page < 1) page = 1;
      if (page > this.totalPages) page = this.totalPages;

      // Emitujemy do rodzica nowy numer strony
      this.$emit("page-changed", page);
    },
  },
};
</script>

<style scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
  color: white;
  gap: 0.2rem;
}

.pagination-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  margin: 0 0.1rem;
}

.pagination-btn:disabled {
  color: #555;
  cursor: not-allowed;
}

.pagination-page {
  margin: 0 0.2rem;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.3rem 0.6rem;
}

.active-page {
  font-weight: bold;
  text-decoration: underline;
}

.dots {
  cursor: default;
  color: #999;
}
</style>
