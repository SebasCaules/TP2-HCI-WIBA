<template>
    <v-container class="create-payment-container">
        <v-card class="create-payment-card">
            <v-card-title class="text-h5 mb-4">Cobrar un producto o servicio</v-card-title>
            
            <v-form @submit.prevent="handleSubmit" ref="form">
                <v-card-text>
                    <v-text-field
                        v-model="form.description"
                        label="Descripción (opcional)"
                        variant="outlined"
                        class="mb-4"
                    />
                    
                    <v-text-field
                        v-model.number="form.amount"
                        label="Monto"
                        type="number"
                        variant="outlined"
                        :rules="[v => !!v || 'El monto es obligatorio', v => v > 0 || 'El monto debe ser mayor a 0']"
                        required
                        class="mb-4"
                    />
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <FilledButton
                        type="submit"
                        :loading="loading"
                        :disabled="loading"
                    >
                        Generar Pago
                    </FilledButton>
                </v-card-actions>
            </v-form>

            <!-- Payment Result Section -->
            <v-expand-transition>
                <div v-if="paymentUuid" class="payment-result pa-4">
                    <v-divider class="mb-4" />
                    
                    <div class="text-center mb-4">
                        <div class="text-subtitle-1 mb-2">UUID del Pago</div>
                        <div class="uuid-display pa-2 mb-2">{{ paymentUuid }}</div>
                        <v-btn
                            variant="text"
                            @click="copyPaymentLink"
                            class="mb-2"
                        >
                            <v-icon left>mdi-content-copy</v-icon>
                            Copiar Link
                        </v-btn>
                    </div>

                    <div class="text-center">
                        <div class="text-subtitle-1 mb-2">Código QR</div>
                        <div class="qr-container">
                            <img :src="qrCodeUrl" alt="QR Code" />
                        </div>
                    </div>
                </div>
            </v-expand-transition>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePaymentStore } from '@/stores/paymentStore';
import FilledButton from '@/components/ui/FilledButton.vue';
import QRCode from 'qrcode';

const paymentStore = usePaymentStore();
const form = ref({
    description: '',
    amount: 0,
    metadata: {}
});

const loading = ref(false);
const paymentUuid = ref('');
const paymentLink = ref('');
const qrCodeUrl = ref('');

async function handleSubmit() {
    loading.value = true;
    try {
        const payment = await paymentStore.createPayment({
            description: form.value.description,
            amount: form.value.amount,
            metadata: form.value.metadata
        });
        
        paymentUuid.value = payment.uuid || '';
        paymentLink.value = `${window.location.origin}/dashboard/pagos?uuid=${payment.uuid}`;
        
        // Generate QR code
        qrCodeUrl.value = await QRCode.toDataURL(paymentLink.value, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    } catch (error) {
        console.error('Error creating payment:', error);
    } finally {
        loading.value = false;
    }
}

function copyPaymentLink() {
    navigator.clipboard.writeText(paymentLink.value);
}
</script>

<style scoped>
.create-payment-container {
    max-width: 600px;
    margin: 0 auto;
}

.create-payment-card {
    padding: 1rem;
}

.uuid-display {
    background-color: var(--background);
    border-radius: 4px;
    font-family: monospace;
    word-break: break-all;
}

.qr-container {
    display: flex;
    justify-content: center;
    padding: 1rem;
    background-color: white;
    border-radius: 4px;
    margin: 0 auto;
    max-width: 200px;
}

.qr-container img {
    width: 100%;
    height: auto;
}
</style> 