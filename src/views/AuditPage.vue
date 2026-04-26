<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";
</script>

<template>
  <AppLayout>
    <template #header>
      <h2 class="text-gray-800 font-semibold text-lg">Audyt — Historia zmian</h2>
    </template>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <input
          type="text"
          placeholder="Filtruj po placówce lub użytkowniku..."
          class="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]"
        />
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-4 py-3 font-medium text-gray-600">Data</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Użytkownik</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Placówka</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Pole</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Stara wartość</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Nowa wartość</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="6" class="px-4 py-12 text-center text-gray-400 text-sm">
              Brak wpisów w historii zmian
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>
