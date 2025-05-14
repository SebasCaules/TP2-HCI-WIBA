<template>
  <div>
    <!-- Botón hamburguesa solo en mobile -->
    <v-app-bar v-if="isMobile" flat color="white" class="d-flex align-center" height="56">
      <v-app-bar-nav-icon @click="drawer = true" />
    </v-app-bar>
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      app
      class="sidebar-drawer"
    >
      <v-list class="sidebar-list">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const navItems = [
  { label: 'Inicio', to: '/dashboard', icon: 'mdi-home-variant' },
  { label: 'Transacciones', to: '/dashboard/transacciones', icon: 'mdi-receipt-text' },
  { label: 'Tarjetas', to: '/dashboard/tarjetas', icon: 'mdi-credit-card-multiple' },
  { label: 'Inversiones', to: '/dashboard/inversiones', icon: 'mdi-finance' },
]

const route = useRoute()
const isActive = (to: string) => route.path === to

const drawer = ref(true)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 960
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.sidebar-drawer {
  background: #fff;
  color: #333;
  border-right: 1px solid #e0e0e0;
  min-width: 160px;
  max-width: 260px;
  padding: 0;
  box-shadow: none;
}
.sidebar-list {
  padding: 2rem 0 0 0;
}
.sidebar-item {
  display: flex;
  align-items: center;
  border-radius: 12px;
  margin-bottom: 2.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  min-height: 48px;
  color: #444;
  transition: background 0.2s, color 0.2s;
  background: #fff !important;
  padding-left: 2.2rem;
  padding-right: 1rem;
}
.sidebar-item .v-icon {
  font-size: 2rem;
  margin-right: 0.7rem;
  color: #444;
  transition: color 0.2s;
}
.sidebar-item.v-list-item--active,
.sidebar-item.v-list-item--active::before {
  background: #fff !important;
  box-shadow: none !important;
}
.sidebar-item.v-list-item--active {
  color: #3db0c7 !important;
  font-weight: 700;
}
.sidebar-item.v-list-item--active .v-icon {
  color: #3db0c7 !important;
}
@media (max-width: 960px) {
  .sidebar-drawer {
    position: fixed;
    z-index: 100;
  }
}
</style> 