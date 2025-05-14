<template>
    <v-container fluid class="pagos-main">
        <v-row class="pagos-row" no-gutters>
            <v-col cols="12" class="px-md-8">
                <h1 class="pagos-title">Pago de Servicios</h1>
                <div class="card">
                    <v-data-table
                        :items="bills"
                        :headers="headers"
                        class="pagos-table"
                        :items-per-page="10"
                        :loading="loading"
                    >
                        <template #no-data>
                            <div class="text-center pa-4">
                                {{
                                    loading
                                        ? "Cargando facturas..."
                                        : "No hay facturas disponibles"
                                }}
                            </div>
                        </template>
                        <template v-slot:item="{ item }">
                            <tr>
                                <td class="pago-title">{{ item.title }}</td>
                                <td class="pago-provider">
                                    {{ item.provider }}
                                </td>
                                <td class="pago-amount">
                                    ${{
                                        item.amount.toLocaleString("es-AR", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })
                                    }}
                                </td>
                                <td class="pago-date">
                                    {{ formatDate(item.due_date) }}
                                </td>
                                <td class="pago-status">
                                    <v-chip
                                        :color="getStatusColor(item.status)"
                                        size="small"
                                        class="status-chip"
                                    >
                                        {{ getStatusText(item.status) }}
                                    </v-chip>
                                </td>
                                <td class="pago-actions">
                                    <v-btn
                                        v-if="item.status !== 'paid'"
                                        color="primary"
                                        size="small"
                                        @click="payBill(item.id)"
                                        :loading="payingBillId === item.id"
                                    >
                                        Pagar
                                    </v-btn>
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/store/auth";
import { getBills, updateBillStatus } from "@/services/bills";
import type { Bill } from "@/types/types";

const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id);

const bills = ref<Bill[]>([]);
const loading = ref(true);
const payingBillId = ref<string | null>(null);

const headers = [
    { title: "Título", key: "title", align: "start" as const },
    { title: "Proveedor", key: "provider", align: "start" as const },
    { title: "Monto", key: "amount", align: "end" as const },
    { title: "Vencimiento", key: "due_date", align: "end" as const },
    { title: "Estado", key: "status", align: "center" as const },
    { title: "Acciones", key: "actions", align: "end" as const },
];

async function fetchBills() {
    if (!userId.value) return;
    loading.value = true;
    try {
        bills.value = await getBills(userId.value);
    } catch (error) {
        console.error("Error fetching bills:", error);
    } finally {
        loading.value = false;
    }
}

async function payBill(billId: string) {
    if (!userId.value) return;
    payingBillId.value = billId;
    try {
        const { success } = await updateBillStatus(billId, "paid");
        if (success) {
            await fetchBills();
        }
    } catch (error) {
        console.error("Error paying bill:", error);
    } finally {
        payingBillId.value = null;
    }
}

function formatDate(date: string): string {
    if (!date) return "Fecha no disponible";
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime())
        ? "Fecha inválida"
        : parsedDate.toLocaleDateString("es-AR");
}

function getStatusColor(status: string): string {
    switch (status) {
        case "paid":
            return "success";
        case "pending":
            return "warning";
        case "overdue":
            return "error";
        default:
            return "grey";
    }
}

function getStatusText(status: string): string {
    switch (status) {
        case "paid":
            return "Pagado";
        case "pending":
            return "Pendiente";
        case "overdue":
            return "Vencido";
        default:
            return status;
    }
}

onMounted(fetchBills);
</script>

<style scoped>
.pagos-main {
    background: var(--background);
    min-height: 100vh;
}

.pagos-title {
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    font-family: var(--font-sans), sans-serif;
}

.pagos-table {
    background: transparent;
}

.pagos-table :deep(th),
.pagos-table :deep(td) {
    padding: 12px 16px !important;
}

.pagos-table :deep(th) {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text);
    white-space: nowrap;
    background-color: var(--card);
    border-bottom: none;
}

.pago-title {
    font-weight: 500;
}

.pago-provider {
    color: var(--muted-text);
}

.pago-amount {
    font-weight: 600;
    text-align: right;
}

.pago-date {
    color: var(--muted-text);
    text-align: right;
}

.pago-status {
    text-align: center;
}

.status-chip {
    font-weight: 500;
}

.pago-actions {
    text-align: right;
}
</style>
