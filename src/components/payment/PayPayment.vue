<template>
    <v-container class="pay-payment-container">
        <v-form
            @submit.prevent="handleSubmit"
            ref="form"
            class="pay-payment-form"
        >
            <div class="form-content">
                <ErrorDialog
                    v-model="showErrorDialog"
                    :title="errorDialogTitle"
                    :message="errorDialogMessage"
                />
                <div class="pay-form-group">
                    <CustomTextField
                        v-model="uuid"
                        placeholder="Código de Cobro"
                        :rules="[(v: string) => !!v || 'El código de cobro es obligatorio']"
                        required
                        class="pay-uuid-input"
                        :loading="loading"
                    />
                </div>
                <div class="pay-form-group">
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
                </div>
                <FilledButton
                    type="submit"
                    :loading="loading"
                    :disabled="!isFormValid || loading"
                    class="pay-continue-btn"
                >
                    Confirmar Pago
                </FilledButton>
            </div>
        </v-form>

        <!-- Success Alert (dialog only) -->
        <SuccessDialog
            v-model="paymentSuccess"
            title="¡Pago realizado exitosamente!"
            message="El pago ha sido procesado correctamente."
        />

        <!-- Payment Details Card (always shown if paymentDetails exists) -->
        <v-expand-transition>
            <div v-if="paymentDetails" class="pa-4 payment-result">
                <v-card class="payment-details-card mt-4">
                    <v-card-text>
                        <div class="payment-details-title">
                            Detalles del Pago
                        </div>
                        <div class="payment-detail-row">
                            <span class="payment-detail-label">Monto:</span>
                            <span class="payment-detail-value"
                                >${{ paymentDetails.amount }}</span
                            >
                        </div>
                        <div class="payment-detail-row">
                            <span class="payment-detail-label"
                                >Descripción:</span
                            >
                            <span class="payment-detail-value">{{
                                paymentDetails.description
                            }}</span>
                        </div>
                        <div class="payment-detail-row">
                            <span class="payment-detail-label">Receptor:</span>
                            <span class="payment-detail-value">
                                {{ paymentDetails.receiver?.firstName }}
                                {{ paymentDetails.receiver?.lastName }}
                            </span>
                        </div>
                        <div class="payment-detail-row">
                            <span class="payment-detail-label">Estado:</span>
                            <v-chip
                                :color="
                                    paymentDetails.pending
                                        ? 'warning'
                                        : 'success'
                                "
                                size="small"
                            >
                                {{
                                    paymentDetails.pending
                                        ? "Pendiente"
                                        : "Completado"
                                }}
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </v-expand-transition>
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
import ErrorDialog from "@/components/dialogs/ErrorDialog.vue";

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
const errorDialogTitle = ref("Error de Pago");
const errorDialogMessage = ref("El pago debe ser realizado con otro usuario.");
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

const isFormValid = computed(() => {
    return uuid.value.trim() !== '';
});

async function handleSubmit() {
    console.log("Iniciando handleSubmit con UUID:", uuid.value);
    if (!uuid.value) return;

    loading.value = true;
    try {
        console.log(
            "Confirmando pago con método:",
            selectedPaymentMethod.value,
            "y tarjeta:",
            selectedCard.value?.id
        );
        const response = await paymentStore.confirmPayment(
            uuid.value,
            selectedPaymentMethod.value === "card" && selectedCard.value
                ? selectedCard.value.id
                : undefined
        );
        console.log("Pago confirmado exitosamente:", response);
        paymentSuccess.value = true;
        paymentDetails.value = response;
        // Reset form after successful payment
        uuid.value = "";
        selectedPaymentMethod.value = "account";
        selectedCard.value = cards.value.length > 0 ? cards.value[0] : null;
        showErrorDialog.value = false; // Hide error dialog on success
    } catch (error) {
        console.error("Error detectado:", error);
        const err = error as { code: number; description: string };
        console.log("Código de error:", err.code);
        console.log("Descripción de error:", err.description);
        if (
            err.code === 422 &&
            err.description === "Payment must be pushed with another user."
        ) {
            showErrorDialog.value = true;
            errorDialogTitle.value = "Error de Pago";
            errorDialogMessage.value =
                "El pago debe ser realizado con otro usuario.";
            console.log(
                "Mostrando ErrorDialog: ",
                errorDialogTitle.value,
                errorDialogMessage.value
            );
        } else if (
            err.code === 400 &&
            (err.description === "UUID not found" ||
                err.description === "Invalid payment uuid." ||
                err.description.toLowerCase().includes("uuid"))
        ) {
            showErrorDialog.value = true;
            errorDialogTitle.value = "Código inválido";
            errorDialogMessage.value =
                "El código de cobro ingresado no existe.";
            console.log(
                "Mostrando ErrorDialog: ",
                errorDialogTitle.value,
                errorDialogMessage.value
            );
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
    max-width: 400px;
    margin: 0 auto;
    padding: 0;
    font-family: var(--font-family);
}

.pay-payment-title {
    font-size: 2rem;
    font-weight: 800;
    text-align: center;
    margin-bottom: 2.2rem;
    font-family: var(--font-sans), sans-serif;
    color: var(--text);
}

.pay-payment-form {
    width: 100%;
}

.form-content {
    padding: 0 !important;
}

.pay-form-group {
    margin-bottom: 1rem;
    width: 100%;
    max-width: 400px;
}

.pay-form-group:last-of-type {
    margin-bottom: 0;
}

.pay-uuid-input {
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
}

:deep(.v-text-field),
:deep(.v-field),
:deep(.v-field__input),
:deep(.v-select) {
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
}

.pay-continue-btn {
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
    border-radius: 8px;
    background-color: var(--card);
    width: 400px;
    max-width: 100vw;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
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
</style>
