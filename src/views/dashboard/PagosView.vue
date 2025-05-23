<template>
  <v-container class="pagos-container" fluid>
    <h1 class="pagos-title">Gestión de Pagos</h1>

    <v-row class="mb-6" justify="center" align="center" no-gutters>
      <v-col cols="12" sm="6" md="3">
        <v-btn class="pagos-btn" block @click="openDialog('pull')">Crear Orden</v-btn>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-btn class="pagos-btn" block @click="openDialog('email')">Pagar por Email</v-btn>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-btn class="pagos-btn" block @click="openDialog('cvu')">Pagar por CVU</v-btn>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-btn class="pagos-btn" block @click="openDialog('alias')">Pagar por Alias</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="errorMessage" type="error" class="mb-4" dismissible @input="errorMessage = ''">
      {{ errorMessage }}
    </v-alert>

    <!-- Form Dialog -->
    <v-dialog v-model="dialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">{{ dialog.title }}</v-card-title>
        <v-card-text>
          <v-text-field v-if="dialog.type !== 'pull'" v-model="form.to" :label="dialog.toLabel" :type="dialog.inputType || 'text'" />
          <v-text-field v-model="form.description" label="Descripción" />
          <v-text-field v-model.number="form.amount" label="Monto" type="number" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialog.visible = false">Cancelar</v-btn>
          <v-btn class="pagos-btn" @click="submitForm" :loading="loading">Aceptar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-divider class="my-6"></v-divider>

    <h2 class="text-h6 mb-4">Historial de Pagos</h2>
    <v-btn class="pagos-btn mb-4" @click="loadPayments" :loading="loading">Actualizar</v-btn>

    <v-list v-if="payments.length">
      <v-list-item v-for="p in payments" :key="p.uuid">
        <v-list-item-content>
          <v-list-item-title>{{ p.description }} - ${{ p.amount }}</v-list-item-title>
          <v-list-item-subtitle>ID: {{ p.uuid }} | Método: {{ p.method || 'PULL' }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn icon @click="pushPayment(p.uuid)" :disabled="loading">
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>

    <v-alert v-else type="info">No hay pagos disponibles.</v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PaymentApi } from '@/services/payment';

const dialog = ref({
  visible: false,
  type: '',
  title: '',
  toLabel: '',
  inputType: 'text',
});

const payments = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const form = ref({
  to: '',
  description: '',
  amount: 0,
});

function openDialog(type: 'pull' | 'email' | 'cvu' | 'alias') {
  dialog.value.visible = true;
  dialog.value.type = type;
  form.value = { to: '', description: '', amount: 0 };

  switch (type) {
    case 'pull':
      dialog.value.title = 'Nueva Orden de Pago';
      dialog.value.toLabel = '';
      dialog.value.inputType = 'text';
      break;
    case 'email':
      dialog.value.title = 'Pagar por Email';
      dialog.value.toLabel = 'Email';
      dialog.value.inputType = 'email';
      break;
    case 'cvu':
      dialog.value.title = 'Pagar por CVU';
      dialog.value.toLabel = 'CVU';
      dialog.value.inputType = 'text';
      break;
    case 'alias':
      dialog.value.title = 'Pagar por Alias';
      dialog.value.toLabel = 'Alias';
      dialog.value.inputType = 'text';
      break;
  }
}

async function submitForm() {
  if (!form.value.description.trim()) {
    errorMessage.value = 'La descripción es obligatoria.';
    return;
  }
  if (form.value.amount <= 0) {
    errorMessage.value = 'El monto debe ser mayor a 0.';
    return;
  }
  if (dialog.value.toLabel && !form.value.to.trim()) {
    errorMessage.value = `El campo ${dialog.value.toLabel} es obligatorio.`;
    return;
  }

  loading.value = true;
  try {
    const payload = {
      description: form.value.description,
      amount: form.value.amount,
      metadata: {},
    };

    let res;
    switch (dialog.value.type) {
      case 'pull':
        res = await PaymentApi.pull(payload);
        break;
      case 'email':
        res = await PaymentApi.transferByEmail(form.value.to, payload);
        break;
      case 'cvu':
        res = await PaymentApi.transferByCVU(form.value.to, payload);
        break;
      case 'alias':
        res = await PaymentApi.transferByAlias(form.value.to, payload);
        break;
    }

    if (res?.uuid) payments.value.push(res);
    dialog.value.visible = false;
  } catch (err) {
    errorMessage.value = 'Ocurrió un error al procesar el pago';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function pushPayment(uuid: string) {
  try {
    await PaymentApi.push(uuid);
    alert('Push realizado con éxito');
  } catch (err) {
    errorMessage.value = 'Error al realizar el push';
  }
}

async function loadPayments() {
  loading.value = true;
  try {
    const res = await PaymentApi.getAll();
    payments.value = res?.results || [];
  } catch (err) {
    errorMessage.value = 'No se pudieron obtener los pagos';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.pagos-container {
  padding: 2rem;
  background-color: var(--background);
  min-height: 100vh;
}

.pagos-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--primary-text);
}

.pagos-btn {
  background-color: var(--primary);
  color: white;
  font-weight: 500;
  text-transform: none;
  border-radius: 0.5rem;
}

.pagos-btn:hover {
  filter: brightness(1.1);
}
</style>