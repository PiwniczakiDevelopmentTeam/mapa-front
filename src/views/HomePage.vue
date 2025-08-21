<template>
  <div class="home-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-8">
          <!-- Hero Section -->
          <div class="hero-section text-center mb-5">
            <div class="hero-content">
              <h1 class="display-4 text-white mb-4 fade-in">
                <i class="bi bi-geo-alt-fill me-3 text-primary"></i>
                Witamy w Systemie Zarządzania Placówkami
              </h1>
              <p class="lead text-white-75 mb-4 fade-in-delay-1">
                Kompleksowe narzędzie do monitorowania i zarządzania placówkami edukacyjnymi 
                z integracją z systemem RSPO
              </p>
              <div class="hero-buttons fade-in-delay-2">
                <router-link to="/schools" class="btn btn-primary btn-lg me-3">
                  <i class="bi bi-building me-2"></i>
                  Przeglądaj placówki
                </router-link>
                <router-link to="/admin" class="btn btn-outline-light btn-lg">
                  <i class="bi bi-gear me-2"></i>
                  Panel administracyjny
                </router-link>
              </div>
            </div>
          </div>

          <!-- Features Grid -->
          <div class="features-section">
            <div class="row g-4">
              <div class="col-md-6 col-lg-4">
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="bi bi-map"></i>
                  </div>
                  <h5>Mapa interaktywna</h5>
                  <p class="text-muted">
                    Wizualizacja wszystkich placówek na mapie z możliwością filtrowania 
                    i szczegółowych informacji
                  </p>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="bi bi-database-check"></i>
                  </div>
                  <h5>Synchronizacja RSPO</h5>
                  <p class="text-muted">
                    Automatyczna synchronizacja danych z systemem RSPO 
                    z monitorowaniem postępu w czasie rzeczywistym
                  </p>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="bi bi-pencil-square"></i>
                  </div>
                  <h5>Zarządzanie danymi</h5>
                  <p class="text-muted">
                    Edycja, dodawanie i usuwanie placówek z intuicyjnym 
                    interfejsem porównywania zmian
                  </p>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="bi bi-funnel"></i>
                  </div>
                  <h5>Zaawansowane filtry</h5>
                  <p class="text-muted">
                    Wyszukiwanie placówek według typu, lokalizacji, 
                    statusu i wielu innych kryteriów
                  </p>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="bi bi-shield-check"></i>
                  </div>
                  <h5>Bezpieczeństwo</h5>
                  <p class="text-muted">
                    System autoryzacji z tokenami JWT zapewniający 
                    bezpieczny dostęp do danych
                  </p>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="feature-card">
                  <div class="feature-icon">
                    <i class="bi bi-graph-up"></i>
                  </div>
                  <h5>Monitoring</h5>
                  <p class="text-muted">
                    Śledzenie statusu synchronizacji i operacji 
                    systemowych w panelu administracyjnym
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="stats-section mt-5">
            <div class="row text-center">
              <div class="col-6 col-md-3">
                <div class="stat-item">
                  <div class="stat-number" v-if="stats.totalSchools">{{ stats.totalSchools.toLocaleString() }}</div>
                  <div class="stat-number" v-else>-</div>
                  <div class="stat-label">Placówek w systemie</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="stat-item">
                  <div class="stat-number" v-if="syncStatus?.isSyncInProgress">
                    <i class="bi bi-arrow-repeat spin"></i>
                  </div>
                  <div class="stat-number" v-else>
                    <i class="bi bi-check-circle text-success"></i>
                  </div>
                  <div class="stat-label">Status RSPO</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="stat-item">
                  <div class="stat-number">{{ new Date().getFullYear() }}</div>
                  <div class="stat-label">Rok aktualny</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="stat-item">
                  <div class="stat-number">24/7</div>
                  <div class="stat-label">Dostępność</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="actions-section mt-5">
            <div class="row">
              <div class="col-12">
                <h4 class="text-white text-center mb-4">Szybkie akcje</h4>
              </div>
              <div class="col-md-4 mb-3">
                <router-link to="/schools/new" class="action-card">
                  <i class="bi bi-plus-circle action-icon"></i>
                  <h6>Nowe placówki</h6>
                  <p class="small text-muted">Sprawdź placówki do dodania</p>
                </router-link>
              </div>
              <div class="col-md-4 mb-3">
                <router-link to="/schools/update" class="action-card">
                  <i class="bi bi-pencil-square action-icon"></i>
                  <h6>Do aktualizacji</h6>
                  <p class="small text-muted">Placówki wymagające zmian</p>
                </router-link>
              </div>
              <div class="col-md-4 mb-3">
                <router-link to="/admin" class="action-card">
                  <i class="bi bi-gear action-icon"></i>
                  <h6>Administracja</h6>
                  <p class="small text-muted">Panel zarządzania systemem</p>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';

export default {
  name: 'HomePage',
  setup() {
    const stats = ref({
      totalSchools: null,
    });
    
    const syncStatus = ref(null);
    const refreshInterval = ref(null);

    const fetchStats = async () => {
      try {
        // Endpoint może nie istnieć, więc na razie używamy statycznej wartości
        const response = await api.get('/api/Schools/GetSchoolsCount');
        stats.value.totalSchools = response.data;
        
        // Dla demonstracji używamy statycznej wartości
        //stats.value.totalSchools = Math.floor(Math.random() * 5000) + 1000;
      } catch (error) {
        console.error('Błąd podczas pobierania statystyk:', error);
      }
    };

    const fetchSyncStatus = async () => {
      try {
        const response = await api.get('/api/Schools/GetRSPOBackgroundSyncProgress');
        syncStatus.value = response.data;
      } catch (error) {
        console.error('Błąd podczas pobierania statusu synchronizacji:', error);
      }
    };

    const startPolling = () => {
      fetchStats();
      fetchSyncStatus();
      
      // Odświeżaj status synchronizacji co 10 sekund
      refreshInterval.value = setInterval(() => {
        fetchSyncStatus();
      }, 10000);
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
      stats,
      syncStatus,
    };
  },
};
</script>

<style scoped>
.home-page {
  background: linear-gradient(135deg, #151717 0%, #051330 50%, #072244 100%);
  min-height: calc(100vh - 60px);
  padding: 4rem 0;
}

.hero-section {
  padding: 2rem 0;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.text-white-75 {
  color: rgba(255, 255, 255, 0.75) !important;
}

.fade-in {
  animation: fadeInUp 0.8s ease-out;
}

.fade-in-delay-1 {
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.fade-in-delay-2 {
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-primary {
  background: linear-gradient(90deg, #051330, #072244);
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(90deg, #072244, #0a2b5c);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(5, 19, 48, 0.3);
}

.btn-outline-light {
  transition: all 0.3s ease;
}

.btn-outline-light:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
}

.feature-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  height: 100%;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #051330, #072244);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
}

.feature-card h5 {
  color: #051330;
  font-weight: 600;
  margin-bottom: 1rem;
}

.stats-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 15px;
  backdrop-filter: blur(10px);
}

.stat-item {
  padding: 1rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.action-card {
  display: block;
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  text-align: center;
  height: 100%;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  text-decoration: none;
  color: inherit;
}

.action-icon {
  font-size: 2rem;
  color: #051330;
  margin-bottom: 1rem;
  display: block;
}

.action-card h6 {
  color: #051330;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.spin {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 2rem 0;
  }
  
  .hero-section {
    padding: 1rem 0;
  }
  
  .display-4 {
    font-size: 2rem;
  }
  
  .lead {
    font-size: 1rem;
  }
  
  .btn-lg {
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
  
  .feature-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
}
</style>
