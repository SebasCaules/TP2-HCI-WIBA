import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PaymentApi, type Payment, type PaymentResponse, type PaymentFilters } from '@/api/payment';

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Payment[]>([]);
  const transactionsResponse = ref<PaymentResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchTransactions(filters?: PaymentFilters) {
    loading.value = true;
    error.value = null;
    try {
      const res = await PaymentApi.getAll(filters);
      transactions.value = res.results;
      transactionsResponse.value = {
        results: res.results,
        paging: {
          page: res.paging.page,
          pages: res.paging.pages,
          total: res.paging.total,
          totalCount: res.paging.totalCount
        }
      };
    } catch (e) {
      error.value = 'Error al obtener transacciones';
      transactions.value = [];
      transactionsResponse.value = null;
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  return {
    transactions,
    transactionsResponse,
    loading,
    error,
    fetchTransactions
  };
});