<template>
    <v-container class="transactions-container" fluid>
        <v-row class="transactions-row" no-gutters>
            <v-col cols="12" class="px-md-8">
                <h1 class="transactions-title">Transacciones</h1>

                <div class="transactions-toggle-wrapper">
                    <IconFilledButton
                        icon="mdi-table"
                        :variant="showTable ? 'primary' : 'secondary'"
                        @click="showTable = true"
                        class="transactions-toggle-btn"
                    >
                        Tabla
                    </IconFilledButton>
                    <IconFilledButton
                        icon="mdi-chart-bar"
                        :variant="!showTable ? 'primary' : 'secondary'"
                        @click="showTable = false"
                        class="transactions-toggle-btn"
                    >
                        Gráfico
                    </IconFilledButton>
                </div>

                <BaseDataTable
                    v-if="showTable"
                    :headers="headers"
                    :items="transactionStore.transactions"
                    :loading="transactionStore.loading"
                    @click:row="showTransactionDetails"
                >
                    <template #item.date="{ item }">
                        {{ formatDate(getTransactionDate(item), "day") }}
                    </template>
                    <template #item.description="{ item }">
                        <span>
                            <!-- Hay que hacer esto porque la api marca como pendiente los depósitos por alguna razon -->
                            {{
                                item.pending &&
                                !item.description?.includes("Depósito a cuenta")
                                    ? `Cobro: ${item.description ?? "-"}`
                                    : item.description ?? "-"
                            }}
                        </span>
                    </template>
                    <template #item.amount="{ item }">
                        <div class="amount-cell">
                            <span class="amount-icon-area">
                                <v-icon
                                    v-if="getAmountDisplay(item).icon"
                                    :color="
                                        getAmountDisplay(item).color === 'error'
                                            ? 'var(--error)'
                                            : getAmountDisplay(item).color ===
                                              'success'
                                            ? 'var(--success)'
                                            : 'warning'
                                    "
                                    size="small"
                                >
                                    {{ getAmountDisplay(item).icon }}
                                </v-icon>
                            </span>
                            <span
                                class="amount-value"
                                :class="{
                                    'text-error':
                                        getAmountDisplay(item).color ===
                                        'error',
                                    'text-success':
                                        getAmountDisplay(item).color ===
                                        'success',
                                    'text-warning':
                                        getAmountDisplay(item).color ===
                                        'warning',
                                }"
                            >
                                ${{ getAmountDisplay(item).amount.toFixed(2) }}
                            </span>
                        </div>
                    </template>
                    <template #item.status="{ item }">
                        <v-chip
                            :color="item.pending ? 'warning' : 'success'"
                            size="small"
                        >
                            {{ item.pending ? "Pendiente" : "Completada" }}
                        </v-chip>
                    </template>
                    <template #item.moreInfo="{ item }">
                        <v-btn
                            icon
                            variant="text"
                            @click.stop="showTransactionDetails(item)"
                            aria-label="Más información"
                        >
                            <v-icon color="var(--primary)"
                                >mdi-information-outline</v-icon
                            >
                        </v-btn>
                    </template>
                </BaseDataTable>

                <div v-else>
                    <canvas id="transactionChart"></canvas>
                </div>

                <v-pagination
                    v-if="showTable"
                    v-model="page"
                    :length="Math.ceil(totalCount / pageSize)"
                />
                <!-- Transaction Details Dialog -->
                <v-dialog v-model="showDetailsDialog" max-width="600px">
                    <v-card class="transaction-details-dialog">
                        <div class="transaction-details-header">
                            <span class="transaction-details-title">
                                {{
                                    selectedTransaction?.description ||
                                    "Detalle de la Transacción"
                                }}
                            </span>
                            <v-btn
                                icon
                                class="dialog-close-btn"
                                @click="showDetailsDialog = false"
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </div>
                        <v-card-text>
                            <v-list>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon
                                            icon="mdi-currency-usd"
                                        ></v-icon>
                                    </template>
                                    <v-list-item-title>Monto</v-list-item-title>
                                    <v-list-item-subtitle
                                        >${{
                                            Math.abs(
                                                selectedTransaction?.amount ?? 0
                                            ).toFixed(2)
                                        }}</v-list-item-subtitle
                                    >
                                </v-list-item>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-calendar"></v-icon>
                                    </template>
                                    <v-list-item-title>Fecha</v-list-item-title>
                                    <v-list-item-subtitle>{{
                                        formatDate(
                                            getTransactionDate(
                                                selectedTransaction
                                            )
                                        )
                                    }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-account"></v-icon>
                                    </template>
                                    <v-list-item-title>
                                        {{ counterpartyLabel }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ counterpartyName }}
                                    </v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item
                                    v-if="
                                        selectedTransaction &&
                                        isUserPayer(selectedTransaction)
                                    "
                                >
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-credit-card"></v-icon>
                                    </template>
                                    <v-list-item-title
                                        >Método</v-list-item-title
                                    >
                                    <v-list-item-subtitle>
                                        <template
                                            v-if="
                                                selectedTransaction.method ===
                                                    'CARD' &&
                                                selectedTransaction.card
                                            "
                                        >
                                            Tarjeta *{{
                                                selectedTransaction.card.number.slice(
                                                    -4
                                                )
                                            }}
                                        </template>
                                        <template v-else> Cuenta </template>
                                    </v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-information"></v-icon>
                                    </template>
                                    <v-list-item-title
                                        >Estado</v-list-item-title
                                    >
                                    <v-list-item-subtitle>
                                        <v-chip
                                            :color="
                                                selectedTransaction?.pending
                                                    ? 'warning'
                                                    : 'success'
                                            "
                                            size="small"
                                            variant="elevated"
                                        >
                                            {{
                                                selectedTransaction?.pending
                                                    ? "Pendiente"
                                                    : "Completada"
                                            }}
                                        </v-chip>
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-dialog>

                <!-- Pending Transaction Dialog -->
                <v-dialog v-model="showPendingDialog" max-width="500px">
                    <v-card class="transaction-details-dialog">
                        <div class="transaction-details-header">
                            <span class="transaction-details-title">
                                Cobro:
                                {{ selectedTransaction?.description || "-" }}
                            </span>
                            <v-btn
                                icon
                                class="dialog-close-btn"
                                @click="showPendingDialog = false"
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </div>
                        <v-card-text>
                            <v-list>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon
                                            icon="mdi-currency-usd"
                                        ></v-icon>
                                    </template>
                                    <v-list-item-title>Monto</v-list-item-title>
                                    <v-list-item-subtitle
                                        >${{
                                            Math.abs(
                                                selectedTransaction?.amount ?? 0
                                            ).toFixed(2)
                                        }}</v-list-item-subtitle
                                    >
                                </v-list-item>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-calendar"></v-icon>
                                    </template>
                                    <v-list-item-title>Fecha</v-list-item-title>
                                    <v-list-item-subtitle>{{
                                        formatDate(
                                            getTransactionDate(
                                                selectedTransaction
                                            )
                                        )
                                    }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-identifier"></v-icon>
                                    </template>
                                    <v-list-item-title
                                        >ID de pago</v-list-item-title
                                    >
                                    <v-list-item-subtitle>
                                        <v-btn
                                            icon
                                            size="small"
                                            variant="text"
                                            @click="
                                                copyUuid(
                                                    selectedTransaction?.uuid
                                                )
                                            "
                                            aria-label="Copiar UUID"
                                        >
                                            <v-icon>mdi-content-copy</v-icon>
                                        </v-btn>
                                    </v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-information"></v-icon>
                                    </template>
                                    <v-list-item-title
                                        >Estado</v-list-item-title
                                    >
                                    <v-list-item-subtitle>
                                        <v-chip
                                            color="warning"
                                            size="small"
                                            variant="elevated"
                                        >
                                            Pendiente
                                        </v-chip>
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-dialog>

                <!-- Deposit Dialog -->
                <v-dialog v-model="showDepositDialog" max-width="500px">
                    <v-card class="transaction-details-dialog">
                        <div class="transaction-details-header">
                            <span class="transaction-details-title">
                                Depósito
                            </span>
                            <v-btn
                                icon
                                class="dialog-close-btn"
                                @click="showDepositDialog = false"
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </div>
                        <v-card-text>
                            <v-list>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon
                                            icon="mdi-currency-usd"
                                        ></v-icon>
                                    </template>
                                    <v-list-item-title>Monto</v-list-item-title>
                                    <v-list-item-subtitle
                                        >${{
                                            Math.abs(
                                                selectedTransaction?.amount ?? 0
                                            ).toFixed(2)
                                        }}</v-list-item-subtitle
                                    >
                                </v-list-item>
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-calendar"></v-icon>
                                    </template>
                                    <v-list-item-title>Fecha</v-list-item-title>
                                    <v-list-item-subtitle>{{
                                        formatDate(
                                            getTransactionDate(
                                                selectedTransaction
                                            )
                                        )
                                    }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item v-if="selectedTransaction?.card">
                                    <template v-slot:prepend>
                                        <v-icon icon="mdi-credit-card"></v-icon>
                                    </template>
                                    <v-list-item-title
                                        >Tarjeta</v-list-item-title
                                    >
                                    <v-list-item-subtitle
                                        >*{{
                                            selectedTransaction.card.number.slice(
                                                -4
                                            )
                                        }}</v-list-item-subtitle
                                    >
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-dialog>

                <v-snackbar v-model="snackbar" :timeout="2000">{{
                    snackbarText
                }}</v-snackbar>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick, computed } from "vue";
import { useTransactionStore } from "@/stores/transactionStore";
import { useSecurityStore } from "@/stores/securityStore";
import BaseDataTable from "@/components/ui/BaseDataTable.vue";
import IconFilledButton from "@/components/ui/IconFilledButton.vue";
import { Chart, registerables } from "chart.js";
import type { Payment } from "@/api/payment";

Chart.register(...registerables);

const transactionStore = useTransactionStore();
const securityStore = useSecurityStore();
const currentUserIdRef = computed(() => securityStore.user?.id?.toString());

const showTable = ref(true);
const showDetailsDialog = ref(false);
const showPendingDialog = ref(false);
const showDepositDialog = ref(false);
const selectedTransaction = ref<Payment | null>(null);
let chartInstance: Chart | null = null;

const page = ref(1);
const pageSize = ref(10);
const totalCount = computed(
    () => transactionStore.transactionsResponse?.paging?.totalCount || 0
);

const headers = [
    {
        title: "Descripción",
        key: "description",
        width: "300px",
        align: "start" as const,
    },
    { title: "Monto", key: "amount", width: "150px", align: "end" as const },
    { title: "Fecha", key: "date", width: "180px", align: "center" as const },
    { title: "", key: "moreInfo", width: "80px", align: "center" as const },
];

const snackbar = ref(false);
const snackbarText = ref("");

function getTransactionDate(item: any): string {
    return item.metadata?.timestamp || item.created_at;
}

function formatDate(dateStr: string, format: "full" | "day" = "full"): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (format === "day") {
        return date.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }
    return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function showTransactionDetails(transaction: Payment) {
    selectedTransaction.value = transaction;

    if (transaction.description?.includes("Depósito")) {
        showDepositDialog.value = true;
    } else if (transaction.pending) {
        showPendingDialog.value = true;
    } else {
        showDetailsDialog.value = true;
    }
}

async function renderChart() {
    const ctx = document.getElementById(
        "transactionChart"
    ) as HTMLCanvasElement;
    if (!ctx) return;
    if (chartInstance) chartInstance.destroy();

    // Fetch transactions with the specified parameters
    await transactionStore.fetchTransactions({ page: 1, pageSize: 1000 });

    let entrada = 0;
    let salida = 0;

    for (const tx of transactionStore.transactions) {
        const isDeposit = tx.description?.includes("Depósito");
        const isPayer = tx.payer?.id?.toString() === currentUserIdRef.value;

        if ((isDeposit || !isPayer) && (!tx.pending || isDeposit)) {
            entrada += tx.amount;
        } else if (!isDeposit && isPayer) {
            salida += tx.amount;
        }
    }

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Entrada", "Salida"],
            datasets: [
                {
                    label: "Movimientos",
                    data: [entrada, salida],
                    backgroundColor: ["#22c55e", "#ef4444"],
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        },
    });
}

