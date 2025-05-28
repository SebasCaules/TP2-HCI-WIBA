<template>
    <v-container class="create-payment-container">
        <v-form @submit.prevent="handleSubmit" ref="form" class="create-payment-form">
            <div class="form-content">
                <div class="transfer-form-group">
                    <CustomTextField
                        v-model="form.description"
                        placeholder="Descripción"
                        :rules="[(v: string) => !!v || 'La descripción es obligatoria']"
                        required
                        class="transfer-reason-input"
                    />
                </div>
                <div class="transfer-form-group">
                    <CustomTextField
                        v-model.number="form.amount"
                        placeholder="Monto"
                        type="number"
                        :rules="[
                            (v: number) => !!v || 'El monto es obligatorio',
                            (v: number) => v > 0 || 'El monto debe ser mayor a 0'
                        ]"
                        required
                        class="transfer-amount-input"
                    />
                </div>
                <FilledButton
                    type="submit"
                    :loading="loading"
                    :disabled="loading"
                    class="transfer-continue-btn"
                >
                    Generar Cobro
                </FilledButton>
            </div>
        </v-form>
        <!-- Payment Result Section -->
        <v-expand-transition>
            <div v-if="payment" class="payment-result pa-4 text-center">
                <SuccessDialog
                    v-model="showSuccessDialog"
                    title="¡Cobro generado exitosamente!"
                    message="El cobro ha sido generado correctamente. Comparte el siguiente código con quien desees que te pague:"
                />
                <v-card class="mb-4 payment-details-card">
                    <v-card-text>
                        <div class="uuid-label-row">
                            <span class="uuid-label-text">Código de Cobro</span>
                            <v-btn icon @click="copyUuid" :loading="copying" size="small" class="uuid-copy-btn">
                                <v-icon>mdi-content-copy</v-icon>
                            </v-btn>
                        </div>
                        <div class="uuid-display pa-2 mb-2">{{ payment.uuid }}</div>
                    </v-card-text>
                </v-card>
                <v-card class="payment-details-card">
                    <v-card-text>
                        <div class="payment-details-title">Detalles del Cobro</div>
                        <div class="payment-detail-row">
                            <span class="payment-detail-label">Monto:</span>
                            <span class="payment-detail-value">${{ payment.amount }}</span>
                        </div>
                        <div class="payment-detail-row">
                            <span class="payment-detail-label">Descripción:</span>
                            <span class="payment-detail-value">{{ payment.description }}</span>
                        </div>
                        <div class="payment-detail-row">
                            <span class="payment-detail-label">Estado:</span>
                            <v-chip :color="payment.pending ? 'warning' : 'success'" size="small">
                                {{ payment.pending ? 'Pendiente' : 'Completado' }}
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </v-expand-transition>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePaymentStore } from '@/stores/paymentStore';
import FilledButton from '@/components/ui/FilledButton.vue';
import CustomTextField from '@/components/ui/CustomTextField.vue';
import SuccessDialog from '@/components/ui/SuccessDialog.vue';
import type { Payment } from '@/api/payment';

const paymentStore = usePaymentStore();
const form = ref({
    description: '',
    amount: 0
});

const loading = ref(false);
const copying = ref(false);
const payment = ref<Payment | null>(null);
const showSuccessDialog = ref(false);

const formError = computed(() => {
    if (!form.value.description || form.value.description.length > 256) {
        return 'La descripción es obligatoria y debe tener hasta 256 caracteres.';
    }
    if (form.value.amount <= 0) {
        return 'El monto debe ser mayor a 0.';
    }
    if (!/^\d+(\.\d{1,4})?$/.test(form.value.amount.toString())) {
        return 'El monto no puede tener más de 4 decimales.';
    }
    return '';
});

async function handleSubmit() {
    loading.value = true;
    try {
        const result = await paymentStore.createPayment({
            description: form.value.description,
            amount: form.value.amount
        });
        payment.value = result;
        showSuccessDialog.value = true;
    } catch (error) {
        console.error('Error creating payment:', error);
    } finally {
        loading.value = false;
    }
}

async function copyUuid() {
    if (!payment.value?.uuid) return;
    
    copying.value = true;
    try {
        await navigator.clipboard.writeText(payment.value.uuid);
    } catch (error) {
        console.error('Error copying UUID:', error);
    } finally {
        copying.value = false;
    }
}
</script>

<style scoped>
.create-payment-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 0;
    font-family: var(--font-family);
}

.create-payment-title {
    font-size: 2rem;
    font-weight: 800;
    text-align: center;
    margin-bottom: 2.2rem;
    font-family: var(--font-sans), sans-serif;
    color: var(--text);
}

.create-payment-form {
    width: 100%;
}

.form-content {
    padding: 0 !important;
}

.transfer-form-group {
    margin-bottom: 1rem;
    width: 100%;
    max-width: 400px;
}

.transfer-form-group:last-of-type {
    margin-bottom: 0;
}

.transfer-recipient-input,
.transfer-amount-input,
.transfer-reason-input {
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
}

:deep(.v-text-field),
:deep(.v-field),
:deep(.v-field__input) {
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
}

.transfer-continue-btn {
    margin-top: 1.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    height: 50px;
    width: 100%;
    max-width: 400px;
    align-self: center;
}

.payment-result {
    width: 100%;
    text-align: center;
}

.payment-details-card {
    width: 400px;
    max-width: 100vw;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    border-radius: 8px;
    background-color: var(--card);
    /* border: 1px solid blue; // for debugging */
}

.uuid-display {
    background-color: var(--background);
    border-radius: 8px;
    font-family: monospace;
    word-break: break-all;
    text-align: center;
    font-size: 1.2rem;
    padding: 1rem;
    border: 1px solid var(--border-color);
}

.payment-details-title {
    text-align: center;
    font-size: 1.15rem;
    font-weight: 500;
    margin-bottom: 1.2rem;
    font-family: var(--font-family);
}

.payment-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.2rem;
    padding: 0 1rem;
}
.payment-detail-row:last-child {
    margin-bottom: 0;
}

.payment-detail-label {
    font-size: 1rem;
    font-weight: 500;
    font-family: var(--font-family);
}

.payment-detail-value {
    font-size: 1rem;
    font-weight: 400;
    font-family: var(--font-family);
    text-align: right;
}

.uuid-label-row {
    position: relative;
    text-align: center;
    margin-bottom: 0.5rem;
    min-height: 40px;
}

.uuid-label-text {
    display: inline-block;
    font-size: 1.15rem;
    font-weight: 500;
    line-height: 40px;
}

.uuid-copy-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    margin: 0;
}
</style>