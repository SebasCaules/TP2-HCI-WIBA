<template>
    <v-container class="create-payment-container">
        <v-card class="create-payment-card">
            <v-card-title class="text-h5 mb-4 text-center">Cobrar un producto o servicio</v-card-title>
            
            <v-form @submit.prevent="handleSubmit" ref="form" class="create-payment-form">
                <v-card-text class="form-content">
                    <CustomTextField
                        v-model="form.description"
                        label="Descripción"
                        :rules="[(v: string) => !!v || 'La descripción es obligatoria']"
                        required
                        class="mb-4"
                    />
                    
                    <CustomTextField
                        v-model.number="form.amount"
                        label="Monto"
                        type="number"
                        :rules="[
                            (v: number) => !!v || 'El monto es obligatorio',
                            (v: number) => v > 0 || 'El monto debe ser mayor a 0'
                        ]"
                        required
                        class="mb-4"
                    />
                </v-card-text>

                <v-card-actions class="form-actions">
                    <div v-if="formError" class="text-error text-center mb-2">
                        {{ formError }}
                    </div>
                    <FilledButton
                        type="submit"
                        :loading="loading"
                        :disabled="loading || !!formError"
                    >
                        Generar Cobro
                    </FilledButton>
                </v-card-actions>
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
                            <div class="text-subtitle-1 mb-2">Código de Cobro</div>
                            <div class="uuid-display pa-2 mb-2">{{ payment.uuid }}</div>
                            <FilledButton
                                block
                                @click="copyUuid"
                                :loading="copying"
                            >
                                <v-icon start>mdi-content-copy</v-icon>
                                Copiar Código
                            </FilledButton>
                        </v-card-text>
                    </v-card>

                    <v-card class="payment-details-card">
                        <v-card-text>
                            <div class="text-subtitle-1 mb-4">Detalles del Cobro</div>
                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Monto:</span>
                                <span class="text-h6">${{ payment.amount }}</span>
                            </div>
                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Descripción:</span>
                                <span>{{ payment.description }}</span>
                            </div>
                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Estado:</span>
                                <v-chip
                                    :color="payment.pending ? 'warning' : 'success'"
                                    size="small"
                                >
                                    {{ payment.pending ? 'Pendiente' : 'Completado' }}
                                </v-chip>
                            </div>
                        </v-card-text>
                    </v-card>
                </div>
            </v-expand-transition>
        </v-card>
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
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    font-family: var(--font-family);
}

.create-payment-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.create-payment-form {
    width: 100%;
}

.form-content {
    padding: 2.5rem !important;
}

.form-actions {
    padding: 0 2.5rem 2.5rem !important;
    justify-content: center;
}

.payment-details-card {
    border-radius: 8px;
    background-color: var(--card);
    width: 100%;
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

.payment-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0 1rem;
}

.payment-detail-row:last-child {
    margin-bottom: 0;
}

:deep(.v-card-title) {
    font-family: var(--font-family);
    font-weight: 600;
}

:deep(.v-card-text) {
    font-family: var(--font-family);
}

:deep(.text-subtitle-1),
:deep(.text-subtitle-2) {
    font-family: var(--font-family);
}

:deep(.v-text-field) {
    width: 100%;
}
</style>