watch(showTable, async (val) => {
    if (!val) await nextTick(renderChart);
});

function fetchWithPagination() {
    transactionStore.fetchTransactions({
        page: page.value,
        pageSize: pageSize.value,
    });
}

onMounted(fetchWithPagination);
watch([page, pageSize], fetchWithPagination);

function isUserPayer(transaction: Payment): boolean {
    return transaction.payer?.id?.toString() === currentUserIdRef.value;
}

function getAmountDisplay(transaction: Payment): {
    amount: number;
    icon: string;
    color: string;
} {
    const isPayer = isUserPayer(transaction);
    const isDeposit = transaction.description?.includes("Depósito");

    if (isDeposit) {
        return {
            amount: Math.abs(transaction.amount),
            icon: "mdi-plus",
            color: "success",
        };
    }

    if (transaction.pending) {
        return {
            amount: Math.abs(transaction.amount),
            icon: "mdi-clock-outline",
            color: "warning",
        };
    }

    return {
        amount: Math.abs(transaction.amount),
        icon: isPayer ? "mdi-minus" : "mdi-plus",
        color: isPayer ? "error" : "success",
    };
}

const counterpartyLabel = computed(() => {
    if (!selectedTransaction.value || !securityStore.user) return "-";
    const userId = Number(securityStore.user.id);
    return selectedTransaction.value.payer.id === userId
        ? "Destinatario"
        : "Remitente";
});

