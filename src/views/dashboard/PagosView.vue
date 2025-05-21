<template>
    <v-container class="pagos-container" fluid>
      <h1 class="pagos-title">Pagos</h1>
  
      <div class="pagos-options">
        <button class="pagos-btn" @click="toggleCreateOrder">Crear Orden de Pago</button>
        <button class="pagos-btn" @click="togglePayService">Pagar Servicio</button>
      </div>
  
      <!-- Crear Orden de Pago -->
      <v-dialog v-model="showCreateOrder" max-width="500">
        <v-card class="pagos-dialog">
          <div class="pagos-dialog-header">
            <span class="pagos-dialog-title">Crear Orden de Pago</span>
            <v-btn icon class="dialog-close-btn" @click="showCreateOrder = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <div class="pagos-dialog-content">
            <input v-model="newOrder.amount" type="number" placeholder="Monto" class="pagos-input" />
            <input v-model="newOrder.description" type="text" placeholder="Descripción" class="pagos-input" />
          </div>
          <div class="pagos-dialog-actions">
            <button class="pagos-submit-btn" @click="createOrder">Generar Orden</button>
          </div>
        </v-card>
      </v-dialog>
  
      <v-dialog v-model="showOrderCreated" max-width="400">
        <v-card class="pagos-dialog">
          <div class="pagos-dialog-header">
            <span class="pagos-dialog-title">Orden Generada</span>
          </div>
          <div class="pagos-dialog-content">
            <p class="order-id">ID de la orden: <span class="order-id-value">{{ newOrder.id }}</span></p>
          </div>
          <div class="pagos-dialog-actions">
            <button class="pagos-submit-btn" @click="showOrderCreated = false">Cerrar</button>
          </div>
        </v-card>
      </v-dialog>
  
      <!-- Pagar Servicio -->
      <v-dialog v-model="showPayService" max-width="500">
        <v-card class="pagos-dialog">
          <div class="pagos-dialog-header">
            <span class="pagos-dialog-title">Pagar Servicio</span>
            <v-btn icon class="dialog-close-btn" @click="showPayService = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <div class="pagos-dialog-content">
            <input v-model="paymentId" type="text" placeholder="Número de Identificador" class="pagos-input" />
          </div>
          <div class="pagos-dialog-actions">
            <button class="pagos-submit-btn" @click="fetchOrder">Consultar Orden</button>
          </div>
        </v-card>
      </v-dialog>
  
      <v-dialog v-model="showOrderDetails" max-width="500">
        <v-card class="pagos-dialog">
          <div class="pagos-dialog-header">
            <span class="pagos-dialog-title">Detalles de la Orden</span>
          </div>
          <div class="pagos-dialog-content">
            <p>Monto: ${{ orderData?.amount }}</p>
            <p>Descripción: {{ orderData?.description }}</p>
          </div>
          <div class="pagos-dialog-actions">
            <button class="pagos-submit-btn" @click="payOrder">Realizar Pago</button>
          </div>
        </v-card>
      </v-dialog>
  
      <v-dialog v-model="showPaymentSuccess" max-width="400">
        <v-card class="pagos-dialog">
          <div class="pagos-dialog-header">
            <span class="pagos-dialog-title-confirmation">Pago Exitoso</span>
          </div>
          <div class="pagos-dialog-content">
            <p class="confirmation-dialog">El pago fue realizado correctamente.</p>
          </div>
          <div class="pagos-dialog-actions">
            <button class="pagos-submit-btn" @click="showPaymentSuccess = false">Aceptar</button>
          </div>
        </v-card>
      </v-dialog>
  
      <!-- Lista de Órdenes -->
      <div class="pagos-section">
        <h2>Órdenes Creadas</h2>
        <ul>
          <li v-for="order in orders" :key="order.id">
            ID: {{ order.id }} - ${{ order.amount }} - {{ order.description }}
          </li>
        </ul>
      </div>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  const showCreateOrder = ref(false);
  const showOrderCreated = ref(false);
  const showPayService = ref(false);
  const showOrderDetails = ref(false);
  const showPaymentSuccess = ref(false);
  
  const newOrder = ref({
    id: '',
    amount: '',
    description: ''
  });
  
  const paymentId = ref('');
  const orderData = ref<any>(null);
  const orders = ref<{ id: string; amount: string; description: string }[]>([]);
  
  function generateShortId(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  function toggleCreateOrder() {
    showCreateOrder.value = true;
  }
  
  function togglePayService() {
    showPayService.value = true;
  }
  
  function createOrder() {
    if (!newOrder.value.amount || !newOrder.value.description) return;
  
    const orderId = generateShortId();
    orders.value.push({
      id: orderId,
      amount: newOrder.value.amount,
      description: newOrder.value.description
    });
  
    newOrder.value.id = orderId;
    showCreateOrder.value = false;
    showOrderCreated.value = true;
    newOrder.value.amount = '';
    newOrder.value.description = '';
  }
  
  function fetchOrder() {
    const foundOrder = orders.value.find(order => order.id === paymentId.value);
    if (foundOrder) {
      orderData.value = foundOrder;
      showPayService.value = false;
      showOrderDetails.value = true;
    } else {
      orderData.value = null;
    }
  }
  
  function payOrder() {
    orderData.value = null;
    paymentId.value = '';
    showOrderDetails.value = false;
    showPaymentSuccess.value = true;
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

  .pagos-dialog-title-confirmation{
    font-weight: 700;
    font-size: 1.2rem;
  }
  
  .confirmation-dialog{
    color: var(--success);
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
  
  .order-id {
    font-size: 1rem;
    text-align: center;
    color: var(--text);
  }
  
  .order-id-value {
    font-weight: 700;
    color: var(--success);
  }
  </style>
  