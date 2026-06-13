<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  change: [page: number];
}>();

const inputValue = ref<string>(String(props.currentPage));

watch(
  () => props.currentPage,
  (v) => {
    inputValue.value = String(v);
  },
);

function goToPage(page: number): void {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return;
  emit("change", page);
}

function handleJump(): void {
  const raw = Number(inputValue.value);
  if (!Number.isFinite(raw)) {
    inputValue.value = String(props.currentPage);
    return;
  }
  const clamped = Math.max(1, Math.min(props.totalPages, Math.floor(raw)));
  if (clamped !== props.currentPage) {
    emit("change", clamped);
  } else {
    inputValue.value = String(props.currentPage);
  }
}
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-3 flex-wrap">
      <span class="text-xs text-gray-500 whitespace-nowrap">Strona {{ currentPage }} z {{ totalPages }}</span>
      <div class="flex items-center gap-1.5 text-xs text-gray-500">
        <span class="hidden sm:inline whitespace-nowrap">Idź do:</span>
        <input
          v-model="inputValue"
          @keydown.enter="handleJump"
          @blur="handleJump"
          type="number"
          :min="1"
          :max="totalPages"
          inputmode="numeric"
          class="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]"
        />
      </div>
    </div>
    <div class="flex items-center gap-1">
      <button
        type="button"
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Poprzednia
      </button>
      <button
        type="button"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Następna
      </button>
    </div>
  </div>
</template>
