<template>
  <div class="container mt-4 text-white">
    <h2>Edycja placówki</h2>
    
    <!-- Jeśli mamy obiekt school, renderujemy formularz -->
    <SchoolEditForm
      v-if="school"
      :school="school"
      @save="onSaveSchool"
      @cancel="onCancelEdit"
    />

    <div v-else>
      Wczytywanie danych placówki...
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SchoolEditForm from '@/components/SchoolEditComponents/SchoolEditForm.vue';

export default {
  name: 'SchoolEdit',
  components: { SchoolEditForm },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const school = ref(null);

    onMounted(() => {
      const schoolId = route.params.id;

      // 1) Spróbujmy odczytać obiekt z query
      const jsonData = route.query.schoolData;
      if (jsonData) {
        try {
          school.value = JSON.parse(jsonData);
        } catch (err) {
          console.error('Błąd parsowania JSON (schoolData):', err);
        }
      }

      // 2) Jeśli wciąż nie mamy `school.value`, używamy dotychczasowego "mocka"
      if (!school.value) {
        try {
          // Twój stary mock
          school.value = {
            id: schoolId,
            numerRspo: 123,
            nazwa: 'LICEUM OGÓLNOKSZTAŁCĄCE DLA DOROSŁYCH PROFIT',
            typ: 'Średnia',
            wojewodztwo: 'Lubelskie',
            powiat: 'parczewski',
            miejscowosc: 'Parczew',
            ulica: 'Spółdzielcza',
            numerBudynku: '7',
            email: 'lo.profit@op.pl',
            telefon: '555-123-456',
            dyrektorImie: 'Jan',
            dyrektorNazwisko: 'Kowalski',
          };
        } catch (err) {
          console.error('Błąd pobierania placówki:', err);
        }
      }
    });
  
    async function onSaveSchool() {
      try {
        // Wywołaj PUT, jeżeli chcesz
        // np. axios.put(`/api/Schools/${school.value.id}`, school.value);
        router.push('/');
      } catch (err) {
        console.error('Błąd zapisu placówki:', err);
      }
    }
  
    function onCancelEdit() {
      router.push('/');
    }
  
    return {
      school,
      onSaveSchool,
      onCancelEdit,
    };
  },
};
</script>
