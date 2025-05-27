<template>
    <v-container fluid class="transactions-main">
        <template v-if="securityStore.isLoggedIn">
            <v-row class="transactions-row" no-gutters>
                <v-col cols="12" class="px-md-8">
                    <h1 class="transactions-title">Inversiones</h1>
                    
                    <!-- Stats Row -->
                    <v-row class="mb-6">
                        <v-col cols="12" md="8">
                            <div class="stats-card">
                                <div class="stats-row">
                                    <div class="stats-item">
                                        <div class="stats-label">Invertido</div>
                                        <div class="stats-value">
                                            {{ formatMoney(totalBalance) }}
                                        </div>
                                    </div>
                                    <div class="stats-item">
                                        <div class="stats-label">Ganancia</div>
                                        <div
                                            :class="[
                                                'stats-value',
                                                totalGain >= 0
                                                    ? 'text-success'
                                                    : 'text-error',
                                            ]"
                                        >
                                            {{
                                                (totalGain >= 0 ? "+" : "") +
                                                formatMoney(totalGain)
                                            }}
                                            <span class="stats-percentage"
                                                >({{
                                                    (percentageChange >= 0
                                                        ? "+"
                                                        : "") +
                                                    formatPercent(
                                                        percentageChange
                                                    )
                                                }})</span
                                            >
                                        </div>
                                    </div>
                                </div>
                                <div class="stats-balance-row">
                                    <div class="stats-item">
                                        <div class="stats-label">
                                            Poder de compra
                                        </div>
                                        <div class="stats-value">
                                            {{ formatMoney(availableBalance) }}
                                        </div>
                                    </div>
                                    <div class="stats-item">
                                        <div class="stats-label">
                                            Retorno diario
                                        </div>
                                        <div class="stats-value">
                                            {{
                                                formatPercent(
                                                    investmentStore.dailyRate *
                                                        100
                                                )
                                            }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </v-col>
                        <v-col cols="12" md="4">
                            <div class="chart-card">
                                <div class="chart-title">
                                    Distribución de Inversiones
                                </div>
                                <div class="chart-container">
                                    <svg
                                        :width="160"
                                        :height="160"
                                        :viewBox="`0 0 36 36`"
                                        style="
                                            z-index: 1;
                                            margin-bottom: 1.5rem;
                                        "
                                    >
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            stroke-width="3"
                                        />
                                        <template
                                            v-for="(slice, idx) in chartSlices"
                                            :key="slice.type"
                                        >
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                fill="none"
                                                :stroke="slice.color"
                                                stroke-width="3"
                                                :stroke-dasharray="
                                                    slice.percent +
                                                    ' ' +
                                                    (100 - slice.percent)
                                                "
                                                :stroke-dashoffset="
                                                    slice.offset
                                                "
                                                @mousemove="
                                                    showTooltip($event, slice)
                                                "
                                                @mouseleave="hideTooltip"
                                                style="cursor: pointer"
                                            />
                                        </template>
                                    </svg>
                                    <div
                                        v-if="tooltip.show"
                                        class="chart-tooltip"
                                        :style="{
                                            left: tooltip.x + 'px',
                                            top: tooltip.y + 'px',
                                        }"
                                    >
                                        <strong>{{ tooltip.label }}</strong
                                        ><br />
                                        {{ formatPercent(tooltip.percent)
                                        }}<br />
                                        {{ formatMoney(tooltip.value) }}
                                    </div>
                                    <div class="chart-legend">
                                        <div
                                            v-for="slice in chartSlices"
                                            :key="slice.type"
                                        >
                                            <span
                                                class="legend-dot"
                                                :style="{
                                                    background: slice.color,
                                                }"
                                            ></span>
                                            {{ formatPercent(slice.percent) }} -
                                            {{ slice.label }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </v-row>
                    <div class="investments-actions">
                        <IconFilledButton
                            icon="mdi-plus"
                            class="investments-add-btn"
                            @click="openInvestDialog"
                        >
                            Invertir
                        </IconFilledButton>
                        <IconFilledButton
                            icon="mdi-minus"
                            class="investments-sell-btn"
                            @click="openSellDialog"
                        >
                            Vender
                        </IconFilledButton>
                    </div>
                    <v-row>
                        <v-col cols="12">
                            <BaseDataTable
                                :items="investments"
                                :headers="investmentHeaders"
                                :loading="isLoading"
                                :items-per-page="5"
                                :pagination="true"
                                :row-clickable="false"
                                empty-icon="mdi-chart-line"
                                no-data-message="No hay inversiones disponibles"
                            >
                                <template #item.fund_name="{ item }">
                                    <div class="text-center">
                                        {{ item.fund_name }}
                                    </div>
                                </template>

                                <template #item.invested_amount="{ item }">
                                    <div class="text-center">
                                        {{ formatMoney(item.invested_amount) }}
                                    </div>
                                </template>

                                <template #item.variation="{ item }">
                                    <div class="text-center investment-variation">
                                        <div
                                            class="variation-monetary"
                                            :class="getVariationClass(item.monetary_variation)"
                                        >
                                            {{ formatMoney(item.monetary_variation) }}
                                        </div>
                                        <div
                                            class="variation-percentage"
                                            :class="getVariationClass(item.percentage_variation)"
                                        >
                                            {{ (item.percentage_variation >= 0 ? "+" : "") +
                                                formatPercent(item.percentage_variation) }}
                                        </div>
                                    </div>
                                </template>
                            </BaseDataTable>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>

            <!-- Investment Dialog -->
            <InvestmentBuyDialog
                v-model="investDialog"
                :available-balance="availableBalance"
                @continue="handleInvestmentContinue"
            />

            <!-- Withdraw Dialog -->
            <InvestmentSellDialog
                v-model="withdrawDialog"
                :selected-investment="selectedInvestment"
                :total-balance="totalBalance + totalGain"
                @continue="handleWithdrawContinue"
            />

            <!-- Investment Confirm Dialog -->
            <InvestmentConfirm
                v-model="confirmDialog"
                :mode="confirmAction === 'invertir' ? 'buy' : 'sell'"
                :stock="{
                    name: 'Inversión Virtual',
                    symbol: 'INV',
                    current_price: 1,
                }"
                :quantity="confirmAmount"
                :total-amount="confirmAmount"
                :new-balance="
                    confirmAction === 'invertir'
                        ? availableBalance - confirmAmount
                        : availableBalance + confirmAmount
                "
                @confirm="handleConfirm"
            />

            <!-- Success Dialog -->
            <SuccessDialog
                v-model="showSuccessDialog"
                :title="successDialog.title"
                :message="successDialog.message"
            />
        </template>
        <template v-else>
            <v-alert type="warning" prominent border="start">
                Por favor inicie sesión para ver sus inversiones
            </v-alert>
        </template>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useSecurityStore } from "@/stores/securityStore";
