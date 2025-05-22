<template>
  <v-container class="pagos-container" fluid>
    <h1 class="pagos-title">Gestión de Pagos</h1>

    <div class="pagos-options">
      <button class="pagos-btn" @click="openPullDialog">Crear Orden (pull)</button>
      <button class="pagos-btn" @click="openTransferDialog">Transferir por Email</button>
      <button class="pagos-btn" @click="loadPayments">Ver Pagos</button>
    </div>

    <!-- Pull Payment Dialog -->
    <v-dialog v-model="showPullDialog" max-width="500">
      <v-card class="pagos-dialog">
        <div class="pagos-dialog-header">
          <span class="pagos-dialog-title">Nueva Orden de Pago</span>
          <v-btn icon class="dialog-close-btn" @click="showPullDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="pagos-dialog-content">
          <input v-model="pullDescription" type="text" placeholder="Descripción" class="pagos-input" />
          <input v-model.number="pullAmount" type="number" placeholder="Monto" class="pagos-input" />
        </div>
        <div class="pagos-dialog-actions">
          <button class="pagos-submit-btn" @click="createPullPayment">Confirmar</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- Transfer Email Dialog -->
    <v-dialog v-model="showTransferDialog" max-width="500">
      <v-card class="pagos-dialog">
        <div class="pagos-dialog-header">
          <span class="pagos-dialog-title">Transferencia por Email</span>
          <v-btn icon class="dialog-close-btn" @click="showTransferDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="pagos-dialog-content">
          <input v-model="email" type="email" placeholder="Email del destinatario" class="pagos-input" />
          <input v-model="transferDescription" type="text" placeholder="Descripción" class="pagos-input" />
          <input v-model.number="transferAmount" type="number" placeholder="Monto" class="pagos-input" />
        </div>
        <div class="pagos-dialog-actions">
          <button class="pagos-submit-btn" @click="transferByEmail">Transferir</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- Payments List -->
    <div class="pagos-section" v-if="payments.length">
      <h2>Pagos Realizados</h2>
      <ul>
        <li v-for="p in payments" :key="p.uuid">
          <strong>ID:</strong> {{ p.uuid }} - ${{ p.amount }} - {{ p.description }} ({{ p.method || 'PULL' }})
        </li>
      </ul>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { PaymentApi } from '@/services/payment';

const showPullDialog = ref(false);
const showTransferDialog = ref(false);
const payments = ref<any[]>([]);

const pullDescription = ref('');
const pullAmount = ref(0);

const transferDescription = ref('');
const transferAmount = ref(0);
const email = ref('');

function openPullDialog() {
  showPullDialog.value = true;
}

function openTransferDialog() {
  showTransferDialog.value = true;
}

async function createPullPayment() {
  try {
    const payload = {
      description: pullDescription.value,
      amount: pullAmount.value,
      metadata: {}
    };
    const res = await PaymentApi.pull(payload);
    if (res && res.uuid) {
      payments.value.push(res);
    }
    pullDescription.value = '';
    pullAmount.value = 0;
    showPullDialog.value = false;
  } catch (err) {
    console.error('Error al crear orden:', err);
  }
}

async function transferByEmail() {
  try {
    const payload = {
      description: transferDescription.value,
      amount: transferAmount.value,
      metadata: {}
    };
    const res = await PaymentApi.transferByEmail(email.value, payload);
    if (res && res.uuid) {
      payments.value.push(res);
    }
    email.value = '';
    transferDescription.value = '';
    transferAmount.value = 0;
    showTransferDialog.value = false;
  } catch (err) {
    console.error('Error en la transferencia:', err);
  }
}

async function loadPayments() {
  try {
    const res = await PaymentApi.getAll();
    payments.value = res?.results || [];
  } catch (err) {
    console.error('Error al obtener pagos:', err);
  }
}

onErrorCaptured((err) => {
  console.error('🔥 Error capturado en render:', err);
  return false;
});
</script>

<style scoped>
.pagos-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: var(--background);
  height: 100vh;
}

.pagos-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.pagos-options {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.pagos-btn,
.pagos-submit-btn {
  background-color: var(--primary);
  color: #fff;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.pagos-btn:hover,
.pagos-submit-btn:hover {
  filter: brightness(1.05);
}

.pagos-dialog {
  border-radius: 1rem;
  padding: 1.5rem;
}

.pagos-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagos-dialog-title {
  font-weight: 700;
  font-size: 1.2rem;
}

.pagos-dialog-content {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pagos-dialog-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.pagos-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.dialog-close-btn {
  color: var(--muted-text);
}

.pagos-section ul {
  list-style: none;
  padding: 0;
  width: 100%;
  max-width: 600px;
}

.pagos-section li {
  margin-bottom: 0.5rem;
  background: #f9f9f9;
  padding: 0.75rem;
  border-radius: 0.5rem;
}
</style>