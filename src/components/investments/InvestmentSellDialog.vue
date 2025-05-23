<template>
    <v-dialog
        v-model="dialog"
        max-width="500px"
        :retain-focus="false"
        :scrim="true"
    >
        <v-card class="withdraw-dialog" width="100%">
            <div class="withdraw-header">
                <span class="withdraw-title">Retirar Inversión</span>
                <v-btn icon class="withdraw-close-btn" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <v-card-text style="padding-bottom: 0">
                <v-form ref="form" v-model="isFormValid">
                    <div class="withdraw-form">
                        <div class="mb-4">
                            <strong>Saldo disponible:</strong>
                            <div class="available-balance">
                                {{ formatMoney(totalBalance) }}
                                <span class="balance-detail">
                                    (Invertido + Ganancia)
                                </span>
                            </div>
                        </div>

                        <CustomTextField
                            v-model="amount"
                            label="Monto a retirar"
                            type="number"
                            :error-messages="error"
                            @update:model-value="handleAmountChange"
                            class="mb-4"
                        />
                    </div>
                </v-form>
            </v-card-text>
            <v-card-actions class="withdraw-actions">
                <FilledButton
                    class="btn-secondary"
                    @click="closeDialog"
                >Cancelar</FilledButton>
                <FilledButton
                    class="withdraw-button"
                    color="primary"
                    :loading="isLoading"
                    :disabled="isButtonDisabled"
                    @click="handleWithdraw"
                >Continuar</FilledButton>
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
    totalBalance: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'continue', data: { amount: number }): void;
}>();

const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const investmentStore = useInvestmentStore();
const form = ref();
const isFormValid = ref(true);
const isLoading = ref(false);
const amount = ref("");
const error = ref("");

const isButtonDisabled = computed(() => {
    return (
        !isFormValid.value ||
        isLoading.value ||
        typeof parseFloat(amount.value) !== 'number' ||
        isNaN(parseFloat(amount.value)) ||
        parseFloat(amount.value) <= 0 ||
        parseFloat(amount.value) > props.totalBalance
    );
});

function formatMoney(value: number) {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

const handleAmountChange = (value: string) => {
    amount.value = value;
    validateAmount();
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
    if (value > props.totalBalance) {
        error.value = "Monto excede el saldo disponible";
        return false;
    }
    error.value = "";
    return true;
};

const handleWithdraw = async () => {
    if (!validateAmount()) return;

    try {
        isLoading.value = true;
        emit('continue', { amount: parseFloat(amount.value) });
        closeDialog();
    } catch (error: any) {
        console.error('Error al realizar el retiro:', error);
        error.value = error.message || "Error al realizar el retiro";
    } finally {
        isLoading.value = false;
    }
};

const closeDialog = () => {
    dialog.value = false;
    amount.value = "";
    form.value?.reset();
};

// Initialize values when dialog opens
watch(() => props.modelValue, (newValue: boolean) => {
    if (newValue) {
        amount.value = props.totalBalance.toString();
    }
});
</script>

<style scoped>
.withdraw-dialog {
    padding: 2rem 3rem;
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.1);
    width: 100%;
    margin: 0 auto;
}

.withdraw-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    position: relative;
}

.withdraw-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    text-align: center;
    flex: 1;
}

.withdraw-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
    position: absolute;
    right: 0;
}

.withdraw-form {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.withdraw-actions {
    padding: 0.5rem 0 1.5rem 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.withdraw-button {
    min-width: 160px;
    max-width: 220px;
    width: 100%;
}

.available-balance {
    margin-top: 0.5rem;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text);
}

.balance-detail {
    font-size: 0.9rem;
    font-weight: normal;
    color: var(--muted-text);
    margin-left: 0.5rem;
}
</style> 