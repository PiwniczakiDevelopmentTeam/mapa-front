<template>
    <div class="container mt-4 text-white">
      <h2>Dodawanie nowej placówki</h2>
  
      <SchoolEditForm
        v-if="schoolBefore && schoolAfter"
        :schoolBefore="schoolBefore"
        :schoolAfter="schoolAfter"
        @save="onSaveSchool"
        @cancel="onCancelAdd"
      />
  
      <div v-else>
        Wczytywanie danych placówki...
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import axios from "axios";
  
  import SchoolEditForm from "@/components/SchoolEditComponents/SchoolEditForm.vue";
  
  export default {
    name: "SchoolAdd",
    components: { SchoolEditForm },
    setup() {
      const route = useRoute();
      const router = useRouter();
      const schoolBefore = ref(null);
      const schoolAfter = ref(null);
  
      onMounted(async () => {
        const id = Number(route.params.id); // ID pozycji na liście przekazane jako route param
  
        // Oblicz parametry `page` i `size` dla API
        const itemsPerPage = 1; // Dla pojedynczej pozycji
        const page = id; // ID pozycji równa się numerowi strony
  
        try {
          // Pobranie danych nowej placówki z API
          const response = await axios.get(
            "/api/Schools/GetMissingSchoolsInSchoolsTable",
            {
              params: { page, size: itemsPerPage },
            }
          );
  
          if (response.data && response.data.length > 0) {
            const schoolData = response.data[0]; // Dane pierwszej (i jedynej) pozycji
            schoolBefore.value = schoolData;
            schoolAfter.value = schoolData; // To samo w obu kolumnach
          }
        } catch (err) {
          console.error("Błąd pobierania danych placówki:", err);
        }
      });
  
      async function onSaveSchool(newSchool) {
        try {
          const response = await axios.post(
            "/api/Schools/AddSingleSchool",
            newSchool
          );
  
          console.log("Dodano nową placówkę. Odpowiedź serwera:", response.data);
          router.push("/");
        } catch (error) {
          console.error("Błąd podczas dodawania placówki:", error);
        }
      }
  
      function onCancelAdd() {
        router.push("/");
      }
  
      return {
        schoolBefore,
        schoolAfter,
        onSaveSchool,
        onCancelAdd,
      };
    },
  };
  </script>
  