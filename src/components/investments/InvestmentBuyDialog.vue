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
                    <div class="investment-form">
                        <CustomTextField
                            v-model="amount"
                            label="Monto a invertir"
                            type="number"
                            :error-messages="error"
                            @update:model-value="handleAmountChange"
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
                    @click="handleInvest"
                    >Continuar</FilledButton
                >
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useInvestmentStore } from "@/stores/investmentStore";
import CustomTextField from "@/components/ui/CustomTextField.vue";
import FilledButton from "@/components/ui/FilledButton.vue";

const props = defineProps<{
    modelValue: boolean;
    availableBalance: number;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "continue", data: { amount: number }): void;
}>();

const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const investmentStore = useInvestmentStore();
const isFormValid = ref(false);
const isLoading = ref(false);
const amount = ref("");
const error = ref("");

function formatMoney(value: number) {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

const formattedAmount = computed(() => {
    if (!amount.value) return "";
    const value = parseFloat(amount.value);
    if (isNaN(value)) return "";
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
});

const handleAmountChange = (value: string) => {
    amount.value = value;
    isFormValid.value = validateAmount();
};

const validateAmount = () => {
    const value = parseFloat(amount.value);
    if (isNaN(value)) {
        error.value = "Ingrese un monto válido";
        return false;
    }
    if (value <= 0) {
        error.value = "El monto debe ser mayor a 0";
        return false;
    }
    if (value > props.availableBalance) {
        error.value = "Saldo insuficiente";
        return false;
    }
    error.value = "";
    return true;
};

const handleInvest = async () => {
    if (!validateAmount()) return;
    
    try {
        isLoading.value = true;
        emit("continue", { amount: parseFloat(amount.value) });
        amount.value = "";
        error.value = "";
    } catch (e: any) {
        error.value = e.message || "Error al realizar la inversión";
    } finally {
        isLoading.value = false;
    }
};

watch(() => props.modelValue, (newValue) => {
    if (!newValue) {
        amount.value = "";
        error.value = "";
    }
});

const closeDialog = () => {
    dialog.value = false;
    amount.value = "";
    error.value = "";
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
</style>
