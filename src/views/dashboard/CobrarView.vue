<template>
  <v-container class="cobrar-container" fluid>
    <div class="cobrar-content">
      <h1 class="cobrar-title">Cobrar</h1>
      <div class="cobrar-form-group">
        <input v-model="monto" type="number" placeholder="Monto a cobrar" class="cobrar-input" />
      </div>
      <button class="cobrar-continue-btn" @click="generarQR">Generar QR</button>

      <div v-if="qrData" class="qr-container">
   <!--     <a @click.prevent="openDialog" class="qr-link" style="color: var(--primary); text-decoration: underline; cursor: pointer;">
          Abrir cobro
        </a>  -->
        <img :src="qrData" alt="QR Code" @click="openDialog" style="cursor: pointer;" />
        <p>Escanee el código para proceder al cobro</p>
      </div>

      <!-- Confirmation Dialog -->
      <v-dialog v-model="showConfirmDialog" max-width="400px">
        <v-card>
          <div class="dialog-header">
            <h2>Confirmar Cobro</h2>
          </div>
          <div class="dialog-content">
            <p>Monto: ${{ dialogData.amount }}</p>
            <p>Usuario: {{ dialogData.username }}</p>
            <p>Descripción: {{ dialogData.description }}</p>
          </div>
          <div class="dialog-actions">
            <button class="cobrar-continue-btn" @click="confirmCobro">Aceptar</button>
          </div>
        </v-card>
      </v-dialog>

    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import QRCode from 'qrcode';
import { useAuthStore } from '@/store/auth';

const monto = ref('');
const qrData = ref('');
const showConfirmDialog = ref(false);
const authStore = useAuthStore();
const username = authStore.user?.name || 'Usuario desconocido';

const dialogData = ref({ amount: '', username: '', description: '' });

async function generarQR() {
  if (!monto.value || parseFloat(monto.value) <= 0) {
    alert('Ingrese un monto válido');
    return;
  }

  // Establecer los datos del diálogo directamente al generar el QR
  dialogData.value = {
    amount: monto.value,
    username,
    description: 'Cobro'
  };

  try {
    qrData.value = await QRCode.toDataURL(`Cobro generado por ${username} por $${monto.value}`);
  } catch (error) {
    console.error('Error generando QR:', error);
  }
}

function openDialog() {
  if (!dialogData.value.amount) {
    console.warn('Monto no establecido. No se puede abrir el diálogo.');
    return;
  }
  showConfirmDialog.value = true;
}

function confirmCobro() {
  alert(`Cobro confirmado por $${dialogData.value.amount}`);
  showConfirmDialog.value = false;
}
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

.qr-container {
  margin-top: 1rem;
}

.dialog-header {
  padding: 1rem;
  background-color: var(--primary);
  color: #fff;
  text-align: center;
}

.dialog-content {
  padding: 1rem;
}

.dialog-actions {
  padding: 1rem;
  text-align: center;
}
</style>