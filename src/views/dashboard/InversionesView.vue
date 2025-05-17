<template>
    <v-container>
        <template v-if="authStore.isAuthenticated">
            <InvestmentCard
                v-if="authStore.user?.id"
                title="Inversiones"
                :total="totalBalance"
                :gain="totalGain"
                :percentage="percentageChange"
                :slices="chartSlices"
                :showBalance="true"
                :balance="availableBalance"
                :userId="authStore.user.id"
            />
            <v-row class="investments-row" no-gutters>
                <v-col cols="12" class="px-md-8">
                    <IconFilledButton
                        icon="mdi-plus"
                        class="investments-add-btn"
                        @click="openInvestDialog"
                    >
                        Invertir
                    </IconFilledButton>
                    <v-row>
                        <v-col cols="12">
                            <v-card class="elevation-1">
                                <v-card-title class="text-h6 font-weight-bold">
                                    Mis Inversiones
                                </v-card-title>
                                <v-data-table
                                    v-if="investments.length > 0"
                                    :items="investments"
                                    :headers="investmentHeaders"
                                    :items-per-page="5"
                                    class="elevation-0"
                                    item-value="id"
                                    hover
                                    @click:row="openWithdrawDialog"
                                >
                                    <template #item.name="{ item }">
                                        <div class="text-center font-weight-medium">{{ item.name }}</div>
                                    </template>

                                    <template #item.quantity="{ item }">
                                        <div class="text-center">{{ formatShares(item.quantity) }}</div>
                                    </template>

                                    <template #item.price="{ item }">
                                        <div class="text-center">{{ formatMoney(item.price) }}</div>
                                    </template>

                                    <template #item.variation="{ item }">
                                        <div :class="['text-center', getVariationClass(item.variation)]">
                                            {{ (item.variation >= 0 ? '+' : '') + formatPercent(item.variation) }}
                                        </div>
                                    </template>

                                    <template #item.total_value="{ item }">
                                        <div class="text-center font-weight-medium">{{ formatMoney(item.total_value) }}</div>
                                    </template>

                                    <template #bottom>
                                        <div class="text-center pt-2">
                                            <v-pagination
                                                v-model="currentPage"
                                                :length="Math.ceil(investments.length / itemsPerPage)"
                                                rounded
                                            ></v-pagination>
                                        </div>
                                    </template>

                                    <template #no-data>
                                        <div class="pa-4 text-center">
                                            <v-icon size="large" color="grey" class="mb-2">mdi-chart-line</v-icon>
                                            <div class="text-h6 text-grey">Aún no tenés inversiones</div>
                                            <div class="text-body-2 text-grey mt-2">
                                                Comenzá a invertir haciendo clic en el botón "Invertir"
                                            </div>
                                        </div>
                                    </template>
                                </v-data-table>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>

            <!-- Investment Dialog -->
            <InvestmentBuyDialog
                v-model="investDialog"
                :fund-options="fundOptions"
                :available-balance="availableBalance"
                :stocks="stocks"
                @invest="handleInvestment"
            />

            <!-- Withdraw Dialog -->
            <InvestmentSellDialog
                v-model="withdrawDialog"
                :selected-investment="selectedInvestment"
                @withdraw="handleWithdraw"
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
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/store/auth";
import {
    type Stock,
    type PortfolioItem,
    getStocks,
    getPortfolio,
    updatePortfolio,
    performInvestmentTransaction,
} from "@/services/investments";
import {
    getAccountBalance as fetchAccountBalance,
    updateAccountBalance,
} from "@/services/account";
import InvestmentCard from "@/components/investments/InvestmentCard.vue";
import IconFilledButton from "@/components/ui/IconFilledButton.vue";
import InvestmentBuyDialog from "@/components/investments/InvestmentBuyDialog.vue";
import InvestmentSellDialog from "@/components/investments/InvestmentSellDialog.vue";
import SuccessDialog from "@/components/ui/SuccessDialog.vue";
import { investmentTypeColors, investmentTypeLabels } from "@/types/types";

const authStore = useAuthStore();

