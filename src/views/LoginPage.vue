<script setup lang="ts">
import LoginForm from "@/components/LoginForm.vue";
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-[#151717] to-[#051330] flex items-center justify-center p-4"
  >
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h2 class="text-white text-2xl font-light mb-2">
          System Zarządzania Placówkami
        </h2>
        <p class="text-white/70">Zaloguj się aby uzyskać dostęp do systemu</p>
      </div>
      <LoginForm />
    </div>
  </div>
</template>
