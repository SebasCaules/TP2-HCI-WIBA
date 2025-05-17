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
                <v-form ref="form" v-model="isFormValid" @update:model-value="checkFormState">
                    <div class="withdraw-fund-selector">
                        <div class="withdraw-main-name">
                            <span class="withdraw-main-fullname">{{ selectedInvestment?.stock?.name }}</span>
                        </div>
                    </div>
                    <div class="withdraw-form">
                        <div class="mb-4">
                            <strong>Cuotapartes disponibles:</strong>
                            {{ formatShares(selectedInvestment?.quantity ?? 0) }}
                        </div>

                        <CustomTextField
                            v-model.number="withdrawAmount"
                            label="Monto a retirar"
                            type="number"
                            :rules="[
                                (v: number) => typeof v === 'number' && !isNaN(v) || 'El monto es requerido',
                                (v: number) => v > 0 || 'El monto debe ser mayor a 0',
                                (v: number) => v <= (selectedInvestment?.total_value ?? 0) || 'No puede retirar más de lo que posee',
                            ]"
                            required
                            @input="syncWithdrawSharesFromAmount"
                            class="mb-4"
                        />

                        <CustomTextField
                            v-model.number="withdrawShares"
                            label="Cantidad a retirar (cuotapartes)"
                            type="number"
                            :rules="[
                                (v: number) => typeof v === 'number' && !isNaN(v) || 'La cantidad es requerida',
                                (v: number) => v > 0 || 'La cantidad debe ser mayor a 0',
                                (v: number) => v <= (selectedInvestment?.quantity ?? 0) || 'No puede retirar más de lo que posee',
                            ]"
                            required
                            @input="syncWithdrawAmountFromShares"
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
                    @click="showConfirmDialog = true"
                >Confirmar</FilledButton>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <InvestmentConfirmDialog
        v-if="selectedInvestment?.stock"
        v-model="showConfirmDialog"
        mode="sell"
        :stock="selectedInvestment.stock"
        :quantity="withdrawShares"
        :total-amount="withdrawAmount"
        :new-balance="(selectedInvestment?.total_value ?? 0) - withdrawAmount"
        @confirm="handleWithdraw"
    />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { type Stock } from "@/services/investments";
import CustomTextField from "@/components/ui/CustomTextField.vue";
import FilledButton from "@/components/ui/FilledButton.vue";
import InvestmentConfirmDialog from "./InvestmentConfirmDialog.vue";

interface PortfolioItem {
    id: number;
    user_id: string;
    stock_id: number;
    quantity: number;
    average_price: number;
    total_value: number;
    stock?: Stock;
    variation_percentage: number;
}

const props = defineProps<{
    modelValue: boolean;
    selectedInvestment: PortfolioItem | null;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'withdraw', data: { amount: number; shares: number; stockId: number }): void;
}>();

const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const form = ref();
const isFormValid = ref(true);
const isLoading = ref(false);
const withdrawAmount = ref<number>(0);
const withdrawShares = ref<number>(0);
const showConfirmDialog = ref(false);

const isButtonDisabled = computed(() => {
    return (
        !isFormValid.value ||
        isLoading.value ||
        typeof withdrawAmount.value !== 'number' ||
        isNaN(withdrawAmount.value) ||
        withdrawAmount.value <= 0 ||
        typeof withdrawShares.value !== 'number' ||
        isNaN(withdrawShares.value) ||
        withdrawShares.value <= 0
    );
});

// Debug function to check form state
const checkFormState = () => {
    console.log('Form State:', {
        isFormValid: isFormValid.value,
        withdrawAmount: withdrawAmount.value,
        withdrawShares: withdrawShares.value,
        selectedInvestment: props.selectedInvestment,
        formRef: form.value
    });
};

function formatShares(value: number) {
    return value.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

const syncWithdrawSharesFromAmount = () => {
    if (!props.selectedInvestment?.stock?.current_price) {
        withdrawShares.value = 0;
        return;
    }
    const price = props.selectedInvestment.stock.current_price;
    if (price > 0) {
        withdrawShares.value = +(Number(withdrawAmount.value) / price).toFixed(6);
    } else {
        withdrawShares.value = 0;
    }
    console.log('After sync shares from amount:', {
        amount: withdrawAmount.value,
        shares: withdrawShares.value,
        price
    });
    checkFormState();
};

const syncWithdrawAmountFromShares = () => {
    if (!props.selectedInvestment?.stock?.current_price) {
        withdrawAmount.value = 0;
        return;
    }
    const price = props.selectedInvestment.stock.current_price;
    if (price > 0) {
        withdrawAmount.value = +(Number(withdrawShares.value) * price).toFixed(2);
    } else {
        withdrawAmount.value = 0;
    }
    console.log('After sync amount from shares:', {
        amount: withdrawAmount.value,
        shares: withdrawShares.value,
        price
    });
    checkFormState();
};

const handleWithdraw = async () => {
    if (!props.selectedInvestment) return;
    
    console.log('Before validation:', {
        form: form.value,
        isValid: isFormValid.value,
        amount: withdrawAmount.value,
        shares: withdrawShares.value
    });

    const { valid } = await form.value?.validate();
    console.log('After validation:', { valid });

    if (!valid) return;

    emit('withdraw', {
        amount: Number(withdrawAmount.value),
        shares: Number(withdrawShares.value),
        stockId: props.selectedInvestment.stock_id
    });
};

const closeDialog = () => {
    dialog.value = false;
    withdrawAmount.value = 0;
    withdrawShares.value = 0;
    form.value?.reset();
    showConfirmDialog.value = false;
    console.log('Dialog closed, form reset');
};

// Initialize values when dialog opens
watch(() => props.modelValue, (newValue: boolean) => {
    console.log('Dialog state changed:', { newValue, selectedInvestment: props.selectedInvestment });
    if (newValue && props.selectedInvestment) {
        withdrawAmount.value = Number(props.selectedInvestment.total_value) || 0;
        withdrawShares.value = Number(props.selectedInvestment.quantity) || 0;
        console.log('Initialized values:', {
            amount: withdrawAmount.value,
            shares: withdrawShares.value
        });
    }
});

// Watch for changes in form validity
watch([withdrawAmount, withdrawShares], () => {
    console.log('Values changed:', {
        amount: withdrawAmount.value,
        shares: withdrawShares.value,
        isValid: isFormValid.value
    });
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

.withdraw-fund-selector {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.withdraw-main-name {
    text-align: center;
}

.withdraw-main-fullname {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
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
</style> 