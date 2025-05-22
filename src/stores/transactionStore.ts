import { ref } from "vue";
import { defineStore } from "pinia";
import { TransactionApi, type FullTransaction } from "@/api/transactions";

export const useTransactionStore = defineStore("transactions", () => {
  const transactions = ref<FullTransaction[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchTransactions(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await TransactionApi.getAll(); // asegurate que exista este método en tu TransactionApi
      if (response && Array.isArray(response)) {
        transactions.value = response;
      } else {
        error.value = "Respuesta inválida del servidor.";
      }
    } catch (err) {
      error.value = "Error al cargar transacciones.";
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  function detectIdentifierType(input: string): "email" | "cvu" | "alias" | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cvuRegex = /^\d{22}$/;
    const aliasRegex = /^[a-zA-Z0-9_.-]{6,30}$/;
  
    if (emailRegex.test(input)) return "email";
    if (cvuRegex.test(input)) return "cvu";
    if (aliasRegex.test(input)) return "alias";
  
    return null;
  }
  

  async function transferByIdentifier(
    identifier: string,
    cardId: string,
    amount: number,
    description: string
  ): Promise<FullTransaction | null> {
    const type = detectIdentifierType(identifier);
    if (!type) {
      error.value = "Identificador inválido.";
      return null;
    }
  
    try {
      const tx = await TransactionApi.transferByIdentifier(identifier, type, cardId, amount, description);
      transactions.value.unshift(tx);
      return tx;
    } catch (err) {
      console.error(err);
      error.value = "No se pudo realizar la transferencia.";
      return null;
    }
  }
  

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    transferByIdentifier
  };
});
