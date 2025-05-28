<template>
  <div id="app">
    <noscript>
      <div class="noscript-warning">
        <h1>JavaScript Required</h1>
        <p>This application requires JavaScript to function properly. Please enable JavaScript in your browser settings to continue.</p>
      </div>
    </noscript>
    <div v-if="!isJavaScriptEnabled" class="js-disabled-warning">
      <h1>JavaScript Required</h1>
      <p>This application requires JavaScript to function properly. Please enable JavaScript in your browser settings to continue.</p>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isJavaScriptEnabled as checkJavaScriptEnabled } from '@/utils/browser'

const isJavaScriptEnabled = ref(true)

onMounted(() => {
  isJavaScriptEnabled.value = checkJavaScriptEnabled()
})
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

.noscript-warning,
.js-disabled-warning {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background);
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  z-index: 9999;
}

.noscript-warning h1,
.js-disabled-warning h1 {
  color: var(--primary);
  margin-bottom: 1rem;
  font-size: 2rem;
}

.noscript-warning p,
.js-disabled-warning p {
  max-width: 600px;
  line-height: 1.5;
  font-size: 1.1rem;
}
</style>
