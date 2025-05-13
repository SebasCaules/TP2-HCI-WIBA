<template>
  <div class="custom-text-field-wrapper">
    <span v-if="$slots.left" class="custom-text-field-left">
      <slot name="left" />
    </span>
    <input
      :type="type"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :value="modelValue"
      @input="onInput"
      class="custom-text-field-input"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      :disabled="disabled"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number
  placeholder?: string
  type?: string
  maxlength?: number | string
  autocomplete?: string
  autofocus?: boolean
  disabled?: boolean
}>()
const emit = defineEmits(['update:modelValue'])

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target) {
    emit('update:modelValue', target.value)
  }
}
</script>

<style scoped>
.custom-text-field-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #bdbdbd;
  border-radius: 16px;
  background: #f8fafc;
  padding: 0 0.8rem;
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
  width: 100%;
  box-sizing: border-box;
  height: 50px;
  max-width: 340px;
}
.custom-text-field-left {
  font-size: 1.05rem;
  font-weight: 600;
  color: #888;
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
}
.custom-text-field-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.05rem;
  font-family: var(--font-sans), sans-serif;
  width: 100%;
  font-weight: 600;
  color: #444;
  padding: 0;
  height: 100%;
  display: flex;
  align-items: center;
}
.custom-text-field-input::placeholder {
  color: #bbb;
  font-weight: 400;
}
</style> 