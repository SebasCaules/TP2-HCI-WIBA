<template>
    <v-container class="pay-payment-container">
        <v-card class="pay-payment-card">
            <v-card-title class="text-h5 mb-4 text-center">Pagar un cobro</v-card-title>
            
            <v-form @submit.prevent="handleSubmit" ref="form" class="pay-payment-form">
                <v-card-text class="form-content">
                    <CustomTextField
                        v-model="uuid"
                        label="Código de Cobro"
                        :rules="[(v: string) => !!v || 'El código de cobro es obligatorio']"
                        required
                        class="mb-4"
                        :loading="loading"
                    />

                    <!-- Payment Method Selection -->
                    <div class="payment-method mb-4">
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
                                    :rules="[v => !!v || 'Debe seleccionar una tarjeta']"
                                    required
                                />
                            </div>
                        </v-expand-transition>
                    </div>
                </v-card-text>

                <v-card-actions class="form-actions">
                    <FilledButton
                        type="submit"
                        :loading="loading"
                        :disabled="loading"
                    >
                        Confirmar Pago
                    </FilledButton>
                </v-card-actions>
            </v-form>

            <!-- Success Alert and Payment Details -->
            <v-expand-transition>
                <div v-if="paymentSuccess" class="pa-4 text-center">
                    <SuccessDialog
                        v-model="paymentSuccess"
                        title="¡Pago realizado exitosamente!"
                        message="El pago ha sido procesado correctamente."
                    />

                    <v-card class="payment-details-card mt-4">
                        <v-card-text>
                            <div class="text-subtitle-1 mb-4">Detalles del Pago</div>
                            
                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Monto:</span>
                                <span class="text-h6">${{ paymentDetails?.amount }}</span>
                            </div>

                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Descripción:</span>
                                <span>{{ paymentDetails?.description }}</span>
                            </div>

                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Receptor:</span>
                                <span>{{ paymentDetails?.receiver?.firstName }} {{ paymentDetails?.receiver?.lastName }}</span>
                            </div>

                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Estado:</span>
                                <v-chip
                                    :color="paymentDetails?.pending ? 'warning' : 'success'"
                                    size="small"
                                >
                                    {{ paymentDetails?.pending ? 'Pendiente' : 'Completado' }}
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
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePaymentStore } from '@/stores/paymentStore';
import { useCardsStore } from '@/stores/cardsStore';
import FilledButton from '@/components/ui/FilledButton.vue';
import CustomTextField from '@/components/ui/CustomTextField.vue';
import SuccessDialog from '@/components/ui/SuccessDialog.vue';
import type { Payment } from '@/api/payment';

const props = defineProps<{
    initialUuid?: string;
}>();

const route = useRoute();
const paymentStore = usePaymentStore();
const cardsStore = useCardsStore();

const uuid = ref(props.initialUuid || '');
const loading = ref(false);
const paymentMethod = ref('account');
const selectedCard = ref<string | null>(null);
const cards = ref<Array<{ id: string; last4: string }>>([]);
const paymentSuccess = ref(false);
const paymentDetails = ref<Payment | null>(null);

onMounted(async () => {
    // If we have an initial UUID, set it
    if (props.initialUuid) {
        uuid.value = props.initialUuid;
    }
    // Fetch available cards
    await fetchCards();
});

async function fetchCards() {
    try {
        await cardsStore.fetchCards();
        cards.value = cardsStore.cards.map(card => ({
            id: card.id.toString(),
            last4: card.number.slice(-4)
        }));
        if (cards.value.length > 0) {
            selectedCard.value = cards.value[0].id;
        }
    } catch (error) {
        console.error('Error fetching cards:', error);
    }
}

async function handleSubmit() {
    if (!uuid.value) return;
    
    loading.value = true;
    try {
        const response = await paymentStore.confirmPayment(
            uuid.value,
            paymentMethod.value === 'card' && selectedCard.value ? selectedCard.value : undefined
        );
        paymentSuccess.value = true;
        paymentDetails.value = response;
        // Reset form after successful payment
        uuid.value = '';
        paymentMethod.value = 'account';
        selectedCard.value = cards.value.length > 0 ? cards.value[0].id : null;
    } catch (error) {
        console.error('Error confirming payment:', error);
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.pay-payment-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    font-family: var(--font-family);
}

.pay-payment-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pay-payment-form {
    width: 100%;
}

.form-content {
    padding: 2.5rem !important;
}

.form-actions {
    padding: 0 2.5rem 2.5rem !important;
    justify-content: center;
}

.payment-method {
    background-color: var(--background);
    border-radius: 8px;
    width: 100%;
    text-align: center;
}

.card-selection {
    margin-top: 1rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.payment-details-card {
    border-radius: 8px;
    background-color: var(--card);
    width: 100%;
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

:deep(.v-radio-group) {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

:deep(.v-radio) {
    margin: 0.5rem 0;
    width: auto;
}

:deep(.v-text-field),
:deep(.v-select) {
    width: 100%;
    max-width: 400px;
}
</style> 