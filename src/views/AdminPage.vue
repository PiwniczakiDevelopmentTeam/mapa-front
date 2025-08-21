<template>
  <div class="admin-page">
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <h1 class="text-white mb-4">Panel Administracyjny</h1>
          
          <!-- Sekcja synchronizacji RSPO -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-arrow-repeat me-2"></i>
                Synchronizacja RSPO
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-8">
                  <p class="card-text">
                    Uruchom synchronizację danych placówek z systemu RSPO. 
                    Proces może trwać kilka minut w zależności od ilości danych do przetworzenia.
                  </p>
                  
                  <!-- Status synchronizacji -->
                  <div v-if="syncStatus" class="alert" :class="syncStatusClass" role="alert">
                    <div class="d-flex align-items-center">
                      <div v-if="syncStatus.isSyncInProgress" class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <i v-else-if="hasErrors" class="bi bi-exclamation-triangle me-2"></i>
                      <i v-else class="bi bi-check-circle me-2"></i>
                      
                      <div>
                        <strong>Status:</strong>
                        <span v-if="syncStatus.isSyncInProgress">
                          Synchronizacja w trakcie ({{ syncStatus.actualPage }}/{{ syncStatus.maxPage }})
                        </span>
                        <span v-else-if="hasErrors">
                          Synchronizacja zakończona z błędami
                        </span>
                        <span v-else>
                          Synchronizacja zakończona pomyślnie
                        </span>
                      </div>
                    </div>
                    
                    <!-- Progress bar -->
                    <div v-if="syncStatus.isSyncInProgress" class="progress mt-2" style="height: 6px;">
                      <div 
                        class="progress-bar progress-bar-striped progress-bar-animated" 
                        role="progressbar" 
                        :style="{ width: progressPercentage + '%' }"
                      ></div>
                    </div>
                    
                    <!-- Błędy -->
                    <div v-if="hasErrors" class="mt-2">
                      <button 
                        class="btn btn-sm btn-outline-warning" 
                        @click="showErrorsModal = true"
                      >
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Pokaż błędy ({{ errorCount }})
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4 text-end">
                  <button 
                    class="btn btn-primary btn-lg"
                    @click="startRspoSync"
                    :disabled="isSyncDisabled"
                  >
                    <span v-if="isStartingSync" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <i v-else class="bi bi-arrow-repeat me-2"></i>
                    {{ isStartingSync ? 'Uruchamianie...' : 'Uruchom synchronizację' }}
                  </button>
                  
                  <div class="mt-2">
                    <small class="text-muted">
                      <span v-if="syncStatus?.isSyncInProgress">
                        Synchronizacja już trwa
                      </span>
                      <span v-else>
                        Kliknij aby rozpocząć synchronizację
                      </span>
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Inne funkcje administracyjne -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-tools me-2"></i>
                Narzędzia systemowe
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-8">
                  <h6><i class="bi bi-files me-2"></i>Kopiowanie danych placówek</h6>
                  <p class="text-muted mb-3">
                    Tworzy lustrzaną kopię danych placówek, nadpisując stare dane nowymi bez zmian. 
                    Użyj tej funkcji w przypadku problemów z zapisanymi danymi.
                  </p>
                  
                  <!-- Status operacji kopiowania -->
                  <div v-if="copyStatus" class="alert" :class="copyStatusClass" role="alert">
                    <div class="d-flex align-items-center">
                      <div v-if="isCopying" class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <i v-else-if="copyStatus.success" class="bi bi-check-circle me-2"></i>
                      <i v-else class="bi bi-exclamation-triangle me-2"></i>
                      
                      <div>
                        <strong>{{ copyStatus.message }}</strong>
                        <div v-if="copyStatus.details" class="small mt-1">
                          {{ copyStatus.details }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4 text-end">
                  <button 
                    class="btn btn-warning btn-lg"
                    @click="confirmCopySchools"
                    :disabled="isCopyDisabled"
                  >
                    <span v-if="isCopying" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <i v-else class="bi bi-files me-2"></i>
                    {{ isCopying ? 'Kopiowanie...' : 'Kopiuj dane placówek' }}
                  </button>
                  
                  <div class="mt-2">
                    <small class="text-muted">
                      <i class="bi bi-exclamation-triangle text-warning me-1"></i>
                      Operacja nadpisze istniejące dane
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal z błędami synchronizacji -->
    <div 
      class="modal fade" 
      :class="{ show: showErrorsModal }"
      :style="{ display: showErrorsModal ? 'block' : 'none' }"
      tabindex="-1" 
      role="dialog"
    >
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Błędy synchronizacji RSPO</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showErrorsModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="syncStatus?.invalidRspoNumbers?.$values?.length > 0" class="mb-4">
              <h6><i class="bi bi-exclamation-triangle text-warning me-2"></i>Nieprawidłowe numery RSPO:</h6>
              <div class="d-flex flex-wrap gap-1">
                <span 
                  v-for="(rspo, index) in syncStatus.invalidRspoNumbers.$values" 
                  :key="index"
                  class="badge bg-warning text-dark"
                >
                  {{ rspo }}
                </span>
              </div>
            </div>
            
            <div v-if="syncStatus?.exceptions?.$values?.length > 0">
              <h6><i class="bi bi-bug text-danger me-2"></i>Wyjątki systemowe:</h6>
              <div class="list-group">
                <div 
                  v-for="(exception, index) in syncStatus.exceptions.$values" 
                  :key="index"
                  class="list-group-item list-group-item-danger"
                >
                  <i class="bi bi-x-circle me-2"></i>
                  {{ exception }}
                </div>
              </div>
            </div>
            
            <div v-if="!hasErrors" class="text-center text-muted">
              <i class="bi bi-check-circle-fill text-success" style="font-size: 2rem;"></i>
              <p class="mt-2">Brak błędów do wyświetlenia</p>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showErrorsModal = false"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal potwierdzenia kopiowania -->
    <div 
      class="modal fade" 
      :class="{ show: showCopyConfirmModal }"
      :style="{ display: showCopyConfirmModal ? 'block' : 'none' }"
      tabindex="-1" 
      role="dialog"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle text-warning me-2"></i>
              Potwierdzenie operacji
            </h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showCopyConfirmModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <h6><i class="bi bi-exclamation-triangle me-2"></i>Uwaga!</h6>
              <p class="mb-2">
                Ta operacja utworzy lustrzaną kopię danych placówek i <strong>nadpisze wszystkie istniejące dane</strong>.
              </p>
              <ul class="mb-2">
                <li>Wszystkie obecne dane placówek zostaną zastąpione</li>
                <li>Operacja jest nieodwracalna</li>
                <li>Może to zająć kilka minut</li>
              </ul>
              <p class="mb-0 text-danger">
                <strong>Czy na pewno chcesz kontynuować?</strong>
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showCopyConfirmModal = false"
            >
              <i class="bi bi-x-lg me-1"></i>
              Anuluj
            </button>
            <button 
              type="button" 
              class="btn btn-warning"
              @click="executeCopySchools"
              :disabled="isCopying"
            >
              <span v-if="isCopying" class="spinner-border spinner-border-sm me-2" role="status"></span>
              <i v-else class="bi bi-files me-1"></i>
              {{ isCopying ? 'Kopiowanie...' : 'Tak, kopiuj dane' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Backdrop dla modal -->
    <div 
      v-if="showErrorsModal || showCopyConfirmModal" 
      class="modal-backdrop fade show"
      @click="closeAllModals"
    ></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';

export default {
  name: 'AdminPage',
  setup() {
    const syncStatus = ref(null);
    const isStartingSync = ref(false);
    const showErrorsModal = ref(false);
    const showCopyConfirmModal = ref(false);
    const copyStatus = ref(null);
    const isCopying = ref(false);
    const refreshInterval = ref(null);

    const progressPercentage = computed(() => {
      if (!syncStatus.value || syncStatus.value.maxPage === 0) return 0;
      return Math.round((syncStatus.value.actualPage / syncStatus.value.maxPage) * 100);
    });

    const hasErrors = computed(() => {
      if (!syncStatus.value) return false;
      const invalidRspo = syncStatus.value.invalidRspoNumbers?.$values?.length > 0;
      const exceptions = syncStatus.value.exceptions?.$values?.length > 0;
      return invalidRspo || exceptions;
    });

    const errorCount = computed(() => {
      if (!syncStatus.value) return 0;
      const invalidCount = syncStatus.value.invalidRspoNumbers?.$values?.length || 0;
      const exceptionCount = syncStatus.value.exceptions?.$values?.length || 0;
      return invalidCount + exceptionCount;
    });

    const isSyncDisabled = computed(() => {
      return isStartingSync.value || syncStatus.value?.isSyncInProgress;
    });

    const isCopyDisabled = computed(() => {
      return isCopying.value || syncStatus.value?.isSyncInProgress;
    });

    const syncStatusClass = computed(() => {
      if (!syncStatus.value) return 'alert-secondary';
      if (syncStatus.value.isSyncInProgress) return 'alert-info';
      if (hasErrors.value) return 'alert-warning';
      return 'alert-success';
    });

    const copyStatusClass = computed(() => {
      if (!copyStatus.value) return 'alert-secondary';
      if (isCopying.value) return 'alert-info';
      if (copyStatus.value.success) return 'alert-success';
      return 'alert-danger';
    });

    const fetchSyncStatus = async () => {
      try {
        const response = await api.get('/api/Schools/GetRSPOBackgroundSyncProgress');
        syncStatus.value = response.data;
      } catch (error) {
        console.error('Błąd podczas pobierania statusu synchronizacji:', error);
      }
    };

    const startRspoSync = async () => {
      if (isSyncDisabled.value) return;
      
      isStartingSync.value = true;
      
      try {
        const response = await api.post('/api/Schools/GetDataFromRSPO');
        
        if (response.data?.message) {
          // Pokaż komunikat o rozpoczęciu synchronizacji
          console.log('Synchronizacja rozpoczęta:', response.data.message);
          
          // Odświeź status po krótkim czasie
          setTimeout(() => {
            fetchSyncStatus();
          }, 2000);
        }
      } catch (error) {
        console.error('Błąd podczas uruchamiania synchronizacji RSPO:', error);
        alert('Wystąpił błąd podczas uruchamiania synchronizacji. Sprawdź konsolę dla szczegółów.');
      } finally {
        isStartingSync.value = false;
      }
    };

    const confirmCopySchools = () => {
      if (isCopyDisabled.value) return;
      showCopyConfirmModal.value = true;
    };

    const executeCopySchools = async () => {
      if (isCopyDisabled.value) return;
      
      isCopying.value = true;
      showCopyConfirmModal.value = false;
      copyStatus.value = null;
      
      try {
        const response = await api.post('/api/Schools/CopySchools');
        
        copyStatus.value = {
          success: true,
          message: 'Kopiowanie danych zakończone pomyślnie',
          details: response.data?.message || 'Dane placówek zostały skopiowane'
        };
        
        console.log('Kopiowanie zakończone:', response.data);
        
      } catch (error) {
        console.error('Błąd podczas kopiowania danych:', error);
        
        copyStatus.value = {
          success: false,
          message: 'Błąd podczas kopiowania danych',
          details: error.response?.data?.message || error.message || 'Nieznany błąd'
        };
      } finally {
        isCopying.value = false;
      }
    };

    const closeAllModals = () => {
      showErrorsModal.value = false;
      showCopyConfirmModal.value = false;
    };

    const startPolling = () => {
      fetchSyncStatus();
      refreshInterval.value = setInterval(fetchSyncStatus, 3000);
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
      syncStatus,
      isStartingSync,
      showErrorsModal,
      showCopyConfirmModal,
      copyStatus,
      isCopying,
      progressPercentage,
      hasErrors,
      errorCount,
      isSyncDisabled,
      isCopyDisabled,
      syncStatusClass,
      copyStatusClass,
      startRspoSync,
      confirmCopySchools,
      executeCopySchools,
      closeAllModals,
    };
  },
};
</script>

<style scoped>
.admin-page {
  background: linear-gradient(135deg, #151717 0%, #051330 100%);
  min-height: calc(100vh - 60px);
  padding-bottom: 2rem;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: linear-gradient(90deg, #051330, #072244);
  color: white;
  border-bottom: none;
}

.btn-primary {
  background: linear-gradient(90deg, #051330, #072244);
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(90deg, #072244, #0a2b5c);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-primary:disabled {
  background: #6c757d;
  opacity: 0.6;
}

.btn-warning {
  background: linear-gradient(90deg, #ffc107, #ffb300);
  border: none;
  color: #212529;
  transition: all 0.3s ease;
}

.btn-warning:hover:not(:disabled) {
  background: linear-gradient(90deg, #ffb300, #ff8f00);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-warning:disabled {
  background: #6c757d;
  opacity: 0.6;
}

.progress {
  height: 6px;
  background-color: rgba(0, 0, 0, 0.1);
}

.progress-bar {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.badge {
  font-size: 0.8rem;
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.list-group-item {
  border-left: 4px solid #dc3545;
}

@media (max-width: 768px) {
  .admin-page {
    padding: 1rem 0;
  }
  
  .btn-lg {
    font-size: 1rem;
    padding: 0.5rem 1rem;
  }
}
</style>
