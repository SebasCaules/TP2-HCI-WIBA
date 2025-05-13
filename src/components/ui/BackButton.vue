<template>
  <router-link :to="to" class="back-button">
    <v-icon size="small">mdi-arrow-left</v-icon>
    <span>Volver</span>
  </router-link>
</template>

<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted-text);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.back-button:hover {
  color: var(--text);
  background: var(--background);
}
</style> 