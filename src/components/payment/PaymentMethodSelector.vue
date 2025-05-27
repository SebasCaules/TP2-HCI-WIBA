<template>
    <div>
        <!-- Payment Method Selection Button -->
        <button
            type="button"
            class="deposit-method-box"
            @click="showPaymentMethodDialog = true"
        >
            <template v-if="selectedPaymentMethod === 'account'">
                <v-icon color="primary" class="deposit-method-icon"
                    >mdi-wallet</v-icon
                >
                <span class="deposit-method-text">
                    <b>Saldo de la cuenta</b>
                </span>
            </template>
            <template v-else-if="selectedCard">
                <img
                    :src="selectedCard?.logo"
                    :alt="selectedCard?.brand"
                    class="deposit-card-logo"
                />
                <span class="deposit-method-text">
                    <b>{{ selectedCard.brand }}</b> *{{
                        selectedCard.number_last4
                    }}
                </span>
            </template>
            <template v-else>
                <span class="deposit-method-text">
                    Selecciona un método de pago
                </span>
            </template>
            <v-icon class="deposit-select-icon"
                >mdi-chevron-right</v-icon
            >
        </button>

        <!-- Payment Method Selection Dialog -->
        <v-dialog
            v-model="showPaymentMethodDialog"
            max-width="960px"
            :retain-focus="false"
            :scrim="true"
        >
            <v-card class="select-card-dialog">
                <div class="select-card-dialog-header">
                    <span class="select-card-title"
                        >Seleccionar método de pago</span
                    >
                    <v-btn
                        icon
                        class="dialog-close-btn"
                        @click="showPaymentMethodDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                <div class="select-card-list-custom">
                    <!-- Account Balance Option -->
                    <div
                        class="select-card-custom"
                        :class="{
                            selected: selectedPaymentMethod === 'account',
                        }"
                        @click="selectPaymentMethod('account')"
                    >
                        <v-icon
                            color="primary"
                            size="32"
                            class="select-card-icon"
                            >mdi-wallet</v-icon
                        >
                        <div class="select-card-info">
                            <div class="select-card-brand">
                                Saldo de la cuenta
                            </div>
                            <div class="select-card-balance">
                                Saldo disponible: {{ formatNumber(accountBalance) }}
                            </div>
                        </div>
                        <v-icon
                            v-if="selectedPaymentMethod === 'account'"
                            color="primary"
                            class="select-card-check"
                            >mdi-check-circle</v-icon
                        >
                    </div>
                    <!-- Cards -->
                    <template v-if="cards.length > 0">
                        <div
                            v-for="card in cards"
                            :key="card.id"
                            class="select-card-custom"
                            :class="{
                                selected:
                                    selectedCard && selectedCard.id === card.id,
                            }"
                            @click="selectCard(card)"
                        >
                            <img
                                :src="card.logo"
                                :alt="card.brand"
                                class="select-card-logo"
                            />
                            <div class="select-card-info">
                                <div class="select-card-brand">
                                    {{ card.brand }} *{{ card.number_last4 }}
                                </div>
                                <div class="select-card-expiry">
                                    Vence {{ card.expiry }}
                                </div>
                            </div>
                            <v-icon
                                v-if="
                                    selectedCard && selectedCard.id === card.id
                                "
                                color="primary"
                                class="select-card-check"
                                >mdi-check-circle</v-icon
                            >
                        </div>
                    </template>
                    <div v-if="cards.length === 0" class="no-cards-message">
                        <v-icon size="48" color="primary"
                            >mdi-credit-card-outline</v-icon
                        >
                        <div class="no-cards-title">
                            No tienes tarjetas guardadas
                        </div>
                        <div class="no-cards-subtitle">
                            Agrega una tarjeta para realizar transferencias
                        </div>
                    </div>
                </div>
                <v-card-actions class="select-card-actions">
                    <FilledButton
                        class="add-card-btn"
                        @click="$emit('add-card')"
                    >
                        Agregar tarjeta
                    </FilledButton>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import FilledButton from "@/components/ui/FilledButton.vue";
