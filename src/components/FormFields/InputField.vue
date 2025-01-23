<template>
  <div class="mb-3" :style="computedStyle">
    <label v-if="label" :for="id" class="form-label">{{ label }}</label>

    <input
      :type="type"
      class="form-control form-control-sm"
      :id="id"
      :placeholder="placeholder"
      v-model="innerValue"
    />

    <div class="small text-info mt-1" v-if="enableComparison">
      RSPO: {{ rspoValue }}
      <input
        type="checkbox"
        :disabled="isSame"
        :checked="isChecked"
        @change="onCheckboxChange"
      />
      <label class="ms-1">Zastąp</label>
    </div>
  </div>
</template>

<script>
export default {
  name: "InputField",
  props: {
    modelValue: {
      type: [String, Number],
      default: ""
    },
    type: {
      type: String,
      default: "text"
    },
    label: {
      type: String,
      default: ""
    },
    id: {
      type: String,
      default: ""
    },
    placeholder: {
      type: String,
      default: ""
    },
    rspoValue: {
      type: [String, Number],
      default: ""
    },
    enableComparison: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:modelValue"],

  data() {
    return {
      isChecked: false
    };
  },

  computed: {
    innerValue: {
      get() {
        return this.modelValue;
      },
      set(newVal) {
        this.$emit("update:modelValue", newVal);
      }
    },
    isSame() {
      return String(this.modelValue) === String(this.rspoValue);
    },
    computedStyle() {
      if (this.enableComparison && this.isSame) {
        return "opacity: 0.5";
      }
      return "";
    }
  },

  methods: {
    onCheckboxChange(e) {
      this.isChecked = e.target.checked;
      if (this.isChecked) {
        this.innerValue = this.rspoValue;
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