const counterpartyName = computed(() => {
    if (!selectedTransaction.value || !securityStore.user) return "-";
    const userId = Number(securityStore.user.id);
    const isPayer = selectedTransaction.value.payer.id === userId;
    return isPayer
        ? `${selectedTransaction.value.receiver.firstName} ${selectedTransaction.value.receiver.lastName}`
        : `${selectedTransaction.value.payer.firstName} ${selectedTransaction.value.payer.lastName}`;
});

function copyUuid(uuid?: string) {
    if (!uuid) return;
    navigator.clipboard.writeText(uuid);
    snackbarText.value = "UUID copiado al portapapeles";
    snackbar.value = true;
}
</script>

<style scoped>
.transactions-container {
    padding: 0;
    background-color: var(--background);
    min-height: 100vh;
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

.transactions-card {
    border-radius: 1rem;
    padding: 1rem;
    background-color: white;
}

:deep(.v-data-table) {
    table-layout: fixed;
}

:deep(.v-data-table th) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

:deep(.v-data-table td) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

:deep(.v-data-table td.description-cell) {
    white-space: normal;
    word-break: break-word;
    overflow: visible;
}

:deep(.v-data-table td.amount-cell) {
    text-align: center;
}

:deep(.v-data-table tr) {
    cursor: pointer;
}

:deep(.v-data-table tr:hover) {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.04));
}

