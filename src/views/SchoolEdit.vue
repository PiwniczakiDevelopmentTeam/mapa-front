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
import axios from 'axios';

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
      const schoolId = route.params.id;

      try {
        const response = await axios.get('/api/Schools/GetSingleSchoolWithChanges', {
          params: { id: schoolId }
        });

        const before = response.data.schoolBeforeChanges;
        const after = response.data.schoolsAfterChanges;

        if (typeof after.podmiotProwadzacy === 'string') {
        try {
          after.podmiotProwadzacy = JSON.parse(after.podmiotProwadzacy);
        } catch (err) {
          console.warn('Nie udało się zdekodować schoolAfter.podmiotProwadzacy:', err);
          after.podmiotProwadzacy = [];
        }
      }

      schoolBefore.value = before;
      schoolAfter.value  = after;

      } catch (err) {
        console.error('Błąd pobierania placówki (GetSingleSchoolWithChanges):', err);
      }
    });

    async function onSaveSchool(updatedObj) {
      console.log(updatedObj);
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
