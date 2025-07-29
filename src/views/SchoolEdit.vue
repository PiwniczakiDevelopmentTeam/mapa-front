<template>
  <div class="container mt-4 text-white">
    <h2>Edycja placówki</h2>

    <SchoolEditForm
      v-if="schoolBefore && schoolAfter"
      :schoolBefore="schoolBefore"
      :schoolAfter="schoolAfter"
      @save="onSaveSchool"
      @cancel="onCancelEdit"
    />

    <div v-else>
      Wczytywanie danych placówki...
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';

import SchoolEditForm from '@/components/SchoolEditComponents/SchoolEditForm.vue';

export default {
  name: 'SchoolEdit',
  components: { SchoolEditForm },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const schoolBefore = ref(null);
    const schoolAfter = ref(null);

    onMounted(async () => {
      const rspoId     = route.params.rspo;
      const fromDelete = route.query.fromDelete === 'true';

      try {
        let res;

        if (fromDelete) {
          res = await api.post('/api/Schools/GetSingleSchool',
                              null,
                              { params: { rspoId } });
        } else {
          res = await api.get('/api/Schools/GetSingleSchoolWithChanges',
                              { params: { rspoId } });
        }

        if (fromDelete) {
          const single = res.data;
          schoolBefore.value = single;
          schoolAfter.value  = JSON.parse(JSON.stringify(single));
        } else {
          const before = res.data.schoolBeforeChanges;
          const after  = res.data.schoolsAfterChanges;

          if (typeof after.podmiotProwadzacy === 'string') {
            try { after.podmiotProwadzacy = JSON.parse(after.podmiotProwadzacy); }
            catch { after.podmiotProwadzacy = []; }
          }

          schoolBefore.value = before;
          schoolAfter.value  = after;
        }
      } catch (err) {
        console.error('Błąd pobierania placówki:', err);
      }
    });

    async function onSaveSchool(updatedObj) {
      try {
        const response = await api.put(
          '/api/Schools/UpdateSingleSchool',
          updatedObj
        );

        console.log('Aktualizacja powiodła się. Odpowiedź serwera:', response.data);
        router.push('/');
      } catch (error) {
        console.error('Błąd aktualizacji placówki:', error);
      }
    }

    function onCancelEdit() {
      router.push('/');
    }

    return {
      schoolBefore,
      schoolAfter,
      onSaveSchool,
      onCancelEdit,
    };
  },
};
</script>
