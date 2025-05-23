<template>
    <v-container>
        <template v-if="securityStore.isLoggedIn">
            <v-row>
                <v-col cols="12" class="px-md-8">
                    <h1 class="transactions-title">Inversiones (Nueva Versión)</h1>
                </v-col>
            </v-row>

            <!-- Stats Cards -->
            <v-row>
                <v-col cols="12" md="6">
                    <v-card class="stats-card">
                        <v-card-title class="text-h6">Total Invertido</v-card-title>
                        <v-card-text>
                            <div class="stats-value">
                                {{ formatMoney(investmentStore.currentInvestment?.amount ?? 0) }}
                            </div>
                            <div class="stats-label">Saldo actual en inversiones</div>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <v-card class="stats-card">
                        <v-card-title class="text-h6">Tasa Diaria</v-card-title>
                        <v-card-text>
                            <div class="stats-value">
                                {{ investmentStore.dailyRate ? formatPercent(investmentStore.dailyRate) : '0.0000%' }}
                            </div>
                            <div class="stats-label">Tasa actual de retorno</div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Investment Forms -->
            <v-row class="mt-6">
                <v-col cols="12" md="6">
                    <v-card class="investment-form-card">
                        <v-card-title class="text-h6">Invertir</v-card-title>
                        <v-card-text>
                            <v-form @submit.prevent="handleInvest">
                                <v-text-field
                                    v-model="investAmount"
                                    label="Monto a invertir"
                                    type="number"
                                    :rules="[rules.required, rules.positive]"
                                    :error-messages="investError"
                                    :disabled="investmentStore.isLoading"
                                ></v-text-field>
                                <v-btn
                                    type="submit"
                                    color="primary"
                                    block
                                    :loading="investmentStore.isLoading"
                                    :disabled="!investAmount || investmentStore.isLoading"
                                >
                                    Invertir
                                </v-btn>
                            </v-form>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <v-card class="investment-form-card">
                        <v-card-title class="text-h6">Desinvertir</v-card-title>
                        <v-card-text>
                            <v-form @submit.prevent="handleDivest">
                                <v-text-field
                                    v-model="divestAmount"
                                    label="Monto a desinvertir"
                                    type="number"
                                    :rules="[rules.required, rules.positive]"
                                    :error-messages="divestError"
                                    :disabled="investmentStore.isLoading"
                                ></v-text-field>
                                <v-btn
                                    type="submit"
                                    color="error"
                                    block
                                    :loading="investmentStore.isLoading"
                                    :disabled="!divestAmount || investmentStore.isLoading"
                                >
                                    Desinvertir
                                </v-btn>
                            </v-form>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Daily Returns Table -->
            <v-row class="mt-6">
                <v-col cols="12">
                    <v-card>
                        <v-card-title class="text-h6">Historial de Retornos</v-card-title>
                        <v-card-text>
                            <v-data-table
                                :headers="returnHeaders"
                                :items="investmentStore.dailyReturns"
                                :loading="investmentStore.isLoading"
                                :items-per-page="investmentStore.pagination.pageSize"
                                :page="investmentStore.pagination.page"
                                :server-items-length="investmentStore.pagination.total"
                                @update:page="handlePageChange"
                                @update:items-per-page="handleItemsPerPageChange"
                            >
                                <template #item.date="{ item }">
                                    {{ formatDate(item.date) }}
                                </template>
                                <template #item.amount="{ item }">
                                    {{ formatMoney(item.amount) }}
                                </template>
                                <template #item.rate="{ item }">
                                    {{ formatPercent(item.rate) }}
                                </template>
                                <template #item.return="{ item }">
                                    {{ formatMoney(item.return) }}
                                </template>
                                <template #no-data>
                                    <div class="text-center pa-4">
                                        <p class="text-body-1 mb-2">No hay datos de retornos disponibles</p>
                                        <v-btn
                                            color="primary"
                                            @click="investmentStore.fetchDailyReturns()"
                                            :loading="investmentStore.isLoading"
                                        >
                                            Recargar datos
                                        </v-btn>
                                    </div>
                                </template>
                            </v-data-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

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
import { ref, onMounted } from 'vue';
import { useSecurityStore } from '@/stores/securityStore';
import { useInvestmentStore } from '@/stores/investmentStore';
import { useAccountStore } from '@/stores/accountStore';
import SuccessDialog from '@/components/ui/SuccessDialog.vue';

