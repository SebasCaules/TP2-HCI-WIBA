<template>
  <button
    class="icon-filled-btn"
    :type="type"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span v-if="icon" class="icon-filled-btn__icon">
      <v-icon :icon="icon" size="20" />
    </span>
    <span class="icon-filled-btn__text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { VIcon } from 'vuetify/components'
defineProps<{
  icon?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
}>()
defineEmits(['click'])
</script>

<style scoped>
.icon-filled-btn {
  width: 100%;
  max-width: v-bind('fullWidth ? "100%" : "340px"');
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
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
  padding: 0 1.5rem;
  gap: 0.5rem;
}
.icon-filled-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.icon-filled-btn:active {
  background: #368a97 !important;
}
.icon-filled-btn__icon {
  display: flex;
  align-items: center;
}
.icon-filled-btn__text {
  display: flex;
  align-items: center;
  font-weight: 700;
}
</style> 