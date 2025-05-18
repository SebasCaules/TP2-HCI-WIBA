<template>
    <v-container class="pagos-container" fluid>
      <h1 class="pagos-title">Pagos</h1>
  
      <div class="pagos-options">
        <button class="pagos-btn" @click="toggleCreateOrder">Crear Orden de Pago</button>
        <button class="pagos-btn" @click="togglePayService">Pagar Servicio</button>
      </div>
  
      <!-- Crear Orden de Pago -->
      <div v-if="showCreateOrder" class="pagos-section">
        <h2>Crear Orden de Pago</h2>
        <div class="pagos-form-group">
          <input v-model="newOrder.amount" type="number" placeholder="Monto" class="pagos-input" />
        </div>
        <div class="pagos-form-group">
          <input v-model="newOrder.description" type="text" placeholder="Descripción" class="pagos-input" />
        </div>
        <button class="pagos-submit-btn" @click="createOrder">Generar Orden</button>
        <div v-if="newOrder.id" class="order-created">
          Orden generada: ID {{ newOrder.id }}
        </div>
      </div>
  
      <!-- Pagar Servicio -->
      <div v-if="showPayService" class="pagos-section">
        <h2>Pagar Servicio</h2>
        <div class="pagos-form-group">
          <input v-model="paymentId" type="text" placeholder="Número de Identificador" class="pagos-input" />
        </div>
        <button class="pagos-submit-btn" @click="fetchOrder">Consultar Orden</button>
  
        <div v-if="orderData" class="order-details">
          <p>Monto: ${{ orderData.amount }}</p>
          <p>Descripción: {{ orderData.description }}</p>
          <button class="pagos-submit-btn" @click="payOrder">Realizar Pago</button>
        </div>
      </div>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  // Estado de las secciones
  const showCreateOrder = ref(false);
  const showPayService = ref(false);
  
  // Estado para la creación de orden
  const newOrder = ref({
    id: '',
    amount: '',
    description: ''
  });
  
  // Estado para el pago de servicio
  const paymentId = ref('');
  const orderData = ref(null);
  
  // Lista de órdenes
  const orders = ref<{ id: string; amount: string; description: string }[]>([]);
  
  function toggleCreateOrder() {
    showCreateOrder.value = !showCreateOrder.value;
    showPayService.value = false;
  }
  
  function togglePayService() {
    showPayService.value = !showPayService.value;
    showCreateOrder.value = false;
  }
  
  // Generar identificador corto
  function generateShortId(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Crear orden de pago
  function createOrder() {
    if (!newOrder.value.amount || !newOrder.value.description) {
      alert('Debe completar todos los campos.');
      return;
    }
  
    const orderId = generateShortId();
    orders.value.push({
      id: orderId,
      amount: newOrder.value.amount,
      description: newOrder.value.description
    });
  
    newOrder.value.id = orderId;
    newOrder.value.amount = '';
    newOrder.value.description = '';
  }
  
  // Consultar orden por ID
  function fetchOrder() {
    const foundOrder = orders.value.find(order => order.id === paymentId.value);
    if (foundOrder) {
      orderData.value = foundOrder;
    } else {
      alert('No se encontró una orden con ese identificador.');
      orderData.value = null;
    }
  }
  
  // Realizar pago
  function payOrder() {
    alert(`Pago realizado por $${orderData.value.amount}`);
    orderData.value = null;
    paymentId.value = '';
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
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .pagos-btn:hover {
    background-color: var(--primary-hover);
  }
  
  .pagos-section {
    background-color: var(--card);
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .pagos-form-group {
    margin-bottom: 1rem;
  }
  
  .pagos-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    font-size: 1rem;
  }
  
  .pagos-submit-btn {
    background-color: var(--primary);
    color: #fff;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .pagos-submit-btn:hover {
    background-color: var(--primary-hover);
  }
  
  .order-created {
    margin-top: 1rem;
    font-weight: bold;
    color: var(--success);
  }
  
  .order-details {
    background-color: var(--card);
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
    text-align: left;
  }
  </style>