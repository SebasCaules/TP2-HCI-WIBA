<template>
  <div class="mb-6">
    <v-label class="block text-sm font-medium text-label mb-1">Contraseña</v-label>
    <div>
      <v-text-field
        id="password"
        v-model="inputValue"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="placeholder"
        variant="outlined"
        density="comfortable"
        autocomplete="current-password"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
        :error="errors.length > 0"
        hide-details="auto"
        class="password-input"
        style="width: 100%;"
      />
    </div>
    <ul v-if="errors.length > 0" class="password-errors mt-2 text-sm text-error-text">
      <li v-for="(msg, idx) in errors" :key="idx">{{ msg }}</li>
    </ul>
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
    default: '••••••••'
  }
})
const emit = defineEmits(['update:modelValue'])

const inputValue = ref(props.modelValue)
const showPassword = ref(false)
const errors = ref<string[]>([])

watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

watch(inputValue, (val) => {
  validate(val)
  emit('update:modelValue', val)
})

function validate(val: string) {
  const newErrors: string[] = []
  if (val.length > 0 && val.length < 6) newErrors.push('Al menos 6 caracteres')
  if (val.length > 0 && !/[A-Z]/.test(val)) newErrors.push('Una letra mayúscula')
  if (val.length > 0 && !/\d/.test(val)) newErrors.push('Un número')
  errors.value = newErrors
}
</script>

<style scoped>
.text-label {
  color: var(--label);
}
.text-error-text {
  color: var(--error-text);
}
.password-input {
  width: 100%;
}
.password-errors {
  list-style: disc inside;
  margin-left: 16px; /* igual que el padding del input */
  padding-left: 0;
}
</style> 