import { useAccountStore } from "@/stores/accountStore";
import { useInvestmentStore } from "@/stores/investmentStore";
import IconFilledButton from "@/components/ui/IconFilledButton.vue";
import InvestmentBuyDialog from "@/components/investments/InvestmentBuyDialog.vue";
import InvestmentSellDialog from "@/components/investments/InvestmentSellDialog.vue";
import InvestmentConfirm from "@/components/investments/InvestmentConfirmDialog.vue";
import SuccessDialog from "@/components/ui/SuccessDialog.vue";
import BaseDataTable from "@/components/ui/BaseDataTable.vue";

const securityStore = useSecurityStore();
const accountStore = useAccountStore();
const investmentStore = useInvestmentStore();

// Utility functions for formatting
function formatMoney(value: number) {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatPercent(value: number) {
    return (
        value.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + "%"
    );
}

const investDialog = ref(false);
const withdrawDialog = ref(false);
const isLoading = ref(false);
const selectedInvestment = ref(null);
const showSuccessDialog = ref(false);
const successDialog = ref({
    title: "",
    message: "",
});

// Available balance from account store
const availableBalance = computed(() => accountStore.account?.balance ?? 0);

// Computed properties
const totalBalance = computed(() => accountStore.account?.invested || 0);
const totalGain = computed(() => investmentStore.totalReturns);
const percentageChange = computed(() => investmentStore.adjustedReturns);

// Methods
const getVariationClass = (variation: number) => {
    if (variation < 0) return "text-error";
    return "text-success";
};

// New refs for confirmation dialog
const confirmDialog = ref(false);
const confirmAction = ref<"invertir" | "vender">("invertir");
const confirmAmount = ref(0);

// Computed properties for investments table
const investments = computed(() => {
    const total = totalBalance.value;
    const perFund = total / 5;

    return [
        {
            fund_name: "Growth",
            invested_amount: perFund,
            monetary_variation: perFund * 0.05,
            percentage_variation: 5,
        },
        {
            fund_name: "Tech",
            invested_amount: perFund,
            monetary_variation: perFund * 0.03,
            percentage_variation: 3,
        },
        {
            fund_name: "Value",
            invested_amount: perFund,
            monetary_variation: perFund * -0.02,
            percentage_variation: -2,
        },
        {
            fund_name: "Crypto",
            invested_amount: perFund,
            monetary_variation: perFund * 0.04,
            percentage_variation: 4,
        },
        {
            fund_name: "Real Estate",
            invested_amount: perFund,
            monetary_variation: perFund * -0.01,
            percentage_variation: -1,
        },
    ];
});

const investmentHeaders = [
    { 
        title: 'Fondo', 
        key: 'fund_name', 
        align: 'center' as const,
        width: '200px'
    },
    { 
        title: 'Monto Invertido', 
        key: 'invested_amount', 
        align: 'center' as const,
        width: '200px'
    },
    { 
        title: 'Variación', 
        key: 'variation', 
        align: 'center' as const,
        width: '300px'
    }
];

// Methods for handling investment actions
const openInvestDialog = () => {
    confirmAction.value = "invertir";
    investDialog.value = true;
};

const openSellDialog = () => {
    confirmAction.value = "vender";
    withdrawDialog.value = true;
};

const handleInvestmentContinue = (data: { amount: number }) => {
    confirmAmount.value = data.amount;
    confirmAction.value = "invertir";
    confirmDialog.value = true;
    investDialog.value = false;
};

const handleWithdrawContinue = (data: { amount: number }) => {
    if (data.amount > totalBalance.value + totalGain.value) {
        // Show error message
        return;
    }
    confirmAmount.value = data.amount;
    confirmAction.value = "vender";
    confirmDialog.value = true;
    withdrawDialog.value = false;
};

const handleConfirm = async () => {
    try {
        if (confirmAction.value === "invertir") {
            await investmentStore.invest(confirmAmount.value);
            successDialog.value = {
                title: "Inversión exitosa",
                message: `Has invertido ${formatMoney(
                    confirmAmount.value
                )} exitosamente.`,
            };
        } else {
            await investmentStore.divest(confirmAmount.value);
            successDialog.value = {
                title: "Venta exitosa",
                message: `Has vendido ${formatMoney(
                    confirmAmount.value
                )} exitosamente.`,
            };
        }
        showSuccessDialog.value = true;
        confirmDialog.value = false;
        await refreshData();
    } catch (error: any) {
        console.error("Error en la operación:", error);
    }
};

const refreshData = async () => {
    try {
        await Promise.all([
            investmentStore.fetchDailyRate(),
            accountStore.fetchAccount(),
        ]);
    } catch (error: any) {
        console.error("Error al refrescar los datos:", error);
    }
};

onMounted(async () => {
    await Promise.all([
        investmentStore.fetchDailyRate(),
        accountStore.fetchAccount(),
    ]);
});

// Add tooltip-related declarations
interface TooltipState {
    show: boolean;
    x: number;
    y: number;
    label: string;
    percent: number;
    value: number;
}

const tooltip = ref<TooltipState>({
    show: false,
    x: 0,
    y: 0,
    label: "",
    percent: 0,
    value: 0,
});

function showTooltip(
    e: MouseEvent,
    slice: { label: string; percent: number; value: number }
) {
    tooltip.value = {
        show: true,
        x: e.offsetX + 100,
        y: e.offsetY - 10,
        label: slice.label,
        percent: slice.percent,
        value: slice.value,
    };
}

function hideTooltip() {
    tooltip.value = {
        ...tooltip.value,
        show: false,
    };
}

// Add chart slices computation
const chartSlices = computed(() => {
    const total = totalBalance.value;
    if (total === 0) return [];

    const sliceValue = total / 5; // Divide total investment among 5 funds
    return [
        {
            type: "growth",
            label: "Growth",
            color: "#4CAF50",
            percent: 20,
            offset: 0,
            value: sliceValue,
        },
        {
            type: "tech",
            label: "Tech",
            color: "#2196F3",
            percent: 20,
            offset: 20,
            value: sliceValue,
        },
        {
            type: "value",
            label: "Value",
            color: "#FFC107",
            percent: 20,
            offset: 40,
            value: sliceValue,
        },
        {
            type: "crypto",
            label: "Crypto",
            color: "#9C27B0",
            percent: 20,
            offset: 60,
            value: sliceValue,
        },
        {
            type: "realestate",
            label: "Real Estate",
            color: "#F44336",
            percent: 20,
            offset: 80,
            value: sliceValue,
        },
    ];
});
</script>

<style scoped>
.transactions-main {
    padding: 0;
    background: var(--background);
    min-height: 100vh;
}

.transactions-row {
    margin: 0;
}

.investment-summary {
    background-color: var(--primary) !important;
}

.green--text {
    color: var(--success) !important;
}

.red--text {
    color: var(--error) !important;
}

.rounded {
    border-radius: 24px !important;
}

.dashboard-invest-card {
    background: var(--surface-alt);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    margin-bottom: 1.5rem;
    padding: 0;
    width: 100%;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
}
.dashboard-invest-header {
    background: var(--primary);
    color: var(--primary-foreground);
    border-top-left-radius: var(--radius-lg);
    border-top-right-radius: var(--radius-lg);
    padding: 1.2rem 1.5rem 1rem 1.5rem;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.dashboard-invest-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--primary-foreground);
}
.dashboard-invest-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-foreground);
}
.dashboard-invest-gain {
    color: var(--primary-foreground);
    font-weight: 500;
    text-align: right;
}
.dashboard-invest-balance-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    color: var(--muted-text);
    margin-top: 0.2rem;
    margin-bottom: 0.2rem;
}
.dashboard-invest-balance-label {
    font-size: 1rem;
    color: var(--primary-foreground);
    font-weight: 400;
}
.dashboard-invest-balance-value {
    font-size: 1rem;
    color: var(--primary-foreground);
    font-weight: 600;
    margin-left: 0.5rem;
}
.dashboard-invest-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
}
.dashboard-invest-body {
    padding: 1.2rem 1.5rem 1.5rem 1.5rem;
}
.dashboard-invest-chart {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-top: 1rem;
}
.dashboard-invest-legend {
    font-size: 0.95rem;
    color: var(--muted-text);
}
.legend-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 6px;
}
.dashboard-invest-tooltip {
    position: absolute;
    background: var(--surface-alt);
    color: var(--text);
    border-radius: 8px;
    box-shadow: var(--shadow-card-dark);
    padding: 8px 14px;
    font-size: 0.95rem;
    pointer-events: none;
    z-index: 10;
    min-width: 120px;
    text-align: center;
}
.white--text {
    color: white !important;
}
.white--text .v-icon {
    color: white !important;
}

