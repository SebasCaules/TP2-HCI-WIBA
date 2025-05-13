<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    class="filled-btn"
    :type="type"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
  to?: string
}>()
defineEmits(['click'])
</script>

<style scoped>
.filled-btn {
  width: 100%;
  max-width: v-bind('fullWidth ? "none" : "340px"');
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
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
  text-decoration: none;
  padding: 0 1.5rem;
}
.filled-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.filled-btn:active {
  background: #368a97 !important;
}
</style> 