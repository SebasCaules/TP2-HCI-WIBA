<template>
  <div class="custom-text-field-outer">
    <label v-if="label" class="custom-text-field-label">{{ label }}</label>
    <div :class="['custom-text-field-wrapper', { 'custom-text-field-error': error }]">
      <span v-if="$slots.left" class="custom-text-field-left">
        <slot name="left" />
      </span>
      <input
        :type="isPasswordVisible ? 'text' : type"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :value="modelValue"
        @input="onInput"
        class="custom-text-field-input"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : 'false'"
      />
      <span v-if="$slots.right" class="custom-text-field-right" @click="togglePassword">
        <slot name="right" :isPasswordVisible="isPasswordVisible" />
      </span>
    </div>
    <div v-if="error && errorMessage" class="custom-text-field-error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string | number
  label?: string
  placeholder?: string
  type?: string
  maxlength?: number | string
  autocomplete?: string
  autofocus?: boolean
  disabled?: boolean
  error?: boolean
  errorMessage?: string
}>()

const emit = defineEmits(['update:modelValue'])

const isPasswordVisible = ref(false)

function togglePassword(event: Event) {
  if (props.type === 'password') {
    event.preventDefault()
    isPasswordVisible.value = !isPasswordVisible.value
  }
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target) {
    emit('update:modelValue', target.value)
  }
}
</script>

<style scoped>
.custom-text-field-outer {
  width: 100%;
  margin-bottom: 1.2rem;
}
.custom-text-field-label {
  display: block;
  font-size: 0.97rem;
  color: #757575;
  margin-bottom: 0.35rem;
  font-weight: 400;
  font-family: var(--font-sans, sans-serif);
  letter-spacing: 0.01em;
}
.custom-text-field-wrapper {
  display: flex;
  align-items: center;
  border: 1.5px solid #BDBDBD;
  border-radius: 12px;
  background: transparent;
  padding: 0 1.1rem;
  width: 100%;
  box-sizing: border-box;
  height: 50px;
  transition: border-color 0.18s;
}
.custom-text-field-wrapper:hover {
  border-color: #9a9a9a;
}
.custom-text-field-wrapper:focus-within {
  border-color: #489FB5;
}
.custom-text-field-error {
  border-color: #E53935 !important;
}
.custom-text-field-left {
  margin-right: 0.7rem;
  display: flex;
  align-items: center;
}
.custom-text-field-right {
  margin-left: 0.7rem;
  display: flex;
  align-items: center;
}
.custom-text-field-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.06rem;
  font-family: var(--font-sans, sans-serif);
  width: 100%;
  font-weight: 400;
  color: #424242;
  padding: 0.2rem 0;
  height: 100%;
  display: flex;
  align-items: center;
  letter-spacing: 0.01em;
}
.custom-text-field-input::placeholder {
  color: #BDBDBD;
  font-weight: 400;
}
.custom-text-field-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.custom-text-field-error-message {
  color: #E53935;
  font-size: 0.97rem;
  margin-top: 0.3rem;
  font-family: var(--font-sans, sans-serif);
  letter-spacing: 0.01em;
}
</style> 