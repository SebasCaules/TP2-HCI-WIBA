<template>
  <v-container fluid class="transactions-main">
    <v-row class="transactions-row" no-gutters>
      <v-col cols="12" class="px-md-8">
        <h1 class="transactions-title">Transacciones</h1>
        <div class="card">
          <v-data-table 
            :items="transactions" 
            :headers="headers" 
            class="transactions-table" 
            :items-per-page="5"
            :loading="loading"
          >
            <template #[`header.icon`]>
              <th class="transaction-icon-cell"></th>
            </template>
            <template #[`header.description`]>
              <th class="transaction-description">Descripción</th>
            </template>
            <template #[`header.amount`]>
              <th class="transaction-amount" style="text-align: right">Monto</th>
            </template>
            <template #[`header.created_at`]>
              <th class="transaction-date" style="text-align: right">Fecha</th>
            </template>
            <template v-slot:no-data>
              <div class="text-center pa-4">
                {{ loading ? 'Cargando transacciones...' : 'No hay transacciones disponibles' }}
              </div>
            </template>
            <template v-slot:item="{ item }">
              <tr>
                <td class="transaction-icon-cell">
                  <template v-if="item.transaction_type === 'deposit'">
                    <img :src="getCardLogo(item.card_company)" :alt="item.card_company" class="transaction-card-logo" v-if="item.card_company" />
                    <v-icon v-else color="primary">mdi-credit-card</v-icon>
                  </template>
                  <template v-else-if="item.transaction_type === 'transfer'">
                    <v-icon :color="item.amount < 0 ? 'error' : 'success'" size="24">
                      {{ item.amount < 0 ? 'mdi-arrow-up-right' : 'mdi-arrow-down-left' }}
                    </v-icon>
                  </template>
                  <template v-else>
                    <v-icon color="error">mdi-arrow-up</v-icon>
                  </template>
                </td>
                <td class="transaction-description">
                  <template v-if="item.transaction_type === 'transfer'">
                    {{ item.amount < 0 ? 'Enviado a ' + item.recipient_name : 'Recibido de ' + item.sender_name }}
                    {{ item.description ? ': ' + item.description : '' }}
                  </template>
                  <template v-else>
                    {{ item.description }}
                  </template>
                </td>
                <td :class="['transaction-amount', getAmountClass(item), 'amount-cell']">
                  {{ getAmountPrefix(item) }}${{ Math.abs(item.amount).toFixed(2) }}
                </td>
                <td class="transaction-date date-cell">{{ formatDate(item.created_at) }}</td>
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
import type { User, Transaction } from '@/types/types';

interface TransactionWithJoins extends Omit<Transaction, 'recipient' | 'sender'> {
  recipient: User | null;
  sender: User | null;
}

const authStore = useAuthStore();
const userId = authStore.user?.id;

const transactions = ref<Transaction[]>([]);
const loading = ref(true);

const headers = [
  { key: 'icon', value: 'icon' },
  { key: 'description', value: 'description' },
  { key: 'amount', value: 'amount' },
  { key: 'created_at', value: 'created_at' }
];

function getCardLogo(company: string | null): string {
  if (!company) return '';
  switch (company.toLowerCase()) {
    case 'visa':
      return 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png';
    case 'mastercard':
      return 'https://brandlogos.net/wp-content/uploads/2021/11/mastercard-logo.png';
    case 'amex':
      return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg';
    default:
      return '';
  }
}

