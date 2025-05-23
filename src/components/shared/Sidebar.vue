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
          :ripple="false"
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
  { label: 'Transacciones', to: '/dashboard/transacciones', icon: 'mdi-swap-horizontal' },
  { label: 'Tarjetas', to: '/dashboard/tarjetas', icon: 'mdi-credit-card-multiple' },
  { label: 'Inversiones', to: '/dashboard/inversiones', icon: 'mdi-finance' },
  { label: 'Contactos', to: '/dashboard/contactos', icon: 'mdi-account-multiple' },
  { label: 'InversionesNew', to: '/dashboard/inversionesNew', icon: 'mdi-finance' },
]

const route = useRoute()
const isActive = (to: string) => route.path === to

const drawer = ref(true)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 960
  if (isMobile.value) {
    drawer.value = false
  } else {
    drawer.value = true
  }
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

@media (max-width: 960px) {
  .sidebar-drawer {
    position: fixed;
    z-index: 100;
  }
}

.sidebar-list {
  padding: 2rem 0 0 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  border-radius: 12px;
  margin-bottom: 2rem;
  font-size: 1.15rem;
  font-weight: 700 !important;
  min-height: 44px;
  color: #7c7c7c !important;
  opacity: 1 !important;
  filter: none !important;
  transition: color 0.2s;
  background: transparent !important;
  padding-left: 2.2rem !important;
  padding-right: 1rem;
}

.sidebar-item .v-icon {
  font-size: 1.8rem;
  margin-right: 0.1rem !important;
  opacity: 1 !important;
  filter: none !important;
  transition: color 0.2s;
}

.sidebar-item .v-list-item__content,
.sidebar-item .v-list-item__title {
  font-weight: 700 !important;
}

.sidebar-item.v-list-item--active,
.sidebar-item.v-list-item--active::before,
.sidebar-item.v-list-item--active .v-list-item__overlay {
  background: transparent !important;
  box-shadow: none !important;
}

.sidebar-item.v-list-item--active {
  color: var(--primary) !important;
  font-weight: 700;
  opacity: 1 !important;
  filter: none !important;
}

.sidebar-item.v-list-item--active .v-icon {
  color: var(--primary) !important;
  opacity: 1 !important;
  filter: none !important;
}

.sidebar-item .v-list-item__title {
  color: #444;
  font-weight: 600 !important;
  margin-left: -0.5rem;
}
</style>

<style>
.v-list-item--active,
.v-list-item--active::before,
.v-list-item--active .v-list-item__overlay {
  background: transparent !important;
  box-shadow: none !important;
}

.sidebar-item:hover,
.sidebar-item:focus,
.sidebar-item:active,
.sidebar-item:hover::before,
.sidebar-item:focus::before,
.sidebar-item:active::before,
.sidebar-item:hover .v-list-item__overlay,
.sidebar-item:focus .v-list-item__overlay,
.sidebar-item:active .v-list-item__overlay {
  background: transparent !important;
  box-shadow: none !important;
}
.sidebar-item:hover,
.sidebar-item:focus {
  color: var(--primary) !important;
}
.sidebar-item:hover .v-icon,
.sidebar-item:focus .v-icon {
  color: var(--primary) !important;
}

.sidebar-item,
.sidebar-item .v-icon {
  color: #7c7c7c !important;
  opacity: 1 !important;
  filter: none !important;
}

.sidebar-item:hover,
.sidebar-item:focus,
.sidebar-item.v-list-item--active {
  color: var(--primary) !important;
  opacity: 1 !important;
  filter: none !important;
}

.sidebar-item:hover .v-icon,
.sidebar-item:focus .v-icon,
.sidebar-item.v-list-item--active .v-icon {
  color: var(--primary) !important;
  opacity: 1 !important;
  filter: none !important;
}

.sidebar-item .v-list-item__content .v-list-item__title,
.sidebar-item .v-list-item-title {
  font-weight: 600 !important;
}

.sidebar-item:focus,
.sidebar-item:active,
.sidebar-item.v-list-item--active,
.sidebar-item.v-list-item--active::before,
.sidebar-item .v-list-item__overlay,
.sidebar-item:focus-visible,
.sidebar-item:focus .v-list-item__overlay,
.sidebar-item:active .v-list-item__overlay {
  background: transparent !important;
  box-shadow: none !important;
}
</style> 