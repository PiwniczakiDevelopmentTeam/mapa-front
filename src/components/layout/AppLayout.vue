<script setup lang="ts">
import { ref } from "vue";
import AppSidebar from "@/components/layout/AppSidebar.vue";

const sidebarOpen = ref(false);
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-20 lg:hidden"
      @click="sidebarOpen = false"
    />

    <AppSidebar :mobile-open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div class="flex items-center gap-3">
          <button
            class="lg:hidden p-2 rounded-lg bg-[#051330] text-white hover:bg-[#072244] transition-colors shrink-0"
            @click="sidebarOpen = true"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="flex-1 min-w-0">
            <slot name="header" />
          </div>
        </div>
      </header>
      <main class="flex-1 p-4 lg:p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
