<template>
    <v-dialog
        v-model="dialog"
        max-width="500px"
        :retain-focus="false"
        :scrim="true"
    >
        <v-card class="investment-confirm-dialog" width="100%">
            <div class="dialog-header">
                <span class="dialog-title">{{ mode === 'buy' ? 'Confirmar Compra' : 'Confirmar Venta' }}</span>
                <v-btn icon class="dialog-close-btn" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <v-card-text style="padding-bottom: 0">
                <div class="investment-summary">
                    <div class="fund-info">
                        <div class="fund-name">{{ stock.name }}</div>
                        <div class="fund-symbol">{{ stock.symbol }}</div>
                    </div>
                    
                    <div class="operation-details">
                        <div class="detail-row">
                            <span class="detail-label">Operación:</span>
                            <span class="detail-value">{{ mode === 'buy' ? 'Compra' : 'Venta' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Cuotapartes:</span>
                            <span class="detail-value">{{ formatNumber(quantity) }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Precio actual:</span>
                            <span class="detail-value">{{ formatMoney(stock.current_price) }}</span>
                        </div>
                        <div class="detail-row total-row">
                            <span class="detail-label">Monto total:</span>
                            <span class="detail-value total-amount">{{ formatMoney(totalAmount) }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Saldo estimado:</span>
                            <span class="detail-value">{{ formatMoney(newBalance) }}</span>
                        </div>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions class="dialog-actions">
                <FilledButton
                    class="btn-secondary"
                    @click="closeDialog"
                >Cancelar</FilledButton>
                <FilledButton
                    class="action-button"
                    color="primary"
                    @click="handleConfirm"
                >Confirmar</FilledButton>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FilledButton from '@/components/ui/FilledButton.vue';

interface Stock {
    name: string;
    symbol: string;
    current_price: number;
}

const props = defineProps<{
    modelValue: boolean;
    mode: 'buy' | 'sell';
    stock: Stock;
    quantity: number;
    totalAmount: number;
    newBalance: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm'): void;
}>();

const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

function formatMoney(value: number) {
    return value.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatNumber(value: number) {
    return value.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
}

function closeDialog() {
    dialog.value = false;
}

function handleConfirm() {
    emit('confirm');
    closeDialog();
}
</script>

<style scoped>
.investment-confirm-dialog {
    padding: 2rem 3rem;
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.1);
    width: 100%;
    margin: 0 auto;
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    position: relative;
}

.dialog-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    text-align: center;
    flex: 1;
}

.dialog-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
    position: absolute;
    right: 0;
}

.investment-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 0 1rem;
}

.fund-info {
    text-align: center;
}

.fund-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.25rem;
}

.fund-symbol {
    font-size: 1rem;
    color: var(--muted-text);
}

.operation-details {
    width: 100%;
    max-width: 340px;
    background: var(--input);
    border-radius: var(--radius);
    padding: 1.25rem;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    font-size: 1.05rem;
}

.detail-row:not(:last-child) {
    border-bottom: 1px solid var(--border);
}

.detail-label {
    color: var(--muted-text);
    font-weight: 500;
}

.detail-value {
    color: var(--text);
    font-weight: 600;
}

.total-row {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 2px solid var(--border);
}

.total-amount {
    font-size: 1.2rem;
    color: var(--primary);
}

.dialog-actions {
    padding: 0.5rem 0 1.5rem 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.action-button {
    min-width: 160px;
    max-width: 220px;
    width: 100%;
}

.btn-secondary {
    background-color: var(--button-secondary-bg) !important;
    color: var(--button-secondary-text) !important;
    border: 1px solid var(--button-secondary-border) !important;
    min-width: 160px;
    max-width: 220px;
    width: 100%;
}

.btn-secondary:hover {
    background-color: var(--button-secondary-bg-hover) !important;
    color: var(--button-secondary-text-hover) !important;
    border-color: var(--button-secondary-border-hover) !important;
}
</style> 