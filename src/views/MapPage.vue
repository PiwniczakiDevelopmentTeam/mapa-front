<template>
    <div>
      <div id="map" ref="mapContainer" style="height: calc(75vh);"></div>
      <p class="status">
        Załadowano {{ loadedSchools }} / {{ totalSchools }} szkół
      </p>
    </div>
  </template>
  
  <script>
  import 'leaflet/dist/leaflet.css';
  import L from 'leaflet';
  import 'leaflet.markercluster'; // 🔥 Dodanie grupowania markerów
  import 'leaflet.markercluster/dist/MarkerCluster.css';
  import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
  import api from '@/services/api';
  
  export default {
    name: 'MapPage',
    data() {
      return {
        map: null,
        markerCluster: null, // 🔥 Warstwa dla klastrów markerów
        totalSchools: 0,
        loadedSchools: 0,
      };
    },
    async mounted() {
      this.initializeMap();
      await this.fetchTotalSchools();
      await this.fetchAllSchools();
    },
    methods: {
      initializeMap() {
        if (this.map) {
          this.map.remove();
        }
  
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
          iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
          shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
        });
  
        this.map = L.map(this.$refs.mapContainer, {
          center: [52.069167, 19.480556],
          zoom: 6,
          zoomAnimation: true,
        });
  
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);
  
        // 🔥 Dodajemy klastry zamiast zwykłej warstwy
        this.markerCluster = L.markerClusterGroup();
        this.map.addLayer(this.markerCluster);
      },
  
      async fetchTotalSchools() {
        try {
          const response = await api.get('/api/Schools/GetSchoolsCount');
          this.totalSchools = response.data;
        } catch (error) {
          console.error('Błąd podczas pobierania liczby szkół:', error);
        }
      },
  
      async fetchAllSchools() {
        let pageNumber = 1;
        const size = 1000; // 🔥 Pobieramy 1000 szkół na raz, zamiast 100
        let allSchools = [];
  
        try {
          while (allSchools.length < this.totalSchools) {
            console.log(`Pobieranie strony ${pageNumber}...`);
            
            const response = await api.get('/api/Schools/GetSchoolPage', {
              params: { size, pageNumber },
            });
  
            const schools = response.data || [];
            if (schools.length === 0) break; // Koniec danych
  
            allSchools = [...allSchools, ...schools];
            this.loadedSchools = allSchools.length;
  
            // 🔥 Dodajemy szkoły stopniowo, zamiast wszystkich naraz
            this.addSchoolsToMap(schools);
  
            pageNumber++;
  
            // 🔥 Czekamy 0.5 sekundy, aby nie zamrozić przeglądarki
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error('Błąd podczas pobierania szkół:', error);
        }
      },
  
      addSchoolsToMap(schools) {
        if (!this.map) {
          console.error('Mapa nie jest jeszcze gotowa!');
          return;
        }
  
        const markers = [];
  
        schools.forEach((school) => {
          if (school.geography && school.geography.x && school.geography.y) {
            const marker = L.marker([school.geography.y, school.geography.x], {
              icon: new L.Icon({
                iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
                shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
              }),
            })
              .bindPopup(`
                <strong>${school.nazwa}</strong><br>
                ${school.ulica || 'Brak ulicy'} ${school.numerBudynku || ''}<br>
                ${school.kodPocztowy || ''} ${school.miejscowosc}<br>
                <a href="mailto:${school.email}" target="_blank">${school.email || 'Brak e-maila'}</a><br>
                <a href="${school.stronaInternetowa}" target="_blank">${school.stronaInternetowa || 'Brak strony'}</a>
              `);
  
            markers.push(marker);
          }
        });
  
        // 🔥 Dodajemy całą grupę markerów do klastra (wydajniejsze!)
        this.markerCluster.addLayers(markers);
      },
    },
    beforeUnmount() {
      if (this.map) {
        this.map.remove();
      }
    },
  };
  </script>
  
  <style scoped>
  #map {
    height: 100%;
  }
  .status {
    text-align: center;
    margin-top: 10px;
    font-weight: bold;
  }
  </style>
  