/* --- TABLA DE INVERSIONES --- */
.v-data-table {
    background: var(--surface-alt);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
}
.v-data-table thead th {
    background-color: var(--label) !important;
    color: white !important;
    font-weight: 700;
    font-size: 1.05rem;
    border-top: none;
    border-bottom: 1.5px solid var(--border);
    text-align: center;
}
.v-data-table tbody tr {
    transition: background 0.18s;
}
.v-data-table tbody tr:hover {
    background: var(--surface-alt) !important;
}
.v-data-table tbody td {
    color: var(--text);
    border-bottom: 1px solid var(--border);
    text-align: center;
    vertical-align: middle;
    padding-top: 0.7rem;
    padding-bottom: 0.7rem;
}
.v-data-table tbody td .text-center {
    text-align: center;
    width: 100%;
}
.v-data-table tbody td.font-weight-medium {
    font-weight: 700;
    color: var(--primary);
}
.v-data-table .text-success {
    color: var(--success) !important;
    font-weight: 600;
}
.v-data-table .text-error {
    color: var(--error) !important;
    font-weight: 600;
}
.v-data-table .v-pagination {
    margin-top: 0.5rem;
}
/* Links y acciones */
.dashboard-link,
.dashboard-link-header {
    color: var(--primary);
    font-size: 0.95rem;
    text-decoration: none;
    display: flex;
    align-items: center;
}
.dashboard-link-header {
    color: white;
}
.mt-4 {
    margin-top: 1.5rem !important;
}
.text-grey {
    color: var(--muted-text) !important;
}
/* Intercalado filas impares */
.v-data-table tbody tr:nth-child(even) {
    background-color: var(--surface-alt) !important;
}

