<template>
    <div class="mb-3">
      <!-- Etykieta -->
      <label v-if="label" :for="id" class="form-label">{{ label }}</label>
  
      <!-- Pole input -->
      <input
        :type="type"
        class="form-control form-control-sm"
        :id="id"
        :placeholder="placeholder"
        v-model="innerValue"
      />
    </div>
  </template>
  
  <script>
  export default {
    name: "InputField",
    props: {
      // v-model
      modelValue: {
        type: [String, Number],
        default: ""
      },
      // np. "text", "number", "email" itp.
      type: {
        type: String,
        default: "text"
      },
      // Etykieta obok pola
      label: {
        type: String,
        default: ""
      },
      // Id pola
      id: {
        type: String,
        default: ""
      },
      // Placeholder
      placeholder: {
        type: String,
        default: ""
      }
    },
    emits: ["update:modelValue"],
    computed: {
      // Zamiast bezpośredniego v-model na modelValue,
      // używamy computed, by emitować update w setterze
      innerValue: {
        get() {
          return this.modelValue;
        },
        set(newVal) {
          this.$emit("update:modelValue", newVal);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .form-label {
    font-weight: 500;
  }
  </style>
  