// Utility functions for formatting
function formatMoney(value: number) {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatShares(value: number) {
    return value.toLocaleString("es-AR", {
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
const stocks = ref<Stock[]>([]);
const portfolio = ref<PortfolioItem[]>([]);

const selectedInvestment = ref<null | (PortfolioItem & { stock?: Stock })>(
    null
);

const showSuccessDialog = ref(false);
const successDialog = ref({
    title: '',
    message: ''
});

// Available balance from service
const availableBalance = ref(0);

// Transform portfolio data for display (flattened for headers)
const investments = computed(() => {
    return portfolio.value
        .filter((item) => item.quantity > 0)
        .map((item) => {
            const stock = stocks.value.find((s) => s.id === item.stock_id);
            const totalValue =
                item.total_value != null
                    ? item.total_value
                    : item.quantity * (stock?.current_price ?? 0);
            const variation =
                stock && item.average_price
                    ? ((stock.current_price - item.average_price) /
                          item.average_price) *
                      100
                    : 0;

            return {
                id: item.id,
                name: stock?.name || "",
                quantity: item.quantity,
                price: stock?.current_price || 0,
                variation: variation,
                total_value: totalValue,
                stock,
            };
        });
});

// Computed properties
const totalBalance = computed(() => {
    return investments.value.reduce((sum, inv) => sum + inv.total_value, 0);
});

const totalInitialBalance = computed(() => {
    return investments.value.reduce((sum, inv) => {
        const initial = inv.total_value / (1 + inv.variation / 100);
        return sum + initial;
    }, 0);
});

const totalGain = computed(() => {
    return totalBalance.value - totalInitialBalance.value;
});

const percentageChange = computed(() => {
    return totalInitialBalance.value > 0
        ? (totalGain.value / totalInitialBalance.value) * 100
        : 0;
});

const fundOptions = computed(() => {
    return stocks.value.map((stock) => ({
        id: stock.id,
        name: stock.name,
    }));
});

// Methods
const getVariationClass = (variation: number) => {
    if (variation < 0) return "text-error";
    return "text-success";
};

const openInvestDialog = () => {
    investDialog.value = true;
};

const openWithdrawDialog = (item: any) => {
  const tr = item.currentTarget as HTMLTableRowElement;
  const firstCell = tr.querySelector('td:first-child div');
  const name = firstCell?.textContent?.trim();
  if (!name) {
    console.warn('No se pudo obtener el nombre de la inversión');
    return;
  }

  const investment = investments.value.find(inv => inv.name === name);
  if (!investment) {
    console.warn('No se encontró ninguna inversión con ese nombre');
    return;
  }

  withdrawDialog.value = true;
  selectedInvestment.value = {
    id: investment.id,
    user_id: authStore.user?.id || '',
    stock_id: investment.stock?.id || 0,
    quantity: investment.quantity,
    average_price: investment.price,
    total_value: investment.total_value,
    stock: investment.stock,
    variation_percentage: investment.variation
  };
}

const handleInvestment = async (data: { amount: number; shares: number; stockId: number }) => {
    if (!authStore.user?.id) {
        return;
    }

    if (data.amount > availableBalance.value) {
        successDialog.value = {
            title: 'Error',
            message: 'Saldo insuficiente para realizar la inversión'
        };
        showSuccessDialog.value = true;
        return;
    }

    const selectedStock = stocks.value.find(
        (stock) => stock.id === data.stockId
    );

    if (!selectedStock) {
        console.error("Selected stock not found:", data.stockId);
        throw new Error("Fondo no encontrado");
    }

    isLoading.value = true;
    try {
        const amount = parseFloat(data.amount.toString());
        const price = parseFloat(selectedStock.current_price.toString());

        if (isNaN(amount) || isNaN(price) || price <= 0) {
            throw new Error(
                `Monto o precio inválido - Monto: ${amount}, Precio: ${price}`
            );
        }

        // Create transaction
        try {
            const userId = authStore.user.id;
            const stockId = selectedStock.id;
            const quantity = parseFloat(data.shares.toFixed(6));
            const priceVal = parseFloat(selectedStock.current_price.toString());

            await performInvestmentTransaction(
                userId,
                stockId,
                "buy",
                quantity,
                priceVal
            );
        } catch (error) {
            console.error("Transaction error:", error);
            throw new Error("Error al crear la transacción");
        }

        // Update portfolio
        const existingPosition = portfolio.value.find(
            (p) => p.stock_id === selectedStock.id
        );
        const newQuantity = (existingPosition?.quantity || 0) + data.shares;

        await updatePortfolio(authStore.user.id, selectedStock.id, newQuantity);

        // Update balance: decrease user balance
        await updateAccountBalance(authStore.user.id, -amount);
        availableBalance.value -= amount;

        // Refresh portfolio data
        await fetchPortfolio();

        successDialog.value = {
            title: '¡Inversión exitosa!',
            message: 'La inversión fue realizada con éxito'
        };
        showSuccessDialog.value = true;

        investDialog.value = false;
    } catch (error: any) {
        successDialog.value = {
            title: 'Error',
            message: error.message || 'Error al realizar la inversión'
        };
        showSuccessDialog.value = true;
    } finally {
        isLoading.value = false;
    }
};

const handleWithdraw = async (data: { amount: number; shares: number; stockId: number }) => {
    if (!selectedInvestment.value || !authStore.user?.id) {
        return;
    }
    if (
        data.amount <= 0 ||
        data.amount > selectedInvestment.value.total_value
    ) {
        successDialog.value = {
            title: 'Error',
            message: 'Cantidad inválida para retirar'
        };
        showSuccessDialog.value = true;
        return;
    }

    const price = selectedInvestment.value.stock?.current_price;
    if (typeof price !== "number") {
        successDialog.value = {
            title: 'Error',
            message: 'No se pudo obtener el precio actual del fondo'
        };
        showSuccessDialog.value = true;
        return;
    }

    isLoading.value = true;
    try {
        const userId = authStore.user.id;
        const stockId = selectedInvestment.value.stock_id;
        const quantity = parseFloat(data.shares.toFixed(6));

        // Perform withdrawal transaction
        await performInvestmentTransaction(
            userId,
            stockId,
            "sell",
            quantity,
            price
        );

        // Update portfolio
        const existingPosition = portfolio.value.find(
            (p) => p.stock_id === stockId
        );
        const newQuantity = (existingPosition?.quantity || 0) - quantity;

        await updatePortfolio(
            authStore.user.id,
            stockId,
            newQuantity >= 0 ? newQuantity : 0
        );

        // Update balance: increase user balance
        const amountReturned = quantity * price;
        await updateAccountBalance(authStore.user.id, amountReturned);
        availableBalance.value += amountReturned;

        // Refresh portfolio data
        await fetchPortfolio();

        successDialog.value = {
            title: '¡Retiro exitoso!',
            message: 'El retiro fue realizado con éxito'
        };
        showSuccessDialog.value = true;

        withdrawDialog.value = false;
    } catch (error: any) {
        successDialog.value = {
            title: 'Error',
            message: error.message || 'Error al realizar el retiro'
        };
        showSuccessDialog.value = true;
    } finally {
        isLoading.value = false;
    }
};

const fetchPortfolio = async () => {
    try {
        if (!authStore.user?.id) return;

        const portfolioData = await getPortfolio(authStore.user.id);
        portfolio.value = portfolioData;
    } catch (error: any) {
        successDialog.value = {
            title: 'Error',
            message: 'Error al cargar el portafolio: ' + error.message
        };
        showSuccessDialog.value = true;
    }
};

// Initialize data
onMounted(async () => {
    if (!authStore.isAuthenticated || !authStore.user?.id) {
        successDialog.value = {
            title: 'Error',
            message: 'Por favor inicie sesión para ver sus inversiones'
        };
        showSuccessDialog.value = true;
        return;
    }

    try {
        const stocksData = await getStocks();
        stocks.value = stocksData;
        await fetchPortfolio();
        availableBalance.value = await fetchAccountBalance(authStore.user.id);
    } catch (error: any) {
        successDialog.value = {
            title: 'Error',
            message: 'Error al cargar los datos: ' + error.message
        };
        showSuccessDialog.value = true;
    }
});

// Calcular distribución por tipo
const chartSlices = computed(() => {
    const total = totalBalance.value;
    // Agrupar por tipo (symbol) solo para inversiones con cantidad > 0
    const grouped: Record<string, number> = {};
    investments.value
        .filter((inv) => inv.quantity > 0)
        .forEach((inv) => {
            const type = inv.stock?.symbol ?? "FND-A";
            grouped[type] = (grouped[type] || 0) + (inv.total_value ?? 0);
        });
    // Calcular porcentajes y offsets para SVG
    let offset = 25; // para que arranque arriba
    return Object.entries(investmentTypeColors)
        .map(([type, color]) => {
            const value = grouped[type] || 0;
            const percent = total > 0 ? (value / total) * 100 : 0;
            const slice = {
                type,
                color,
                label: investmentTypeLabels[
                    type as keyof typeof investmentTypeLabels
                ],
                value,
                percent,
                offset,
            };
            offset -= (percent / 100) * 100; // ajustar el offset para el siguiente arco
            return slice;
        })
        .filter((slice) => slice.value > 0);
});

// Tabla de inversiones: columnas visibles (nuevo formato)
const investmentHeaders = [
    {
        title: "Fondo",
        key: "name",
        align: "center" as const,
        sortable: true,
    },
    {
        title: "Cuotapartes",
        key: "quantity",
        align: "center" as const,
        sortable: true,
    },
    {
        title: "Precio",
        key: "price",
        align: "center" as const,
        sortable: true,
    },
    {
        title: "Variación",
        key: "variation",
        align: "center" as const,
        sortable: true,
    },
    {
        title: "Valor Total",
        key: "total_value",
        align: "center" as const,
        sortable: true,
    },
];

// Agregar estas variables al script setup
const currentPage = ref(1);
const itemsPerPage = ref(5);
</script>

<style scoped>
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
    font-size: 1.05rem;
    color: var(--text);
    border-bottom: 1px solid var(--border);
    text-align: center;
    vertical-align: middle;
    padding-top: 0.7rem;
    padding-bottom: 0.7rem;
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
.v-data-table .text-center {
    text-align: center !important;
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

.invertir-btn {
    margin-bottom: 2.2rem;
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.5rem 2.5rem;
    min-width: 200px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.investments-row {
    margin-top: 2rem;
}

.investments-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--text);
}

.investments-add-btn {
    margin-bottom: 2.2rem;
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.5rem 2.5rem;
    min-width: 200px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
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
    font-size: 1.05rem;
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
</style>
