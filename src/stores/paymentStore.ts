import { defineStore } from "pinia";
import { ref } from "vue";
import { PaymentApi, type Payment, type PaymentRequest } from "@/api/payment";

interface PaginatedResponse {
    paging: {
        page: number;
        pageSize: number;
        pageCount: number;
        totalCount: number;
    };
    results: Payment[];
}

export const usePaymentStore = defineStore("payment", () => {
    const payments = ref<Payment[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const pagination = ref({
        page: 1,
        pageSize: 10,
        pageCount: 1,
        totalCount: 0
    });

    console.log('🔄 Store initialized with payments:', payments.value);

    async function fetchPayments() {
        console.log('📥 Fetching payments...');
        console.log('Current payments before fetch:', payments.value);
        loading.value = true;
        error.value = null;
        try {
            const response = await PaymentApi.getAll() as PaginatedResponse;
            console.log('📦 API response for fetchPayments:', response);
            payments.value = response.results;
            pagination.value = response.paging;
            console.log('✅ Updated payments after fetch:', payments.value);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al cargar los pagos';
            console.error('❌ Error fetching payments:', e);
        } finally {
            loading.value = false;
        }
    }

    async function createPayment(payload: PaymentRequest) {
        console.log('➕ Creating new payment with payload:', payload);
        console.log('Current payments before create:', payments.value);
        try {
            const payment = await PaymentApi.pull(payload);
            console.log('📦 API response for createPayment:', payment);
            const newPayments = [payment, ...(Array.isArray(payments.value) ? payments.value : [])];
            console.log('🔄 New payments array before assignment:', newPayments);
            payments.value = newPayments;
            console.log('✅ Updated payments after create:', payments.value);
            return payment;
        } catch (e) {
            console.error('❌ Error creating payment:', e);
            throw e;
        }
    }

    async function confirmPayment(uuid: string, cardId?: string) {
        console.log('✅ Confirming payment with uuid:', uuid, 'cardId:', cardId);
        console.log('Current payments before confirm:', payments.value);
        try {
            await PaymentApi.push(uuid, cardId);
            console.log('📦 Payment confirmed successfully');
            await fetchPayments();
            console.log('✅ Payments refreshed after confirmation:', payments.value);
        } catch (e) {
            console.error('❌ Error confirming payment:', e);
            throw e;
        }
    }

    async function transferToEmail(email: string, payload: PaymentRequest, cardId?: string) {
        console.log('📧 Transferring to email:', email, 'payload:', payload, 'cardId:', cardId);
        console.log('Current payments before transfer:', payments.value);
        try {
            const payment = await PaymentApi.transferByEmail(email, payload, cardId);
            console.log('📦 API response for transferToEmail:', payment);
            const newPayments = [payment, ...(Array.isArray(payments.value) ? payments.value : [])];
            console.log('🔄 New payments array before assignment:', newPayments);
            payments.value = newPayments;
            console.log('✅ Updated payments after transfer:', payments.value);
            return payment;
        } catch (e) {
            console.error('❌ Error transferring by email:', e);
            throw e;
        }
    }

    async function transferToCvu(cvu: string, payload: PaymentRequest, cardId?: string) {
        console.log('💳 Transferring to CVU:', cvu, 'payload:', payload, 'cardId:', cardId);
        console.log('Current payments before transfer:', payments.value);
        try {
            const payment = await PaymentApi.transferByCVU(cvu, payload, cardId);
            console.log('📦 API response for transferToCvu:', payment);
            const newPayments = [payment, ...(Array.isArray(payments.value) ? payments.value : [])];
            console.log('🔄 New payments array before assignment:', newPayments);
            payments.value = newPayments;
            console.log('✅ Updated payments after transfer:', payments.value);
            return payment;
        } catch (e) {
            console.error('❌ Error transferring by CVU:', e);
            throw e;
        }
    }

    async function transferToAlias(alias: string, payload: PaymentRequest, cardId?: string) {
        console.log('🏷️ Transferring to alias:', alias, 'payload:', payload, 'cardId:', cardId);
        console.log('Current payments before transfer:', payments.value);
        try {
            const payment = await PaymentApi.transferByAlias(alias, payload, cardId);
            console.log('📦 API response for transferToAlias:', payment);
            const newPayments = [payment, ...(Array.isArray(payments.value) ? payments.value : [])];
            console.log('🔄 New payments array before assignment:', newPayments);
            payments.value = newPayments;
            console.log('✅ Updated payments after transfer:', payments.value);
            return payment;
        } catch (e) {
            console.error('❌ Error transferring by alias:', e);
            throw e;
        }
    }

    async function createDeposit(amount: number) {
        console.log('💰 Creating deposit with amount:', amount);
        console.log('Current payments before deposit:', payments.value);
        loading.value = true;
        error.value = null;
        try {
            const payment = await PaymentApi.createDeposit(amount);
            console.log('📦 API response for createDeposit:', payment);
            const newPayments = [payment, ...(Array.isArray(payments.value) ? payments.value : [])];
            console.log('🔄 New payments array before assignment:', newPayments);
            payments.value = newPayments;
            console.log('✅ Updated payments after deposit:', payments.value);
            return payment;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al crear el depósito';
            console.error('❌ Error creating deposit:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function pushDeposit(paymentId: number) {
        console.log('📤 Pushing deposit with ID:', paymentId);
        console.log('Current payments before push:', payments.value);
        loading.value = true;
        error.value = null;
        try {
            const updatedPayment = await PaymentApi.completeDeposit(paymentId);
            console.log('📦 API response for pushDeposit:', updatedPayment);
            const index = payments.value.findIndex(p => p.id === paymentId);
            console.log('🔍 Found payment at index:', index);
            if (index !== -1) {
                payments.value[index] = updatedPayment;
                console.log('✅ Updated payments after push:', payments.value);
            }
            return updatedPayment;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error al completar el depósito';
            console.error('❌ Error pushing deposit:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    return {
        payments,
        loading,
        error,
        pagination,
        fetchPayments,
        createPayment,
        confirmPayment,
        transferToEmail,
        transferToCvu,
        transferToAlias,
        createDeposit,
        pushDeposit
    };
});