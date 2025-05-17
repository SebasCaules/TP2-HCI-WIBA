<template>
    <router-view></router-view>
</template>

<script setup lang="ts">
// No additional setup needed
</script>

<style>
@import './assets/styles/style.css';
@import 'vuetify/styles';

/* Estilos globales para centrar diálogos */
.v-dialog {
  margin-left: var(--sidebar-width, 0px) !important;
  transform: translateX(calc((100vw - var(--sidebar-width, 0px)) / 2 - 50%)) !important;
}

/* Asegurar que el diálogo no se desborde en pantallas pequeñas */
@media (max-width: 600px) {
  .v-dialog {
    margin-left: 0 !important;
    transform: translateX(0) !important;
  }
}
</style>
