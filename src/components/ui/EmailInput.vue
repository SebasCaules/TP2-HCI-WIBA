<template>
  <div class="mb-4">
    <v-label class="block text-sm font-medium text-label mb-1">Email</v-label>
    <v-text-field
      id="email"
      v-model="inputValue"
      type="email"
      :placeholder="placeholder"
      variant="outlined"
      density="comfortable"
      :error="!!localError"
      :error-messages="localError"
      autocomplete="email"
      hide-details="auto"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: 'nombre@ejemplo.com'
  }
})
const emit = defineEmits(['update:modelValue'])

const inputValue = ref(props.modelValue)
const localError = ref('')

watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

watch(inputValue, (val) => {
  validate(val)
  emit('update:modelValue', val)
})

function validate(val: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (val.length > 0 && !emailRegex.test(val)) {
    localError.value = 'Ingresá un email válido.'
  } else {
    localError.value = ''
  }
}
</script>

<style scoped>
.text-label {
  color: var(--label);
}
</style> 