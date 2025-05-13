<template>
  <button
    class="filled-btn"
    :type="type"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>()
defineEmits(['click'])
</script>

<style scoped>
.filled-btn {
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 2rem;
  height: 50px;
  background: #41a7b7 !important;
  color: #fff !important;
  box-shadow: none;
  text-transform: none;
  letter-spacing: normal;
  border: none;
  outline: none;
  transition: background 0.2s;
  cursor: pointer;
}
.filled-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.filled-btn:active {
  background: #368a97 !important;
}
</style> 