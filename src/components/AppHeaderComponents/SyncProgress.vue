<template>
  <div class="sync-progress" v-if="syncData">
    <!-- Gdy synchronizacja jest w trakcie -->
    <div v-if="syncData.isSyncInProgress" class="sync-active d-flex align-items-center">
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="sync-text">
        Synchronizacja RSPO: {{ syncData.actualPage }}/{{ syncData.maxPage }}
      </span>
      <div class="progress ms-2" style="width: 120px;">
        <div 
          class="progress-bar progress-bar-striped progress-bar-animated" 
          role="progressbar" 
          :style="{ width: progressPercentage + '%' }"
          :aria-valuenow="progressPercentage"
          aria-valuemin="0" 
          aria-valuemax="100"
        >
        </div>
      </div>
    </div>

    <!-- Gdy synchronizacja nie jest w trakcie -->
    <div v-else class="sync-idle d-flex align-items-center">
      <i class="bi bi-check-circle text-success me-2"></i>
      <span class="sync-text">RSPO zsynchronizowane</span>
      
      <!-- Wyświetl błędy jeśli są -->
      <div v-if="hasErrors" class="ms-2">
        <i 
          class="bi bi-exclamation-triangle text-warning"
          :title="`Błędy: ${errorCount}`"
          data-bs-toggle="tooltip"
        ></i>
      </div>
    </div>

    <!-- Modal z błędami -->
    <div 
      class="modal fade" 
      id="syncErrorsModal" 
      tabindex="-1" 
      aria-labelledby="syncErrorsModalLabel" 
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="syncErrorsModalLabel">Błędy synchronizacji RSPO</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="syncData.invalidRspoNumbers?.$values?.length > 0">
              <h6>Nieprawidłowe numery RSPO:</h6>
              <div class="mb-3">
                <span 
                  v-for="(rspo, index) in syncData.invalidRspoNumbers.$values" 
                  :key="index"
                  class="badge bg-warning text-dark me-1 mb-1"
                >
                  {{ rspo }}
                </span>
              </div>
            </div>
            
            <div v-if="syncData.exceptions?.$values?.length > 0">
              <h6>Wyjątki:</h6>
              <div class="list-group">
                <div 
                  v-for="(exception, index) in syncData.exceptions.$values" 
                  :key="index"
                  class="list-group-item list-group-item-danger"
                >
                  {{ exception }}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zamknij</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';

export default {
  name: 'SyncProgress',
  setup() {
    const syncData = ref(null);
    const refreshInterval = ref(null);

    const progressPercentage = computed(() => {
      if (!syncData.value || syncData.value.maxPage === 0) return 0;
      return Math.round((syncData.value.actualPage / syncData.value.maxPage) * 100);
    });

    const hasErrors = computed(() => {
      if (!syncData.value) return false;
      const invalidRspo = syncData.value.invalidRspoNumbers?.$values?.length > 0;
      const exceptions = syncData.value.exceptions?.$values?.length > 0;
      return invalidRspo || exceptions;
    });

    const errorCount = computed(() => {
      if (!syncData.value) return 0;
      const invalidCount = syncData.value.invalidRspoNumbers?.$values?.length || 0;
      const exceptionCount = syncData.value.exceptions?.$values?.length || 0;
      return invalidCount + exceptionCount;
    });

    const fetchSyncProgress = async () => {
      try {
        const response = await api.get('/api/Schools/GetRSPOBackgroundSyncProgress');
        syncData.value = response.data;
      } catch (error) {
        console.error('Błąd podczas pobierania statusu synchronizacji RSPO:', error);
        // W przypadku błędu nie wyświetlamy komponentu
        syncData.value = null;
      }
    };

    const startPolling = () => {
      // Pobierz dane od razu
      fetchSyncProgress();
      
      // Następnie co 5 sekund
      refreshInterval.value = setInterval(() => {
        fetchSyncProgress();
      }, 5000);
    };

    const stopPolling = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
        refreshInterval.value = null;
      }
    };

    onMounted(() => {
      startPolling();
    });

    onUnmounted(() => {
      stopPolling();
    });

    return {
      syncData,
      progressPercentage,
      hasErrors,
      errorCount,
    };
  },
};
</script>

<style scoped>
.sync-progress {
  font-size: 0.875rem;
  color: white;
}

.sync-text {
  white-space: nowrap;
  font-size: 0.8rem;
}

.sync-active .spinner-border {
  width: 1rem;
  height: 1rem;
}

.sync-idle {
  color: #28a745;
}

.progress {
  height: 0.5rem;
  background-color: rgba(255, 255, 255, 0.2);
}

.progress-bar {
  background-color: #28a745;
}

.bi-exclamation-triangle {
  cursor: pointer;
  font-size: 1rem;
}

.badge {
  font-size: 0.75rem;
}

.list-group-item {
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .sync-progress {
    font-size: 0.75rem;
  }
  
  .progress {
    width: 80px !important;
  }
  
  .sync-text {
    font-size: 0.7rem;
  }
}
</style>