const securityStore = useSecurityStore();
const investmentStore = useInvestmentStore();
const accountStore = useAccountStore();

// Form state
const investAmount = ref('');
const divestAmount = ref('');
const investError = ref('');
const divestError = ref('');

// Success dialog state
const showSuccessDialog = ref(false);
const successDialog = ref({
    title: '',
    message: ''
});

// Table headers
const returnHeaders = [
    { title: 'Fecha', key: 'date', align: 'center' as const },
    { title: 'Monto', key: 'amount', align: 'center' as const },
    { title: 'Tasa', key: 'rate', align: 'center' as const },
    { title: 'Retorno', key: 'return', align: 'center' as const }
];

// Form validation rules
const rules = {
    required: (v: string) => !!v || 'Campo requerido',
    positive: (v: string) => parseFloat(v) > 0 || 'El monto debe ser positivo'
};

// Utility functions
function formatMoney(value: number) {
    return value.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatPercent(value: number) {
    if (!value || isNaN(value)) return '0.0000%';
    return (value * 100).toFixed(4) + '%';
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Event handlers
async function handleInvest() {
    try {
        const amount = parseFloat(investAmount.value);
        if (isNaN(amount) || amount <= 0) {
            investError.value = 'Monto inválido';
            return;
        }

        const balance = accountStore.account?.balance;
        if (!balance || amount > balance) {
            investError.value = 'Saldo insuficiente';
            return;
        }

        await investmentStore.invest(amount);
        await investmentStore.fetchDailyReturns();

        successDialog.value = {
            title: '¡Inversión exitosa!',
            message: 'La inversión fue realizada con éxito'
        };
        showSuccessDialog.value = true;
        investAmount.value = '';
        investError.value = '';
    } catch (error: any) {
        investError.value = error.message || 'Error al realizar la inversión';
    }
}

async function handleDivest() {
    try {
        const amount = parseFloat(divestAmount.value);
        if (isNaN(amount) || amount <= 0) {
            divestError.value = 'Monto inválido';
            return;
        }

        if (amount > (investmentStore.currentInvestment?.amount ?? 0)) {
            divestError.value = 'Monto mayor al invertido';
            return;
        }

        await investmentStore.divest(amount);
        await investmentStore.fetchDailyReturns();

        successDialog.value = {
            title: '¡Desinversión exitosa!',
            message: 'La desinversión fue realizada con éxito'
        };
        showSuccessDialog.value = true;
        divestAmount.value = '';
        divestError.value = '';
    } catch (error: any) {
        divestError.value = error.message || 'Error al realizar la desinversión';
    }
}

function handlePageChange(page: number) {
    investmentStore.fetchDailyReturns(page, investmentStore.pagination.pageSize);
}

function handleItemsPerPageChange(itemsPerPage: number) {
    investmentStore.fetchDailyReturns(1, itemsPerPage);
}

// Initialize data
onMounted(async () => {
    if (!securityStore.isLoggedIn) {
        successDialog.value = {
            title: 'Error',
            message: 'Por favor inicie sesión para ver sus inversiones'
        };
        showSuccessDialog.value = true;
        return;
    }

    try {
        // Ensure we have the current user
        const user = await securityStore.getCurrentUser();
        if (!user) {
            throw new Error('No se pudo obtener la información del usuario');
        }

        // Fetch account data
        await accountStore.fetchAccount();

        // Fetch investment data
        await Promise.all([
            investmentStore.fetchDailyRate(),
            investmentStore.fetchDailyReturns(1, 10)
        ]).catch(error => {
            console.error('Error loading investment data:', error);
            successDialog.value = {
                title: 'Error',
                message: 'Error al cargar los datos de inversiones: ' + error.message
            };
            showSuccessDialog.value = true;
        });
    } catch (error: any) {
        console.error('Error in onMounted:', error);
        successDialog.value = {
            title: 'Error',
            message: 'Error al cargar los datos: ' + error.message
        };
        showSuccessDialog.value = true;
    }
});
</script>

<style scoped>
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
    height: 100%;
}

.stats-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.5rem;
}

.stats-label {
    font-size: 1rem;
    color: var(--muted-text);
}

.investment-form-card {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.06);
    height: 100%;
}

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
</style> 