import { useAccountStore } from "@/stores/accountStore";

interface DisplayCard {
    id: string;
    brand: string;
    number_last4: string;
    expiry: string;
    holder: string;
    logo: string;
}

interface Props {
    selectedPaymentMethod: "account" | "card";
    selectedCard: DisplayCard | null;
    accountBalance: number;
    cards: DisplayCard[];
}

interface Emits {
    (e: "update:selectedPaymentMethod", value: "account" | "card"): void;
    (e: "update:selectedCard", value: DisplayCard | null): void;
    (e: "add-card"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const accountStore = useAccountStore();

const accountBalance = computed(() => {
    return accountStore.account?.balance || 0;
});

const showPaymentMethodDialog = ref(false);

function formatNumber(value: number) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function selectPaymentMethod(method: "account" | "card") {
    emit("update:selectedPaymentMethod", method);
    if (method === "account") {
        emit("update:selectedCard", null);
    }
    showPaymentMethodDialog.value = false;
}

function selectCard(card: DisplayCard) {
    emit("update:selectedCard", card);
    emit("update:selectedPaymentMethod", "card");
    showPaymentMethodDialog.value = false;
}
</script>

<style scoped>
.deposit-method-box {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    background: transparent;
    height: 48px;
    padding: 0 1.1rem;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.18s;
    font-size: 1.06rem;
    font-family: var(--font-sans, sans-serif);
    cursor: pointer;
    outline: none;
    gap: 0.8rem;
}

.deposit-method-box:hover,
.deposit-method-box:focus {
    border-color: var(--primary);
}

.deposit-card-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
    display: flex;
    align-items: center;
}

.deposit-method-icon {
    font-size: 24px;
}

.deposit-method-text {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text);
    flex: 1;
    font-family: var(--font-sans), sans-serif;
    display: flex;
    align-items: center;
    height: 100%;
}

.deposit-select-icon {
    color: var(--muted-text);
    margin-left: auto;
    display: flex;
    align-items: center;
    height: 100%;
}

.select-card-dialog {
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: var(--shadow-card);
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 3rem;
}

.select-card-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
}

.select-card-title {
    font-size: 1.4rem;
    font-weight: 700;
    font-family: var(--font-sans), sans-serif;
}

.select-card-list-custom {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
    margin: 1.5rem 0;
    width: 100%;
    padding-right: 0.5rem;
}

.select-card-custom {
    width: 100%;
    display: flex;
    align-items: center;
    background: var(--input);
    border-radius: 14px;
    border: 2px solid var(--card-border);
    padding: 1rem 1.5rem;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    position: relative;
}

.select-card-custom.selected {
    border-color: var(--primary);
    background: var(--muted);
}

.select-card-custom:hover {
    border-color: var(--primary);
    background: var(--card);
}

.select-card-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
    margin-right: 1.5rem;
}

.select-card-icon {
    margin-right: 1.5rem;
}

.select-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.select-card-brand {
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.select-card-balance,
.select-card-expiry {
    font-size: 1rem;
    color: var(--muted-text);
    margin-top: 0.2rem;
}

.select-card-check {
    font-size: 1.8rem;
    margin-left: 1.5rem;
}

.select-card-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1.5rem 0 0 0;
}

.add-card-btn {
    min-width: 200px;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 1.5rem;
    padding: 0.8rem 2rem;
}

.no-cards-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    background: #f8fafc;
    border-radius: 14px;
    border: 2px dashed #e0e0e0;
    width: 100%;
    gap: 1rem;
}

.no-cards-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    font-family: var(--font-sans), sans-serif;
}

.no-cards-subtitle {
    font-size: 1.05rem;
    color: var(--muted-text);
    font-family: var(--font-sans), sans-serif;
}

.dialog-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
}
</style>