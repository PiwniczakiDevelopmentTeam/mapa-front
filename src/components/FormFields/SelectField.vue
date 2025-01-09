<template>
    <div class="mb-3">
      <label v-if="label" :for="id" class="form-label">{{ label }}</label>
      <select
        class="form-select form-select-sm"
        :id="id"
        v-model="innerValue"
      >
        <option
          v-for="(opt, index) in options"
          :key="index"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>
  </template>
  
  <script>
  export default {
    name: "SelectField",
    props: {
      modelValue: {
        type: String,
        default: ""
      },
      label: {
        type: String,
        default: ""
      },
      id: {
        type: String,
        default: ""
      },
      // Tablica obiektów { value, label }
      options: {
        type: Array,
        default: () => []
      }
    },
    emits: ["update:modelValue"],
    computed: {
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
  