<template>
  <v-navigation-drawer app permanent class="sidebar-drawer">
    <v-list>
      <v-list-item
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.label"
        :active="isActive(item.to)"
        class="sidebar-item"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'

const navItems = [
  { label: 'Inicio', to: '/dashboard', icon: 'mdi-view-dashboard' },
  { label: 'Transacciones', to: '/dashboard/transacciones', icon: 'mdi-file-document' },
  { label: 'Tarjetas', to: '/dashboard/tarjetas', icon: 'mdi-credit-card' },
  { label: 'Inversiones', to: '/dashboard/inversiones', icon: 'mdi-chart-line' },
]

const route = useRoute()
const isActive = (to: string) => route.path === to
</script>

<style scoped>
.sidebar-drawer {
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  border-right: 1px solid var(--sidebar-border);
  min-width: 220px;
}
.sidebar-item {
  border-radius: var(--radius-md);
  margin-bottom: 4px;
}
.sidebar-item.v-list-item--active {
  background: var(--sidebar-primary);
  color: var(--sidebar-primary-foreground);
}
</style> 