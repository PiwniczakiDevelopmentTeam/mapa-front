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
  import api from "@/services/api";
  
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
        const rspo = Number(route.params.rspo);
  
        try {
          const response = await api.post(
            "/api/Schools/GetSingleSchoolFromRSPO", null,
            {
              params: { rspoId: rspo },
            }
          );
  
          console.log(response.data);

          schoolBefore.value = response.data;
          schoolAfter.value = response.data;
        } catch (err) {
          console.error("Błąd pobierania danych placówki:", err);
        }
      });
  
      async function onSaveSchool(newSchool) {
        try {
          const payload = JSON.parse(JSON.stringify(newSchool));

          delete payload.id;
          delete payload.$id;
          if (payload.geography) delete payload.geography.$id;


          if (Array.isArray(payload.podmiotProwadzacy) && payload.podmiotProwadzacy.length) {
            payload.podmiotProwadzacyTyp   = payload.podmiotProwadzacy[0]?.typ?.nazwa || '';
            payload.podmiotProwadzacyNazwa = payload.podmiotProwadzacy[0]?.nazwa     || '';
          }
          delete payload.podmiotProwadzacy;

          console.log('PAYLOAD CZYSTY:', JSON.stringify(payload, null, 2));


          const res = await api.post('/api/Schools/AddSingleSchool', payload);
          console.log('Dodano placówkę:', res.data);
          router.push('/');
        } catch (err) {
          if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Body:',   err.response.data);
          } else {
            console.error('Błąd sieci / timeout:', err.message);
          }
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
  