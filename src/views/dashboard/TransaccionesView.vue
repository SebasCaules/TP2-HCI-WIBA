<template>
  <v-container class="transactions-container" fluid>
    <h1 class="transactions-title">Historial de Transacciones</h1>

    <v-switch
      v-model="showTable"
      inset
      class="mb-4"
      label="Mostrar como tabla"
      color="primary"
    ></v-switch>

    <v-card class="transactions-card">
      <v-card-text>
        <BaseDataTable
          v-if="showTable"
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

        <div v-else>
          <canvas id="transactionChart"></canvas>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue';
import { useTransactionStore } from '@/stores/transactionStore';
import BaseDataTable from '@/components/ui/BaseDataTable.vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const transactionStore = useTransactionStore();
const showTable = ref(true);
let chartInstance: Chart | null = null;

const headers = [
  { title: 'Fecha', key: 'date' },
  { title: 'Descripción', key: 'description' },
  { title: 'Tipo de Transacción', key: 'type' },
  { title: 'Monto', key: 'amount' },
];

function getTransactionDate(item: any): string {
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

function renderChart() {
  const ctx = document.getElementById('transactionChart') as HTMLCanvasElement;
  if (!ctx) return;
  if (chartInstance) chartInstance.destroy();

  const data = transactionStore.transactions.reduce((acc: Record<string, number>, tx: any) => {
    const type = tx.method || 'Otro';
    acc[type] = (acc[type] || 0) + tx.amount;
    return acc;
  }, {});

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: 'Montos por tipo de transacción',
          data: Object.values(data),
          backgroundColor: ['#4F46E5', '#6366F1', '#818CF8']
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

watch(showTable, async (val) => {
  if (!val) await nextTick(renderChart);
});

onMounted(async () => {
  await transactionStore.fetchTransactions();
  if (!showTable.value) renderChart();
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