.text-error {
    color: var(--error) !important;
}

.v-list-item {
    padding: 12px 16px;
}

.v-list-item-title {
    font-weight: 600;
    color: var(--text-muted);
    font-size: 0.875rem;
}

.v-list-item-subtitle {
    color: var(--text);
    font-size: 1rem;
}

.metadata-pre {
    font-family: monospace;
    font-size: 0.875rem;
    white-space: pre-wrap;
    word-break: break-word;
    background-color: var(--background);
    padding: 8px;
    border-radius: 4px;
    margin: 0;
}

.amount-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
}

.amount-icon-area {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5em; /* Fixed width for icon area */
    min-width: 1.5em;
    margin-right: 0.2em;
}

.amount-value {
    display: inline-block;
    min-width: 60px;
    text-align: right;
}

.transaction-details-dialog {
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.1);
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 2.5rem;
}
.transaction-details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
}
.transaction-details-title {
    font-size: 1.4rem;
    font-weight: 700;
    font-family: var(--font-sans), sans-serif;
}
.dialog-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
}

:deep(.v-selection-control__track.icon-muted) {
    background-color: var(--icon-muted) !important;
}

:deep(.v-selection-control__thumb.icon-muted) {
    background-color: var(--icon-muted) !important;
}

.transactions-toggle-wrapper {
    display: flex;
    gap: 1rem;
    margin-bottom: 2.2rem;
    justify-content: flex-start;
    width: fit-content;
}

.transactions-toggle-btn {
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.5rem 1.8rem;
    min-width: 160px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
