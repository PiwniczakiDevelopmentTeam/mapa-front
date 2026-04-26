<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";
</script>

<template>
  <AppLayout>
    <template #header>
      <h2 class="text-gray-800 font-semibold text-lg">Błędy integracji</h2>
    </template>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-4 py-3 font-medium text-gray-600">Nr RSPO</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Błąd</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Data importu</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="4" class="px-4 py-12 text-center text-gray-400 text-sm">
              Brak błędów integracji
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>
