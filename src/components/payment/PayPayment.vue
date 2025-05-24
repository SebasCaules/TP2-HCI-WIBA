<template>
    <v-container class="pay-payment-container">
        <v-card class="pay-payment-card">
            <v-card-title class="text-h5 mb-4">Pagar un producto o servicio</v-card-title>
            
            <v-form @submit.prevent="handleSubmit" ref="form">
                <v-card-text>
                    <v-text-field
                        v-model="uuid"
                        label="UUID del Pago"
                        variant="outlined"
                        :rules="[v => !!v || 'El UUID es obligatorio']"
                        required
                        class="mb-4"
                        :loading="loading"
                        :disabled="loading || !!payment"
                    >
                        <template v-slot:append>
                            <v-btn
                                v-if="!payment"
                                icon
                                @click="fetchPayment"
                                :loading="loading"
                                :disabled="!uuid"
                            >
                                <v-icon>mdi-magnify</v-icon>
                            </v-btn>
                        </template>
                    </v-text-field>

                    <!-- Payment Details -->
                    <v-expand-transition>
                        <div v-if="payment" class="payment-details mb-4">
                            <v-card variant="outlined" class="pa-4">
                                <div class="text-subtitle-1 mb-2">Detalles del Pago</div>
                                <div class="d-flex justify-space-between mb-2">
                                    <span>Descripción:</span>
                                    <span>{{ payment.description || 'Sin descripción' }}</span>
                                </div>
                                <div class="d-flex justify-space-between mb-2">
                                    <span>Monto:</span>
                                    <span>${{ payment.amount }}</span>
                                </div>
                                <div class="d-flex justify-space-between">
                                    <span>Estado:</span>
                                    <v-chip
                                        :color="payment.pending ? 'warning' : 'success'"
                                        size="small"
                                    >
                                        {{ payment.pending ? 'Pendiente de Pago' : 'Completado' }}
                                    </v-chip>
                                </div>
                            </v-card>
                        </div>
                    </v-expand-transition>

                    <!-- Payment Method Selection -->
                    <v-expand-transition>
                        <div v-if="payment && payment.pending" class="payment-method mb-4">
                            <div class="text-subtitle-1 mb-2">Método de Pago</div>
                            <v-radio-group v-model="paymentMethod" class="mb-4">
                                <v-radio
                                    label="Saldo en cuenta"
                                    value="account"
                                />
                                <v-radio
                                    label="Tarjeta"
                                    value="card"
                                />
                            </v-radio-group>

                            <v-expand-transition>
                                <div v-if="paymentMethod === 'card'" class="card-selection">
                                    <v-select
                                        v-model="selectedCard"
                                        :items="cards"
                                        item-title="last4"
                                        item-value="id"
                                        label="Seleccionar Tarjeta"
                                        variant="outlined"
                                    />
                                </div>
                            </v-expand-transition>
                        </div>
                    </v-expand-transition>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <FilledButton
                        type="submit"
                        :loading="loading"
                        :disabled="loading || !payment || !payment.pending"
                    >
                        Confirmar Pago
                    </FilledButton>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { usePaymentStore } from '@/stores/paymentStore';
import FilledButton from '@/components/ui/FilledButton.vue';
import type { Payment } from '@/api/payment';

const props = defineProps<{
    initialUuid?: string;
}>();

const route = useRoute();
const paymentStore = usePaymentStore();

const uuid = ref(props.initialUuid || '');
const loading = ref(false);
const payment = ref<Payment | null>(null);
const paymentMethod = ref('account');
const selectedCard = ref<string | null>(null);
const cards = ref<Array<{ id: string; last4: string }>>([]); // This would be populated from your cards store/API

// Watch for changes in the initialUuid prop
watch(() => props.initialUuid, (newUuid) => {
    if (newUuid) {
        uuid.value = newUuid;
        fetchPayment();
    }
});

onMounted(() => {
    // If we have an initial UUID, fetch the payment
    if (props.initialUuid) {
        fetchPayment();
    }
});

async function fetchPayment() {
    if (!uuid.value) return;
    
    loading.value = true;
    try {
        console.log('🔍 Fetching payment with UUID:', uuid.value);
        const response = await paymentStore.getPaymentByUuid(uuid.value);
        console.log('📦 Payment response:', response);
        payment.value = response;
        console.log('✅ Updated payment state:', payment.value);
    } catch (error) {
        console.error('❌ Error fetching payment:', error);
        payment.value = null;
    } finally {
        loading.value = false;
    }
}

async function handleSubmit() {
    if (!payment.value || !payment.value.pending) {
        console.log('⚠️ Cannot submit payment:', { 
            hasPayment: !!payment.value, 
            pending: payment.value?.pending 
        });
        return;
    }
    
    loading.value = true;
    try {
        console.log('💳 Confirming payment:', {
            uuid: payment.value.uuid,
            method: paymentMethod.value,
            cardId: selectedCard.value
        });
        await paymentStore.confirmPayment(
            payment.value.uuid!,
            paymentMethod.value === 'card' && selectedCard.value ? selectedCard.value : undefined
        );
        console.log('✅ Payment confirmed');
        // Actualizamos el estado del pago después de confirmarlo
        await fetchPayment();
    } catch (error) {
        console.error('❌ Error confirming payment:', error);
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.pay-payment-container {
    max-width: 600px;
    margin: 0 auto;
}

.pay-payment-card {
    padding: 1rem;
}

.payment-details {
    background-color: var(--background);
    border-radius: 4px;
}

.card-selection {
    padding: 1rem;
    background-color: var(--background);
    border-radius: 4px;
}
</style> 