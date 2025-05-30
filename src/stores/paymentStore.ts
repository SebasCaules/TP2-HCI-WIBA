import { defineStore } from "pinia";
import { ref } from "vue";
import { PaymentApi, type Payment, type PaymentRequest, type PaymentResponse, type PaymentFilters } from "@/api/payment";

export const usePaymentStore = defineStore("payment", () => {
    const loading = ref(false);
    const error = ref<string | null>(null);
    const payments = ref<PaymentResponse | null>(null);

    async function createPayment(payload: PaymentRequest): Promise<Payment> {
        loading.value = true;
        error.value = null;
        try {
            const formattedPayload: PaymentRequest = {
                amount: payload.amount,
                description: `${payload.description}`,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };
            console.log('Sending payment request with payload:', formattedPayload);
            const payment = await PaymentApi.pull(formattedPayload);
            console.log('Received payment response:', payment);
            await fetchPayments(); // Update the payments list
            return payment;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al crear el pago';
            console.error('Error creating payment:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function confirmPayment(uuid: string, cardId?: string): Promise<Payment> {
        loading.value = true;
        error.value = null;
        try {
            const payment = await PaymentApi.push(uuid, cardId);
            const paymentWithTimestamp = {
                ...payment,
                metadata: {
                    ...payment.metadata,
                    timestamp: new Date().toISOString()
                }
            };
            await fetchPayments();
            return paymentWithTimestamp;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al confirmar el pago';
            console.error('Error confirming payment:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function fetchPayments(filters?: PaymentFilters): Promise<void> {
        loading.value = true;
        error.value = null;
        try {
            payments.value = await PaymentApi.getAll(filters);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al obtener los pagos';
            console.error('Error fetching payments:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function getPaymentById(id: number): Promise<Payment> {
        loading.value = true;
        error.value = null;
        try {
            return await PaymentApi.getById(id);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al obtener el pago';
            console.error('Error fetching payment:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function transferByEmail(email: string, payload: PaymentRequest, cardId?: string): Promise<Payment> {
        loading.value = true;
        error.value = null;
        try {
            const payloadWithTimestamp = {
                ...payload,
                metadata: {
                    ...payload.metadata,
                    timestamp: new Date().toISOString()
                }
            };
            const payment = await PaymentApi.transferByEmail(email, payloadWithTimestamp, cardId);
            await fetchPayments(); // Actualizar la lista de pagos
            return payment;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al realizar la transferencia';
            console.error('Error transferring by email:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function transferByCVU(cvu: string, payload: PaymentRequest, cardId?: string): Promise<Payment> {
        loading.value = true;
        error.value = null;
        try {
            const payloadWithTimestamp = {
                ...payload,
                metadata: {
                    ...payload.metadata,
                    timestamp: new Date().toISOString()
                }
            };
            const payment = await PaymentApi.transferByCVU(cvu, payloadWithTimestamp, cardId);
            await fetchPayments(); // Actualizar la lista de pagos
            return payment;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al realizar la transferencia';
            console.error('Error transferring by CVU:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function transferByAlias(alias: string, payload: PaymentRequest, cardId?: string): Promise<Payment> {
        loading.value = true;
        error.value = null;
        try {
            const payloadWithTimestamp = {
                ...payload,
                metadata: {
                    ...payload.metadata,
                    timestamp: new Date().toISOString()
                }
            };
            const payment = await PaymentApi.transferByAlias(alias, payloadWithTimestamp, cardId);
            await fetchPayments(); // Actualizar la lista de pagos
            return payment;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al realizar la transferencia';
            console.error('Error transferring by alias:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    return {
        loading,
        error,
        payments,
        createPayment,
        confirmPayment,
        fetchPayments,
        getPaymentById,
        transferByEmail,
        transferByCVU,
        transferByAlias
    };
});