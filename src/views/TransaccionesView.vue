<template>
  <v-container fluid class="transactions-main">
    <v-row class="transactions-row" no-gutters>
      <v-col cols="12" class="px-md-8">
        <div class="card">
          <div class="card-header">
            <h2>Historial de Transacciones</h2>
          </div>
          <v-data-table :items="transactions" :headers="headers" class="transactions-table" :items-per-page="5">
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ formatDate(item.created_at) }}</td>
                <td>{{ item.description }}</td>
                <td :class="{'positive': item.amount >= 0, 'negative': item.amount < 0}">
                  $ {{ item.amount.toFixed(2) }}
                </td>
                <td>{{ item.transaction_type }}</td>
              </tr>
            </template>
          </v-data-table>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/plugins/supabase';
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();
const userId = authStore.user?.id;

const headers = [
  { text: 'Fecha', value: 'created_at' },
  { text: 'Descripción', value: 'description' },
  { text: 'Monto', value: 'amount' },
  { text: 'Tipo', value: 'transaction_type' }
];

const transactions = ref([]);

async function fetchTransactions() {
  if (!userId) return;
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching transactions:', error.message);
  } else {
    transactions.value = data;
  }
}

onMounted(() => {
  fetchTransactions();
});

function formatDate(timestamp) {
  if (!timestamp) return 'Fecha no disponible';
  const parsedDate = new Date(timestamp);
  return isNaN(parsedDate.getTime()) ? 'Fecha inválida' : parsedDate.toLocaleDateString('es-AR');
}
</script>
