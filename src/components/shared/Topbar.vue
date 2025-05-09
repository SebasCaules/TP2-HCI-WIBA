<template>
  <v-app-bar class="topbar" flat>
    <v-app-bar-title class="topbar-title">WIBA</v-app-bar-title>
    <v-spacer />
    <v-btn icon class="topbar-user" to="/profile">
      <v-icon>mdi-account</v-icon>
      <span class="ml-2">{{ userName }}</span>
    </v-btn>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const userName = computed(() => authStore.user?.name || 'Usuario')
</script>

<style scoped>
.topbar {
  background: var(--card);
  color: var(--primary);
  border-bottom: 1px solid var(--border);
}
.topbar-title {
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--primary);
}
.topbar-user {
  color: var(--primary);
  font-weight: 500;
  font-size: 1rem;
  text-transform: none;
}
</style> 