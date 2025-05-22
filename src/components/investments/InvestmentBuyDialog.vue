<template>
    <v-dialog
        v-model="dialog"
        max-width="500px"
        :retain-focus="false"
        :scrim="true"
    >
        <v-card class="investment-dialog" width="100%">
            <div class="investment-header">
                <span class="investment-title">Realizar Inversión</span>
                <v-btn icon class="investment-close-btn" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <v-card-text style="padding-bottom: 0">
                <v-form v-model="isFormValid">
                    <v-select
                        v-model="selectedFund"
                        :items="fundOptions"
                        label="Seleccionar Fondo"
                        item-title="name"
                        item-value="id"
                        required
                        density="comfortable"
                        variant="underlined"
                    ></v-select>
                    <div class="investment-form">
                        <CustomTextField
                            v-model.number="investmentAmount"
                            label="Monto a invertir"
                            prefix="$"
                            type="number"
                            :rules="[
                                (v: number) => v > 0 || 'El monto debe ser mayor a 0',
                                (v: number) => v <= availableBalance || 'Saldo insuficiente',
                            ]"
                            required
                            @input="syncSharesFromAmount"
                            class="mb-4"
                        />

                        <CustomTextField
                            v-model.number="investmentShares"
                            label="Cantidad de cuotapartes"
                            type="number"
                            :rules="[
                                (v: number) => v > 0 || 'La cantidad debe ser mayor a 0',
                            ]"
                            required
                            @input="syncAmountFromShares"
                            class="mb-4"
                        />

                        <div class="mt-4">
                            <strong>Saldo disponible:</strong>
                            {{ formatMoney(availableBalance) }}
                        </div>
                    </div>
                </v-form>
            </v-card-text>
            <v-card-actions class="investment-actions">
                <FilledButton
                    class="btn-secondary"
                    @click="closeDialog"
                    >Cancelar</FilledButton
                >
                <FilledButton
                    class="investment-button"
                    color="primary"
                    :loading="isLoading"
                    :disabled="!isFormValid || isLoading"
                    @click="showConfirmDialog = true"
                    >Confirmar</FilledButton
                >
            </v-card-actions>
        </v-card>
    </v-dialog>

    <InvestmentConfirmDialog
        v-if="selectedStock"
        v-model="showConfirmDialog"
        mode="buy"
        :stock="selectedStock"
        :quantity="investmentShares"
        :total-amount="investmentAmount"
        :new-balance="availableBalance - investmentAmount"
        @confirm="handleInvestment"
    />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { type Stock } from "@/services/investments";
import CustomTextField from "@/components/ui/CustomTextField.vue";
import FilledButton from "@/components/ui/FilledButton.vue";
import InvestmentConfirmDialog from "./InvestmentConfirmDialog.vue";

const props = defineProps<{
    modelValue: boolean;
    fundOptions: { id: number; name: string }[];
    availableBalance: number;
    stocks: Stock[];
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (
        e: "invest",
        data: { amount: number; shares: number; stockId: number }
    ): void;
}>();

const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const isFormValid = ref(false);
const isLoading = ref(false);
const selectedFund = ref<number | null>(null);
const investmentAmount = ref(0);
const investmentShares = ref(0);
const showConfirmDialog = ref(false);

const selectedStock = computed(() => {
    if (!selectedFund.value) return null;
    return props.stocks.find(s => s.id === selectedFund.value) || null;
});

function formatMoney(value: number) {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

const syncSharesFromAmount = () => {
    if (!selectedFund.value) {
        investmentShares.value = 0;
        return;
    }
    const price =
        props.stocks.find((s) => s.id === selectedFund.value)?.current_price ||
        0;
    if (price > 0) {
        investmentShares.value = +(investmentAmount.value / price).toFixed(6);
    } else {
        investmentShares.value = 0;
    }
};

const syncAmountFromShares = () => {
    if (!selectedFund.value) {
        investmentAmount.value = 0;
        return;
    }
    const price =
        props.stocks.find((s) => s.id === selectedFund.value)?.current_price ||
        0;
    if (price > 0) {
        investmentAmount.value = +(investmentShares.value * price).toFixed(2);
    } else {
        investmentAmount.value = 0;
    }
};

watch(selectedFund, () => {
    investmentAmount.value = 0;
    investmentShares.value = 0;
});

const handleInvestment = () => {
    if (!selectedFund.value) return;

    emit("invest", {
        amount: investmentAmount.value,
        shares: investmentShares.value,
        stockId: selectedFund.value,
    });
};

const closeDialog = () => {
    dialog.value = false;
    selectedFund.value = null;
    investmentAmount.value = 0;
    investmentShares.value = 0;
    showConfirmDialog.value = false;
};
</script>

<style scoped>
.investment-dialog {
    padding: 2rem 3rem;
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.1);
    width: 100%;
    margin: 0 auto;
}
.investment-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    position: relative;
}
.investment-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    text-align: center;
    flex: 1;
}
.investment-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
    position: absolute;
    right: 0;
}
.investment-form {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}
.investment-actions {
    padding: 0.5rem 0 1.5rem 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}
.investment-button {
    min-width: 160px;
    max-width: 220px;
    width: 100%;
}
.investment-cancel-button {
    background: var(--secondary) !important;
    color: var(--secondary-foreground) !important;
    border: none;
}

:deep(.v-select) {
    width: 100%;
}

:deep(.v-field) {
    border: 1.5px solid #bdbdbd !important;
    border-radius: 12px !important;
    background: transparent !important;
    padding: 0 1.1rem !important;
    height: 50px !important;
    transition: border-color 0.18s !important;
}

:deep(.v-field:hover) {
    border-color: #9a9a9a !important;
}

:deep(.v-field--focused) {
    border-color: #489fb5 !important;
}

:deep(.v-field__input) {
    display: flex !important;
    align-items: center !important;
    font-size: 1.06rem !important;
    font-family: var(--font-sans, sans-serif) !important;
    font-weight: 400 !important;
    color: #424242 !important;
    padding: 0.2rem 0 !important;
    letter-spacing: 0.01em !important;
}

:deep(.v-select__selection) {
    display: flex !important;
    align-items: center !important;
}

:deep(.v-field__outline) {
    display: none !important;
}

:deep(.v-label) {
    font-size: 0.97rem !important;
    color: #757575 !important;
    font-weight: 400 !important;
    font-family: var(--font-sans, sans-serif) !important;
    letter-spacing: 0.01em !important;
}

:deep(.v-field--error) {
    border-color: #e53935 !important;
}

:deep(.v-field--error .v-label) {
    color: #e53935 !important;
}

:deep(.v-field--error .v-field__input) {
    color: #e53935 !important;
}

:deep(.v-field--disabled) {
    opacity: 0.7 !important;
    cursor: not-allowed !important;
}

/* Improve vertical alignment of selected item and dropdown icon in v-select */
:deep(.v-select__selection-text) {
    display: flex !important;
    align-items: center !important;
    height: 100% !important;
    line-height: normal !important;
}

/* Centrado vertical mejorado de la flecha del v-select */
:deep(.v-select__icon) {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 100% !important;
    position: absolute !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    right: 1rem !important;
}

:deep(.v-field__input) {
    display: flex !important;
    align-items: center !important;
    height: 100% !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}
</style>

<style scoped>
:deep(.v-field__append-inner) {
    padding-top: 0 !important;
    align-items: center !important;
}
</style>
