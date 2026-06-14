<template>
  <div class="h-screen flex flex-col overflow-hidden bg-gray-50">
    <!-- Top header with Admin button -->
    <header class="bg-[#051330] text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 class="font-bold text-base md:text-lg tracking-tight">Mapa Szkół Niepublicznych</h1>
      </div>
      <div>
        <router-link
          to="/dashboard"
          class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors border border-white/20"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Panel Administratora
        </router-link>
      </div>
    </header>

    <!-- Map iframe -->
    <iframe
      src="/map/index.html"
      class="w-full flex-1 border-none"
      title="Mapa"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
// Main public map page
</script>
