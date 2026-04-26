<script setup lang="ts">
import AppSidebar from "@/components/layout/AppSidebar.vue";
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <AppSidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white border-b border-gray-200 px-6 py-4">
        <slot name="header" />
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
