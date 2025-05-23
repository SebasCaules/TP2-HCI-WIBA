<template>
    <v-container class="pagos-container" fluid>
        <h1 class="pagos-title">Gestión de Pagos</h1>

        <v-row class="mb-6" justify="center" align="center" no-gutters>
            <v-col cols="12" sm="6" md="3" class="d-flex flex-column align-center">
                <v-btn
                    class="btn btn-primary circular-primary-btn mb-2"
                    @click="openDialog('pull')"
                >
                    <v-icon color="white">mdi-plus-circle</v-icon>
                </v-btn>
                <div class="text-body-2">Crear Orden</div>
            </v-col>
            <v-col cols="12" sm="6" md="3" class="d-flex flex-column align-center">
                <v-btn
                    class="btn btn-primary circular-primary-btn mb-2"
                    @click="openDialog('email')"
                >
                    <v-icon color="white">mdi-email</v-icon>
                </v-btn>
                <div class="text-body-2">Pagar por Email</div>
            </v-col>
            <v-col cols="12" sm="6" md="3" class="d-flex flex-column align-center">
                <v-btn
                    class="btn btn-primary circular-primary-btn mb-2"
                    @click="openDialog('cvu')"
                >
                    <v-icon color="white">mdi-bank</v-icon>
                </v-btn>
                <div class="text-body-2">Pagar por CVU</div>
            </v-col>
            <v-col cols="12" sm="6" md="3" class="d-flex flex-column align-center">
                <v-btn
                    class="btn btn-primary circular-primary-btn mb-2"
                    @click="openDialog('alias')"
                >
                    <v-icon color="white">mdi-account</v-icon>
                </v-btn>
                <div class="text-body-2">Pagar por Alias</div>
            </v-col>
        </v-row>

        <v-alert
            v-if="errorMessage"
            type="error"
            class="mb-4"
            dismissible
            @input="errorMessage = ''"
        >
            {{ errorMessage }}
        </v-alert>

        <!-- Form Dialog -->
        <v-dialog v-model="dialog.visible" max-width="500">
            <v-card>
                <v-card-title class="text-h6">{{ dialog.title }}</v-card-title>
                <v-card-text>
                    <v-text-field
                        v-if="dialog.type !== 'pull'"
                        v-model="form.to"
                        :label="dialog.toLabel"
                        :type="dialog.inputType || 'text'"
                    />
                    <v-text-field
                        v-model="form.description"
                        label="Descripción"
                    />
                    <v-text-field
                        v-model.number="form.amount"
                        label="Monto"
                        type="number"
                    />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="dialog.visible = false">Cancelar</v-btn>
                    <v-btn
                        class="pagos-btn"
                        @click="submitForm"
                        :loading="loading"
                        >Aceptar</v-btn
                    >
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-divider class="my-6"></v-divider>

        <h2 class="text-h6 mb-0">Historial de Pagos</h2>
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
import BaseDataTable from "@/components/ui/BaseDataTable.vue";
import FilledButton from "@/components/ui/FilledButton.vue";

const paymentStore = usePaymentStore();
const dialog = ref({
    visible: false,
    type: "",
    title: "",
    toLabel: "",
    inputType: "text",
});

const loading = ref(false);
const errorMessage = ref("");

const form = ref({
    to: "",
    description: "",
    amount: 0,
});

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

function openDialog(type: "pull" | "email" | "cvu" | "alias") {
    dialog.value.visible = true;
    dialog.value.type = type;
    form.value = { to: "", description: "", amount: 0 };

    switch (type) {
        case "pull":
            dialog.value.title = "Nueva Orden de Pago";
            dialog.value.toLabel = "";
            dialog.value.inputType = "text";
            break;
        case "email":
            dialog.value.title = "Pagar por Email";
            dialog.value.toLabel = "Email";
            dialog.value.inputType = "email";
            break;
        case "cvu":
            dialog.value.title = "Pagar por CVU";
            dialog.value.toLabel = "CVU";
            dialog.value.inputType = "text";
            break;
        case "alias":
            dialog.value.title = "Pagar por Alias";
            dialog.value.toLabel = "Alias";
            dialog.value.inputType = "text";
            break;
    }
}

async function submitForm() {
    if (!form.value.description.trim()) {
        errorMessage.value = "La descripción es obligatoria.";
        return;
    }
    if (form.value.amount <= 0) {
        errorMessage.value = "El monto debe ser mayor a 0.";
        return;
    }
    if (dialog.value.toLabel && !form.value.to.trim()) {
        errorMessage.value = `El campo ${dialog.value.toLabel} es obligatorio.`;
        return;
    }

    loading.value = true;
    try {
        const payload = {
            description: form.value.description,
            amount: form.value.amount,
            metadata: {},
        };

        switch (dialog.value.type) {
            case "pull":
                await paymentStore.createPayment(payload);
                break;
            case "email":
                await paymentStore.transferToEmail(form.value.to, payload);
                break;
            case "cvu":
                await paymentStore.transferToCvu(form.value.to, payload);
                break;
            case "alias":
                await paymentStore.transferToAlias(form.value.to, payload);
                break;
        }

        dialog.value.visible = false;
    } catch (err) {
        errorMessage.value = "Ocurrió un error al procesar el pago";
        console.error(err);
    } finally {
        loading.value = false;
    }
}

async function pushPayment(uuid: string) {
    try {
        await paymentStore.confirmPayment(uuid);
        alert("Push realizado con éxito");
    } catch (err) {
        errorMessage.value = "Error al realizar el push";
    }
}

async function loadPayments() {
    loading.value = true;
    try {
        await paymentStore.fetchPayments();
    } catch (err) {
        errorMessage.value = "No se pudieron obtener los pagos";
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadPayments();
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

.circular-primary-btn {
    border-radius: 50% !important;
    width: 64px !important;
    height: 64px !important;
    min-width: 64px !important;
    min-height: 64px !important;
    background-color: var(--primary) !important;
    color: var(--primary-foreground) !important;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 !important;
}

.circular-primary-btn .v-icon {
    font-size: 28px !important;
}

.circular-primary-btn:hover {
    background-color: var(--accent) !important;
}

.text-body-2 {
    color: var(--text);
    margin-top: 8px;
    text-align: center;
    width: 100%;
}

/* Remove the old pagos-btn styles since we're using the component.css styles */
</style>
