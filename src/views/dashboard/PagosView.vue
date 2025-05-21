<template>
    <v-container class="pagos-container" fluid>
      <h1 class="pagos-title">Pagos</h1>
  
      <div class="pagos-options">
        <button class="pagos-btn" @click="showCreateDialog = true">Crear Orden de Pago</button>
        <button class="pagos-btn" @click="showPayDialog = true">Pagar Servicio</button>
      </div>
  
      <!-- Crear Orden Dialog -->
      <v-dialog v-model="showCreateDialog" max-width="500">
        <v-card class="crear-dialog">
          <div class="crear-dialog-header">
            <span class="crear-dialog-title">Crear Orden de Pago</span>
            <v-btn icon class="dialog-close-btn" @click="showCreateDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <div class="crear-dialog-content">
            <input v-model="newOrder.amount" type="number" placeholder="Monto" class="pagos-input" />
            <input v-model="newOrder.description" type="text" placeholder="Descripción" class="pagos-input" />
            <div class="crear-dialog-actions">
              <button class="pagos-submit-btn" @click="createOrder">Generar Orden</button>
            </div>
          </div>
        </v-card>
      </v-dialog>
  
      <!-- Orden Generada Dialog -->
      <v-dialog v-model="showOrderIdDialog" max-width="400">
        <v-card class="id-dialog">
          <div class="id-dialog-content">
            <v-icon color="success" size="48">mdi-check-circle</v-icon>
            <div class="id-dialog-title">Orden Generada</div>
            <div class="id-dialog-id">ID: {{ lastOrderId }}</div>
          </div>
        </v-card>
      </v-dialog>
  
      <!-- Pagar Servicio Dialog -->
      <v-dialog v-model="showPayDialog" max-width="500">
        <v-card class="crear-dialog">
          <div class="crear-dialog-header">
            <span class="crear-dialog-title">Pagar Servicio</span>
            <v-btn icon class="dialog-close-btn" @click="showPayDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <div class="crear-dialog-content">
            <input v-model="paymentId" type="text" placeholder="Número de Identificador" class="pagos-input" />
            <div class="crear-dialog-actions">
              <button class="pagos-submit-btn" @click="fetchOrder">Consultar Orden</button>
            </div>
          </div>
        </v-card>
      </v-dialog>
  
      <!-- Datos de Orden Dialog -->
      <v-dialog v-model="showOrderDetailsDialog" max-width="500">
        <v-card class="confirm-dialog">
          <div class="confirm-dialog-header">
            <span class="confirm-dialog-title">Confirmar Pago</span>
            <v-btn icon class="dialog-close-btn" @click="showOrderDetailsDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <div class="confirm-dialog-content">
            <p><strong>Monto:</strong> ${{ orderData?.amount }}</p>
            <p><strong>Descripción:</strong> {{ orderData?.description }}</p>
            <div class="confirm-dialog-actions">
              <button class="pagos-submit-btn" @click="payOrder">Realizar Pago</button>
            </div>
          </div>
        </v-card>
      </v-dialog>
  
      <!-- Pago Exitoso Dialog -->
      <v-dialog v-model="showSuccessDialog" max-width="400">
        <v-card class="id-dialog">
          <div class="id-dialog-content">
            <v-icon color="success" size="48">mdi-check-circle</v-icon>
            <div class="id-dialog-title">¡Pago Realizado!</div>
            <div class="id-dialog-id">El pago fue completado correctamente.</div>
          </div>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  const showCreateDialog = ref(false)
  const showPayDialog = ref(false)
  const showOrderIdDialog = ref(false)
  const showOrderDetailsDialog = ref(false)
  const showSuccessDialog = ref(false)
  
  const newOrder = ref({ id: '', amount: '', description: '' })
  const paymentId = ref('')
  const orderData = ref<any>(null)
  const lastOrderId = ref('')
  const orders = ref<{ id: string; amount: string; description: string }[]>([])
  
  function generateShortId(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
  
  function createOrder() {
    if (!newOrder.value.amount || !newOrder.value.description) return
    const orderId = generateShortId()
    orders.value.push({ id: orderId, amount: newOrder.value.amount, description: newOrder.value.description })
    lastOrderId.value = orderId
    newOrder.value.amount = ''
    newOrder.value.description = ''
    showCreateDialog.value = false
    showOrderIdDialog.value = true
  }
  
  function fetchOrder() {
    const found = orders.value.find(o => o.id === paymentId.value)
    if (found) {
      orderData.value = found
      showPayDialog.value = false
      showOrderDetailsDialog.value = true
    } else {
      orderData.value = null
      showPayDialog.value = false
    }
  }
  
  function payOrder() {
    showOrderDetailsDialog.value = false
    showSuccessDialog.value = true
    paymentId.value = ''
    orderData.value = null
  }
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
  
  .pagos-btn {
    background-color: var(--primary);
    color: #fff;
    padding: 0.5rem 1.2rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    transition: opacity 0.2s ease;
  }
  
  .pagos-btn:hover {
    opacity: 0.85;
  }
  
  .pagos-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    font-size: 1rem;
    margin-bottom: 1rem;
  }
  
  .pagos-submit-btn {
    background-color: var(--primary);
    color: #fff;
    padding: 0.5rem 1.2rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    transition: opacity 0.2s ease;
  }
  
  .pagos-submit-btn:hover {
    opacity: 0.9;
  }
  
  .crear-dialog, .confirm-dialog {
    border-radius: 1.5rem;
    padding: 2rem;
    text-align: center;
  }
  
  .crear-dialog-header, .confirm-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .crear-dialog-title, .confirm-dialog-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text);
  }
  
  .dialog-close-btn {
    color: var(--muted-text) !important;
  }
  
  .crear-dialog-content, .confirm-dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .crear-dialog-actions, .confirm-dialog-actions {
    margin-top: 1.2rem;
  }
  
  .id-dialog {
    border-radius: 1.5rem;
    padding: 2rem;
    text-align: center;
  }
  
  .id-dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
  }
  
  .id-dialog-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--primary);
  }
  
  .id-dialog-id {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--success);
  }
  </style>