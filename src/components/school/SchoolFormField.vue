<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  label: string;
  modelValue?: string | number | null;
  rspoValue?: string | number | null;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  step?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
}>();

function normalize(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (props.type === "date" && s.length > 10) return s.slice(0, 10);
  return s;
}

const isDifferent = computed((): boolean => {
  const cur = normalize(props.modelValue);
  const rspo = normalize(props.rspoValue);
  if (cur === "" && rspo === "") return false;
  return cur !== rspo;
});

const rspoDisplay = computed((): string => {
  const val = props.rspoValue;
  if (val === null || val === undefined || val === "") return "—";
  return normalize(val) || "—";
});

const inputClass = computed(() =>
  isDifferent.value
    ? "w-full px-3 py-2 text-sm border border-amber-400 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500"
    : "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#051330]/30 focus:border-[#051330]"
);

function onInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  if (props.type === "number") {
    emit("update:modelValue", raw === "" ? null : Number(raw));
  } else {
    emit("update:modelValue", raw);
  }
}

function copyFromRspo(): void {
  const value = props.rspoValue ?? null;
  if (props.type === "date" && typeof value === "string") {
    emit("update:modelValue", value.slice(0, 10));
  } else {
    emit("update:modelValue", value);
  }
}

const hasRspoValue = computed(
  () => props.rspoValue !== null && props.rspoValue !== undefined && props.rspoValue !== ""
);
</script>

<template>
  <div>
    <label class="block text-xs font-medium text-gray-600 mb-1">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <input
      v-if="disabled"
      :type="type ?? 'text'"
      :value="modelValue ?? ''"
      disabled
      class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
    />
    <input
      v-else
      :type="type ?? 'text'"
      :value="modelValue ?? ''"
      :step="step"
      :required="required"
      :class="inputClass"
      @input="onInput"
    />
    <div v-if="!disabled" class="flex items-center gap-1.5 mt-0.5 min-h-[1.125rem]">
      <span class="text-xs text-gray-400 truncate">RSPO: {{ rspoDisplay }}</span>
      <button
        v-if="hasRspoValue"
        type="button"
        @click="copyFromRspo"
        title="Skopiuj wartość z RSPO"
        class="shrink-0 text-gray-400 hover:text-[#051330] transition-colors"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      </button>
    </div>
  </div>
</template>
