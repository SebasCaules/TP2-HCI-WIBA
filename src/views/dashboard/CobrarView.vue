<template>
  <v-container class="cobrar-container" fluid>
    <div class="cobrar-content">
      <h1 class="cobrar-title">Cobrar</h1>
      <div class="cobrar-form-group">
        <input v-model="monto" type="number" placeholder="Monto a cobrar" class="cobrar-input" />
      </div>
      <button class="cobrar-continue-btn" @click="generarQR">Generar QR</button>

      <div v-if="qrData" class="qr-container">
        <img :src="qrData" alt="QR Code" />
        <p>Escanee el código para proceder al cobro</p>
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import QRCode from 'qrcode';

export default defineComponent({
  name: 'CobrarView',
  setup() {
    const monto = ref('');
    const qrData = ref('');

    async function generarQR() {
      if (!monto.value || parseFloat(monto.value) <= 0) {
        alert('Ingrese un monto válido');
        return;
      }

      const url = `/transferir?monto=${monto.value}`;
      try {
        qrData.value = await QRCode.toDataURL(url);
      } catch (error) {
        console.error('Error generando QR:', error);
      }
    }

    return {
      monto,
      qrData,
      generarQR
    };
  }
});
</script>

<style scoped>
.cobrar-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 2rem;
  background-color: var(--background);
  height: 100vh;
}
.cobrar-content {
  background-color: var(--card);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}
.cobrar-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}
.cobrar-form-group {
  margin-bottom: 1rem;
}
.cobrar-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-size: 1rem;
}
.cobrar-continue-btn {
  background-color: var(--primary);
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}
.cobrar-continue-btn:hover {
  background-color: var(--primary-hover);
}
</style>
