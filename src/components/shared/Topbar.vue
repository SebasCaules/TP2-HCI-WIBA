<template>
  <v-app-bar class="topbar" flat>
    <v-app-bar-title class="topbar-title">WIBA</v-app-bar-title>
    <v-spacer />
    <div class="topbar-user-container">
    <v-btn icon class="topbar-user" to="/profile">
      <v-icon>mdi-account</v-icon>
        <span class="user-name">{{ userName }}</span>
    </v-btn>
    </div>
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
.topbar-user-container {
  display: flex;
  align-items: center;
  padding-right: 2rem;
}
.topbar-user {
  color: var(--primary);
  font-weight: 500;
  font-size: 1rem;
  text-transform: none;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  min-width: 0;
}
.user-name {
  margin-left: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}
</style> 