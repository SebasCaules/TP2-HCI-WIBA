<template>
    <v-container class="pagos-container" fluid>
        <h1 class="pagos-title">Gestión de Pagos</h1>

        <v-card class="mb-6">
            <v-tabs
                v-model="activeTab"
                color="primary"
                align-tabs="center"
            >
                <v-tab value="create">Cobrar</v-tab>
                <v-tab value="pay">Pagar</v-tab>
            </v-tabs>

            <v-window v-model="activeTab">
                <v-window-item value="create">
                    <CreatePayment />
                </v-window-item>

                <v-window-item value="pay">
                    <PayPayment :initial-uuid="route.query.uuid as string" />
                </v-window-item>
            </v-window>
        </v-card>

        <v-divider class="my-6"></v-divider>

        <h2 class="text-h6 mb-4">Historial de Pagos</h2>
        <div class="d-flex align-center mb-4">
            <FilledButton
                class="ml-4"
                @click="loadPayments"
                :loading="loading"
            >
                Actualizar
            </FilledButton>
        </div>
        <BaseDataTable
            :items="payments"
            :headers="tableHeaders"
            :loading="loading"
            item-key="id"
            :items-per-page="paymentStore.pagination.pageSize"
            :pagination="true"
            no-data-message="No hay pagos disponibles"
            empty-icon="mdi-cash-multiple"
        >
            <template #item.description="{ item }">
                {{ item.description || 'Sin descripción' }}
            </template>
            <template #item.amount="{ item }">
                ${{ item.amount }}
            </template>
            <template #item.method="{ item }">
                {{ item.method || 'N/A' }}
            </template>
            <template #item.payer="{ item }">
                {{ item.payer ? `${item.payer.firstName} ${item.payer.lastName}` : 'N/A' }}
            </template>
            <template #item.receiver="{ item }">
                {{ item.receiver ? `${item.receiver.firstName} ${item.receiver.lastName}` : 'N/A' }}
            </template>
            <template #item.actions="{ item }">
                <v-btn
                    icon
                    @click="item.uuid && pushPayment(item.uuid)"
                    :disabled="loading || !item.uuid"
                >
                    <v-icon>mdi-send</v-icon>
                </v-btn>
            </template>
        </BaseDataTable>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { usePaymentStore } from "@/stores/paymentStore";
import { useRoute } from "vue-router";
import BaseDataTable from "@/components/ui/BaseDataTable.vue";
import FilledButton from "@/components/ui/FilledButton.vue";
import CreatePayment from "@/components/payment/CreatePayment.vue";
import PayPayment from "@/components/payment/PayPayment.vue";

const paymentStore = usePaymentStore();
const route = useRoute();
const loading = ref(false);
const activeTab = ref('create');

const tableHeaders = [
    { title: "Descripción", key: "description", align: "start" as const },
    { title: "Monto", key: "amount", align: "end" as const },
    { title: "Método", key: "method", align: "center" as const },
    { title: "Pagador", key: "payer", align: "start" as const },
    { title: "Receptor", key: "receiver", align: "start" as const },
    { title: "Acciones", key: "actions", align: "center" as const },
];

// Use computed to get payments from store
const payments = computed(() => paymentStore.payments);

async function loadPayments() {
    loading.value = true;
    try {
        await paymentStore.fetchPayments();
    } catch (err) {
        console.error('Error loading payments:', err);
    } finally {
        loading.value = false;
    }
}

async function pushPayment(uuid: string) {
    try {
        await paymentStore.confirmPayment(uuid);
        await loadPayments();
    } catch (err) {
        console.error('Error pushing payment:', err);
    }
}

onMounted(() => {
    // Fetch all payments when component mounts
    loadPayments();
    
    // If there's a UUID in the URL, switch to the pay tab
    if (route.query.uuid) {
        activeTab.value = 'pay';
    }
});
</script>

<style scoped>
.pagos-container {
    padding: 2rem;
    background-color: var(--background);
    min-height: 100vh;
}

.pagos-title {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 2rem;
    text-align: center;
    color: var(--primary-text);
}
</style>
