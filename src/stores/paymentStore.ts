import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PaymentApi, type Payment } from '@/api/payment';

export const usePaymentStore = defineStore('payment', () => {
    const payments = ref<Payment[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchPayments() {
        loading.value = true;
        error.value = null;
        try {
            payments.value = await PaymentApi.get();
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al cargar los pagos';
            console.error('Error fetching payments:', e);
        } finally {
            loading.value = false;
        }
    }

    async function createDeposit(amount: number) {
        loading.value = true;
        error.value = null;
        try {
            const payment = await PaymentApi.createDeposit(amount);
            payments.value.unshift(payment);
            return payment;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al crear el depósito';
            console.error('Error creating deposit:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function pushDeposit(paymentId: number) {
        loading.value = true;
        error.value = null;
        try {
            const updatedPayment = await PaymentApi.completeDeposit(paymentId);
            const index = payments.value.findIndex(p => p.id === paymentId);
            if (index !== -1) {
                payments.value[index] = updatedPayment;
            }
            return updatedPayment;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al completar el depósito';
            console.error('Error pushing deposit:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    return {
        payments,
        loading,
        error,
        fetchPayments,
        createDeposit,
        pushDeposit
    };
}); 