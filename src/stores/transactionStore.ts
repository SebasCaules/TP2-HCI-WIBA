import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PaymentApi, type Payment } from '@/api/payment';

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Payment[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchTransactions() {
    loading.value = true;
    error.value = null;
    try {
      const res = await PaymentApi.get();
      // Verifica si es un array o un objeto con .results
      transactions.value = Array.isArray(res) ? res : res?.results ?? [];
    } catch (e) {
      error.value = 'Error al obtener transacciones';
      transactions.value = [];
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  return {
    transactions,
    loading,
    error,
    fetchTransactions
  };
});