.investments-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 2.2rem;
    justify-content: flex-start;
    width: fit-content;
}

.investments-add-btn,
.investments-sell-btn {
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.5rem 1.8rem;
    min-width: 160px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.variation-percentage {
    font-size: 0.9rem;
    margin-top: 0.2rem;
}

.investments-row {
    margin-top: 2rem;
}

.investments-title {
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    margin-left: 0;
    font-family: var(--font-sans), sans-serif;
}

.investment-card {
    background: var(--surface-alt);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    overflow: hidden;
}

.investments-table {
    background: transparent !important;
    box-shadow: none !important;
}

.investments-table thead th {
    background-color: var(--label) !important;
    color: white !important;
    font-weight: 700;
    font-size: 1.05rem;
    border-top: none;
    border-bottom: 1.5px solid var(--border);
    text-align: center;
}

.investments-table tbody tr {
    transition: background 0.18s;
    cursor: pointer;
}

.investments-table tbody tr:hover {
    background: var(--surface-alt) !important;
}

.investments-table tbody td {
    color: var(--text);
    border-bottom: 1px solid var(--border);
    text-align: center;
    vertical-align: middle;
    padding-top: 0.7rem;
    padding-bottom: 0.7rem;
}

.investment-description {
    min-width: 200px;
}

.investment-value {
    min-width: 150px;
}

.investment-name-align,
.investment-value-align {
    display: flex;
    align-items: center;
    justify-content: center;
}

.investment-name {
    font-weight: 600;
    color: var(--text);
}

.investment-value-text {
    color: var(--muted-text);
}

.text-success {
    color: var(--success) !important;
}

.text-error {
    color: var(--error) !important;
}

.add-contact-dialog {
    padding: 2rem 3rem;
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.1);
    width: 100%;
    margin: 0 auto;
}
.dialog-header-centered {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    position: relative;
}
.dialog-title-centered {
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
.dialog-back-btn {
    position: absolute;
    left: 0;
}
.contact-main-info {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.2rem;
    gap: 1.2rem;
}
.contact-main-name {
    display: flex;
    align-items: center;
}
.contact-main-fullname {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
}
.contact-info-centered {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}
.dialog-actions-row {
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
.secondary-btn {
    background: var(--secondary) !important;
    color: var(--secondary-foreground) !important;
    border: none;
}
.transactions-main {
    background: var(--background);
    min-height: 100vh;
    padding: 0;
}

.transactions-row {
    margin: 0;
}

.transactions-title {
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    margin-left: 0;
    font-family: var(--font-sans), sans-serif;
}

.stats-card {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.06);
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    height: 100%;
}

.stats-row {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
}

.stats-balance-row {
    padding-top: 0.8rem;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    gap: 2rem;
}

.stats-balance-row .stats-item {
    flex: 1;
}

.stats-balance-row .stats-value {
    font-size: 1.5rem;
    font-weight: 700;
}

.stats-item {
    flex: 1;
}

.stats-label {
    font-size: 1rem;
    color: var(--muted-text);
    margin-bottom: 0.5rem;
}

.stats-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
}

