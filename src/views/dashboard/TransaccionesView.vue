<template>
  <v-container class="transactions-container" fluid>
    <h1 class="transactions-title">Historial de Transacciones</h1>

    <v-card class="transactions-card">
      <v-card-text>
        <BaseDataTable
          :headers="headers"
          :items="transactionStore.transactions"
          :loading="transactionStore.loading"
        >
          <template #item.date="{ item }">
            {{ formatDate(getTransactionDate(item)) }}
          </template>
          <template #item.description="{ item }">
            {{ item.description ?? '-' }}
          </template>
          <template #item.type="{ item }">
            <template v-if="item.method === 'ACCOUNT'">
              Cuenta
            </template>
            <template v-else-if="item.method === 'CARD' && item.card">
              Tarjeta *{{ item.card.number.slice(-4) }}
            </template>
            <template v-else>
              Otro
            </template>
          </template>
          <template #item.amount="{ item }">
            ${{ item.amount?.toFixed(2) ?? '-' }}
          </template>
        </BaseDataTable>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTransactionStore } from '@/stores/transactionStore';
import BaseDataTable from '@/components/ui/BaseDataTable.vue';

const transactionStore = useTransactionStore();

const headers = [
  { title: 'Fecha', key: 'date' },
  { title: 'Descripción', key: 'description' },
  { title: 'Tipo de Transacción', key: 'type' },
  { title: 'Monto', key: 'amount' },
];

function getTransactionDate(item: any): string {
  // Try to get timestamp from metadata first, fall back to created_at
  return item.metadata?.timestamp || item.created_at;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

onMounted(() => {
  transactionStore.fetchTransactions();
});
</script>

<style scoped>
.transactions-container {
  padding: 2rem;
  background-color: var(--background);
  min-height: 100vh;
}

.transactions-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--primary-text);
}

.transactions-card {
  border-radius: 1rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  background-color: white;
}
</style>