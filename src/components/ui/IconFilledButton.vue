<template>
  <button
    class="icon-filled-btn"
    :class="[
      variant === 'secondary' ? 'icon-filled-btn--secondary' : 'icon-filled-btn--primary'
    ]"
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
  variant?: 'primary' | 'secondary'
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

.icon-filled-btn--primary {
  background: var(--primary) !important;
  color: #fff !important;
}

.icon-filled-btn--primary:active {
  background: var(--primary-hover) !important;
}

.icon-filled-btn--secondary {
  background: var(--muted) !important;
  color: var(--muted-foreground) !important;
}

.icon-filled-btn--secondary:active {
  background: var(--muted-hover) !important;
}
.icon-filled-btn--secondary:hover {
  background: var(--muted-hover) !important;
  color: var(--muted-foreground-hover) !important;
}

.icon-filled-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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