.stats-percentage {
    font-size: 1rem;
    font-weight: 500;
    margin-left: 0.5rem;
}

.chart-card {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.06);
    height: 100%;
    display: flex;
    flex-direction: column;
    container-type: inline-size;
}

.chart-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 1rem;
}

.chart-container {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.2rem;
    margin-top: 1rem;
}

@container (max-width: 350px) {
    .chart-container {
        flex-direction: column;
        align-items: flex-center;
    }
}

.chart-svg {
    width: 100%;
    height: 200px;
}

.chart-tooltip {
    position: absolute;
    background: white;
    border-radius: 8px;
    padding: 0.8rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    z-index: 10;
    min-width: 120px;
}

.tooltip-label {
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.3rem;
}

.tooltip-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
}

.tooltip-percent {
    font-size: 0.9rem;
    color: var(--muted-text);
    margin-top: 0.2rem;
}

.chart-legend {
    font-size: 0.95rem;
    color: var(--muted-text);
}

.chart-legend > div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.legend-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    min-width: 8px;
    min-height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
}

.invest-add-btn {
    margin-bottom: 2.2rem;
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.5rem 2.5rem;
    min-width: 200px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.investments-table {
    background: transparent;
}

.investments-table :deep(th) {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text);
    white-space: nowrap;
    background-color: var(--card);
    border-bottom: none;
    font-family: var(--font-sans), sans-serif;
}

.text-success {
    color: var(--success) !important;
}

.text-error {
    color: var(--error) !important;
}
/* --- Variación de inversión: ajustes para centrar y alinear montos --- */
.investment-variation {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    height: 100%;
    justify-content: center;
}

.variation-monetary {
    font-weight: 600;
    white-space: nowrap;
}

.variation-percentage {
    font-size: 0.9rem;
}

.text-success {
    color: var(--success) !important;
}

.text-error {
    color: var(--error) !important;
}

/* Override hover effect while keeping clickable */
:deep(.base-data-table tbody tr:hover) {
    background: inherit !important;
    cursor: pointer;
}

/* Investment specific styles */
.investment-variation {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    height: 100%;
    justify-content: center;
}
</style>