async function fetchTransactions() {
  if (!userId) {
    console.error('No user ID available');
    return;
  }
  
  try {
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .or(`user_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return;
    }

    if (!transactionsData) {
      transactions.value = [];
      return;
    }

    // Fetch user details for all unique user IDs in the transactions
    const userIds = new Set<string>();
    transactionsData.forEach(tx => {
      if (tx.user_id) userIds.add(tx.user_id);
      if (tx.recipient_id) userIds.add(tx.recipient_id);
    });

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', Array.from(userIds));

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    // Create a map of user details for quick lookup
    const usersMap = new Map(
      (usersData || []).map(user => [user.id, user])
    );

    const transformedTransactions: Transaction[] = transactionsData.map(tx => {
      const isOutgoing = tx.user_id === userId;
      const recipient = tx.recipient_id ? usersMap.get(tx.recipient_id) : undefined;
      const sender = tx.user_id ? usersMap.get(tx.user_id) : undefined;
      
      return {
        ...tx,
        amount: isOutgoing ? -Number(tx.amount) : Number(tx.amount),
        recipient_name: recipient ? `${recipient.first_name} ${recipient.last_name}` : undefined,
        sender_name: sender ? `${sender.first_name} ${sender.last_name}` : undefined,
        recipient: recipient || undefined,
        sender: sender || undefined
      };
    });

    transactions.value = transformedTransactions;
  } catch (error) {
    console.error('Unexpected error fetching transactions:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  await fetchTransactions();
});

function formatDate(timestamp: string): string {
  if (!timestamp) return 'Fecha no disponible';
  const parsedDate = new Date(timestamp);
  return isNaN(parsedDate.getTime()) ? 'Fecha inválida' : parsedDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getAmountClass(transaction: Transaction): string {
  if (transaction.transaction_type === 'deposit') {
    return 'positive';
  }
  return transaction.amount < 0 ? 'negative' : 'positive';
}

function getAmountPrefix(transaction: Transaction): string {
  if (transaction.transaction_type === 'deposit') {
    return '+ ';
  }
  return transaction.amount < 0 ? '- ' : '+ ';
}
</script>

<style scoped>
.transactions-main {
  padding: 0;
}

.transactions-row {
  margin: 0;
}

.transactions-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
  font-family: var(--font-sans), sans-serif;
}

.transactions-table {
  background: transparent;
  table-layout: fixed;
}

.transactions-table :deep(th),
.transactions-table :deep(td) {
  padding: 5px 0 !important;
}

.transactions-table :deep(th) {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text);
  white-space: nowrap;
  background-color: var(--card);
  border-bottom: none;
  font-family: var(--font-sans), sans-serif;
}

.transactions-table :deep(th.transaction-amount),
.transactions-table :deep(th.transaction-date) {
  text-align: start !important;
  justify-content: flex-start !important;
}

.transactions-table :deep(th.transaction-description) {
  text-align: left !important;
  justify-content: flex-start !important;
}

.transactions-table :deep(th.transaction-icon-cell) {
  text-align: center !important;
  justify-content: center !important;
}

.transaction-icon-cell {
  width: auto;
  min-width: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 8px !important;
  padding-right: 0 !important;
}

.transaction-card-logo {
  width: 48px;
  height: 32px;
  object-fit: contain;
  display: block;
  margin: 0;
}

.transaction-description {
  font-weight: 500;
  padding-left: 0 !important;
  margin-left: 0 !important;
  padding-right: 16px !important;
  text-align: start !important;
}

.transaction-amount {
  font-weight: 600;
  font-family: var(--font-sans), sans-serif;
  text-align: start !important;
  padding-right: 16px !important;
  padding-left: 16px !important;
}

.transaction-amount.positive {
  color: var(--success);
}

.transaction-amount.negative {
  color: var(--error);
}

.transaction-date {
  color: var(--muted-text);
  font-size: 0.95rem;
  text-align: start !important;
  padding-right: 16px !important;
  padding-left: 16px !important;
}

.text-center {
  text-align: center;
  color: var(--muted-text);
  font-size: 1.1rem;
}

.amount-header {
  width: 150px;
  text-align: end !important;
  padding-right: 16px !important;
  padding-left: 0 !important;
  font-weight: 600;
  font-family: var(--font-sans), sans-serif;
}

.date-header {
  width: 120px;
  text-align: end !important;
  padding-right: 16px !important;
  padding-left: 0 !important;
  font-weight: 600;
  font-family: var(--font-sans), sans-serif;
  color: var(--text);
}
</style>
