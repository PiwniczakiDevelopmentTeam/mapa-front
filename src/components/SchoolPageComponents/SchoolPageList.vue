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
    
    <div
      v-for="(school, index) in schools"
      :key="school.id"
      :class="['table-row', index % 2 === 0 ? 'table-row-odd' : 'table-row-even']"
    >
      <!-- Numer porządkowy -->
      <div class="table-cell lp-cell">
        {{ (currentPage - 1) * itemsPerPage + (index + 1) }}.
      </div>

      <!-- Nazwa -->
      <div class="table-cell">
        {{ school.nazwa }}
      </div>

      <!-- Adres -->
      <div class="table-cell">
        <span v-if="school.ulica">{{ school.ulica }} {{ school.numerBudynku }}</span>,
        <span>{{ school.kodPocztowy }} {{ school.miejscowosc }}</span>
      </div>

      <!-- Kontakt -->
      <div class="table-cell">
        <a :href="'mailto:' + school.email" class="text-white">
          {{ school.email }}
        </a>
      </div>

      <!-- Status -->
      <div class="table-cell">
        {{ school.statusPublicznoPrawny }}
      </div>

      <!-- Akcja -->
      <div class="table-cell text-center">
        <!-- Jeżeli placówka nie jest w lokalnej bazie => ikona plus => emitujemy event dodawania -->
        <template v-if="!school.isInLocalDb">
          <i
            class="bi bi-plus-circle me-2 icon-action"
            @click="emitAddSchool(school)"
          ></i>
        </template>

        <!-- Jeżeli jest w bazie => ikona edycji -->
        <template v-else>
          <i
            class="bi bi-pencil-square me-2 icon-action"
            @click="goToEditPage(school.id)"
          ></i>
        </template>

        <!-- Ikona kosza -->
        <i
          class="bi bi-trash icon-action"
          @click="confirmDelete(school.id)"
        ></i>
      </div>
    </div>

    <!-- PAGINACJA -->
    <SchoolPagePagination
      :currentPage="currentPage"
      :totalItems="totalItems"
      :itemsPerPage="itemsPerPage"
      @page-changed="changePage"
    />
    
    <!-- Modal potwierdzenia usunięcia -->
    <div
      class="modal fade show"
      tabindex="-1"
      v-if="showDeleteModal"
      style="display: block; background-color: rgba(0,0,0,0.6);"
      role="dialog"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content text-black">
          <div class="modal-header">
            <h5 class="modal-title">Potwierdzenie</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeDeleteModal"
            ></button>
          </div>
          <div class="modal-body">
            <p>Czy na pewno chcesz usunąć tę placówkę?</p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeDeleteModal"
            >
              Anuluj
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteSchool"
            >
              Usuń
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import SchoolPagePagination from "./SchoolPagePagination.vue";

export default {
  name: "SchoolPageList",
  components: { SchoolPagePagination },
  props: {
    schools: Array,
    currentPage: Number,
    itemsPerPage: Number,
    totalItems: Number,
  },
  data() {
    return {
      showDeleteModal: false,
      selectedSchoolId: null,
    };
  },
  methods: {
    changePage(newPage) {
      this.$emit("page-changed", newPage);
    },

    /**
     * Emitowanie eventu dodawania placówki
     */
    emitAddSchool(school) {
      console.log("Test emitAddSchool:", school); // Poprawione logowanie
      this.goToAddPage((this.currentPage - 1) * this.itemsPerPage + (this.schools.indexOf(school) + 1));
    },

    /**
     * Przejście do widoku edycji
     */
    goToEditPage(schoolId) {
      this.$router.push({
        name: "SchoolEdit",
        params: { id: schoolId }
      });
    },

    goToAddPage(id){
      this.$router.push({
        name: "SchoolAdd",
        params: { id } // Przekazuje dynamicznie obliczone ID (bazując na numerze strony i pozycji)
      });
    },

    /**
     * Obsługa usuwania placówki
     */
    confirmDelete(schoolId) {
      this.selectedSchoolId = schoolId;
      this.showDeleteModal = true;
    },
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.selectedSchoolId = null;
    },
    async deleteSchool() {
      if (!this.selectedSchoolId) return;

      try {
        const response = await axios.delete("/api/Schools/DeleteSchool", {
          params: { id: this.selectedSchoolId }
        });
        console.log("Usunięto placówkę:", response.data);

        const idx = this.schools.findIndex(item => item.id === this.selectedSchoolId);
        if (idx !== -1) {
          // eslint-disable-next-line
          this.schools.splice(idx, 1);
        }
      } catch (error) {
        console.error("Błąd podczas usuwania placówki:", error);
      } finally {
        this.closeDeleteModal();
      }
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
