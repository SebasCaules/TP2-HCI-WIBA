<template>
    <v-container class="pay-payment-container">
        <v-card class="pay-payment-card">
            <v-card-title class="text-h5 mb-4 text-center"
                >Pagar un cobro</v-card-title
            >

            <v-form
                @submit.prevent="handleSubmit"
                ref="form"
                class="pay-payment-form"
            >
                <v-card-text class="form-content">
                    <ErrorDialog v-model="showErrorDialog" title="Error de Pago" message="El pago debe ser realizado con otro usuario." />
                    <CustomTextField
                        v-model="uuid"
                        label="Código de Cobro"
                        :rules="[(v: string) => !!v || 'El código de cobro es obligatorio']"
                        required
                        class="mb-4"
                        :loading="loading"
                    />

                    <PaymentMethodSelector
                        :selectedPaymentMethod="selectedPaymentMethod"
                        :selectedCard="selectedCard"
                        :accountBalance="accountBalance"
                        :cards="cards"
                        @update:selectedPaymentMethod="
                            selectedPaymentMethod = $event
                        "
                        @update:selectedCard="selectedCard = $event"
                        @add-card="showAddCardDialog = true"
                    />
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
                            <div class="text-subtitle-1 mb-4">
                                Detalles del Pago
                            </div>

                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Monto:</span>
                                <span class="text-h6"
                                    >${{ paymentDetails?.amount }}</span
                                >
                            </div>

                            <div class="payment-detail-row">
                                <span class="text-subtitle-2"
                                    >Descripción:</span
                                >
                                <span>{{ paymentDetails?.description }}</span>
                            </div>

                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Receptor:</span>
                                <span
                                    >{{ paymentDetails?.receiver?.firstName }}
                                    {{
                                        paymentDetails?.receiver?.lastName
                                    }}</span
                                >
                            </div>

                            <div class="payment-detail-row">
                                <span class="text-subtitle-2">Estado:</span>
                                <v-chip
                                    :color="
                                        paymentDetails?.pending
                                            ? 'warning'
                                            : 'success'
                                    "
                                    size="small"
                                >
                                    {{
                                        paymentDetails?.pending
                                            ? "Pendiente"
                                            : "Completado"
                                    }}
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
import { ref, onMounted, computed } from "vue";
import { usePaymentStore } from "@/stores/paymentStore";
import { useCardsStore } from "@/stores/cardsStore";
import FilledButton from "@/components/ui/FilledButton.vue";
import CustomTextField from "@/components/ui/CustomTextField.vue";
import SuccessDialog from "@/components/ui/SuccessDialog.vue";
import PaymentMethodSelector from "@/components/payment/PaymentMethodSelector.vue";
import type { Payment } from "@/api/payment";
import ErrorDialog from '@/components/dialogs/ErrorDialog.vue';


const props = defineProps<{
    initialUuid?: string;
}>();

const paymentStore = usePaymentStore();
const cardsStore = useCardsStore();

interface DisplayCard {
    id: string;
    number_last4: string;
    brand: string;
    logo: string;
    expiry: string;
    holder: string;
}

const uuid = ref(props.initialUuid || "");
const loading = ref(false);
const selectedPaymentMethod = ref<"account" | "card">("account");
const selectedCard = ref<DisplayCard | null>(null);
const paymentSuccess = ref(false);
const paymentDetails = ref<Payment | null>(null);
const showAddCardDialog = ref(false);
const accountBalance = ref(12000); // reemplaza con store real si existe
const showErrorDialog = ref(false);

onMounted(async () => {
    // If we have an initial UUID, set it
    if (props.initialUuid) {
        uuid.value = props.initialUuid;
    }
    // Fetch available cards
    await fetchCards();
});

const cards = computed<DisplayCard[]>(() => {
    if (!cardsStore.cards) return [];
    return cardsStore.cards.map((card) => {
        const last4 = card.number.match(/\d{4}$/)?.[0] || "";
        return {
            id: String(card.id),
            brand: card.metadata?.brand || getCardBrand(card.number),
            number_last4: last4,
            expiry: card.expirationDate,
            holder: card.fullName,
            logo: getBrandLogo(
                card.metadata?.brand || getCardBrand(card.number)
            ),
        };
    });
});

function getCardBrand(number: string) {
    const n = number.replace(/\D/g, "");
    if (n.startsWith("4")) return "Visa";
    if (n.startsWith("5") || n.startsWith("2")) return "Mastercard";
    if (n.startsWith("3")) return "Amex";
    return "Desconocida";
}

function getBrandLogo(brand: string) {
    if (brand === "Visa")
        return "https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png";
    if (brand === "Mastercard")
        return "https://brandlogos.net/wp-content/uploads/2021/11/mastercard-logo.png";
    if (brand === "Amex")
        return "https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg";
    return "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
}

async function fetchCards() {
    try {
        await cardsStore.fetchCards();
    } catch (error) {
        console.error("Error fetching cards:", error);
    }
}

async function handleSubmit() {
    if (!uuid.value) return;

    loading.value = true;
    try {
        const response = await paymentStore.confirmPayment(
            uuid.value,
            selectedPaymentMethod.value === "card" && selectedCard.value
                ? selectedCard.value.id
                : undefined
        );
        paymentSuccess.value = true;
        paymentDetails.value = response;
        // Reset form after successful payment
        uuid.value = "";
        selectedPaymentMethod.value = "account";
        selectedCard.value = cards.value.length > 0 ? cards.value[0] : null;
        showErrorDialog.value = false; // Hide error dialog on success
    } catch (error) {
        const err = error as { code: number; description: string };
        if (err.code === 422 && err.description === "Payment must be pushed with another user.") {
            showErrorDialog.value = true;
        } else {
            console.error("Error confirming payment:", error);
        }
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
