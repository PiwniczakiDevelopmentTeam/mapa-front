<template>
    <div class="pagination-container">
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        &lt;
      </button>
  
      <span
        v-for="page in visiblePages"
        :key="page"
        :class="['pagination-page', { 'active-page': page === currentPage }]"
        @click="goToPage(page)"
      >
        {{ page }}
      </span>
  
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
    computed: {
      totalPages() {
        return Math.ceil(this.totalItems / this.itemsPerPage);
      },
      visiblePages() {
        const pages = [];
        if (this.totalPages <= 5) {
          for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
          }
        } else {
          if (this.currentPage <= 3) {
            pages.push(1, 2, 3, '...', this.totalPages);
          } else if (this.currentPage > this.totalPages - 3) {
            pages.push(1, '...', this.totalPages - 2, this.totalPages - 1, this.totalPages);
          } else {
            pages.push(1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', this.totalPages);
          }
        }
        return pages;
      },
    },
    methods: {
      goToPage(page) {
        if (page !== '...' && page >= 1 && page <= this.totalPages) {
          this.$emit("page-changed", page);
        }
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
  }
  
  .pagination-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 0.5rem;
  }
  
  .pagination-btn:disabled {
    color: #555;
    cursor: not-allowed;
  }
  
  .pagination-page {
    margin: 0 0.2rem;
    cursor: pointer;
    font-size: 1.2rem;
  }
  
  .active-page {
    font-weight: bold;
    text-decoration: underline;
  }
  </style>
  