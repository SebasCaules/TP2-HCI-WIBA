<template>
    <v-container fluid class="transactions-main">
        <v-row class="transactions-row" no-gutters>
            <v-col cols="12" class="px-md-8">
                <h1 class="transactions-title">Tarjetas</h1>
                <IconFilledButton
                    icon="mdi-plus"
                    class="tarjetas-add-btn"
                    @click="showDialog = true"
                >
                    Nueva Tarjeta
                </IconFilledButton>
                <div class="card">
                    <BaseDataTable
                        :headers="headers"
                        :items="cards"
                        :loading="loading"
                        empty-icon="mdi-credit-card-off"
                        no-data-message="No tienes tarjetas guardadas"
                    >
                        <template #item.logo="{ item }">
                            <div class="transaction-icon-cell">
                                <img
                                    :src="item.logo"
                                    :alt="item.brand"
                                    class="transaction-card-logo"
                                />
                            </div>
                        </template>

                        <template #item.name="{ item }">
                            <div class="nombre-align">
                                <span class="tarjeta-name">{{ item.name }}</span>
                            </div>
                        </template>

                        <template #item.expiry="{ item }">
                            <div class="expiry-align">
                                <span class="tarjeta-expiry">{{
                                    item.expiry
                                }}</span>
                            </div>
                        </template>

                        <template #item.actions="{ item }">
                            <div class="text-right">
                                <span
                                    class="delete-action"
                                    @click="deleteCard(item.id)"
                                    >Eliminar</span
                                >
                            </div>
                        </template>
                    </BaseDataTable>
                </div>
            </v-col>
        </v-row>

        <!-- Add Card Dialog (use component) -->
        <AddCardDialog
            :model-value="showDialog"
            @update:model-value="showDialog = $event"
            @card-added="handleCardAdded"
        />

        <!-- Delete Card Confirmation Dialog -->
        <v-dialog
            v-model="showDeleteDialog"
            max-width="400px"
            :retain-focus="false"
            :scrim="true"
        >
            <v-card class="delete-card-dialog">
                <div class="dialog-header">
                    <span class="dialog-title">Eliminar tarjeta</span>
                    <v-btn icon class="dialog-close-btn" @click="showDeleteDialog = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                <v-card-text class="delete-card-content">
                    <div class="delete-card-message">
                        ¿Estás seguro que deseas eliminar esta tarjeta? Esta acción no se puede deshacer.
                    </div>
                </v-card-text>
                <v-card-actions class="delete-card-actions">
                    <FilledButton
                        class="btn-secondary"
                        @click="showDeleteDialog = false"
                    >
                        Cancelar
                    </FilledButton>
                    <FilledButton
                        class="delete-card-confirm-btn"
                        color="error"
                        @click="confirmDeleteCard"
                    >
                        Eliminar
                    </FilledButton>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useCardsStore } from "@/stores/cardsStore";
import IconFilledButton from "@/components/ui/IconFilledButton.vue";
import BaseDataTable from "@/components/ui/BaseDataTable.vue";
import AddCardDialog from "@/components/AddCardDialog.vue";
import FilledButton from "@/components/ui/FilledButton.vue";

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const cardToDelete = ref<number | null>(null);
const cardsStore = useCardsStore();

const headers = [
    {
        title: "",
        key: "logo",
        width: "60px",
        align: "center" as const,
        class: "priority-high",
    },
    {
        title: "Nombre",
        key: "name",
        align: "start" as const,
        class: "priority-high",
    },
    {
        title: "Vencimiento",
        key: "expiry",
        align: "end" as const,
        width: "120px",
        class: "priority-medium",
    },
    {
        title: "Acciones",
        key: "actions",
        align: "end" as const,
        class: "priority-high",
    },
];

const cards = computed(() => {
    if (!cardsStore.cards) return [];
    return cardsStore.cards.map(card => {
        const cardType = card.type === 'CREDIT' ? 'Crédito' : 'Débito';
        const last4 = card.number.match(/\d{4}$/)?.[0] || '';
        return {
            ...card,
            brand: card.metadata?.brand || getCardBrand(card.number),
            name: `${cardType} *${last4}`,
            expiry: card.expirationDate,
            logo: getBrandLogo(card.metadata?.brand || getCardBrand(card.number)),
        };
    });
});

const loading = computed(() => cardsStore.isLoading);

async function fetchCards() {
    try {
        await cardsStore.fetchCards();
    } catch (error) {
        console.error('Error fetching cards:', error);
    }
}

onMounted(async () => {
    await fetchCards();
});

async function deleteCard(id: number) {
    cardToDelete.value = id;
    showDeleteDialog.value = true;
}

async function confirmDeleteCard() {
    if (!cardToDelete.value) return;
    
    try {
        await cardsStore.removeCard(cardToDelete.value);
        showDeleteDialog.value = false;
        cardToDelete.value = null;
    } catch (error) {
        console.error('Error deleting card:', error);
    }
}

function getCardBrand(number: string) {
    const n = number.replace(/\D/g, "");
    if (n.startsWith("4")) return "Visa";
    if (n.startsWith("5") || n.startsWith("2")) return "Mastercard";
    if (n.startsWith("3")) return "Amex";
    return "Desconocida";
}

function getBrandLogo(brand: string) {
    if (brand === "Visa")
        return "https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png";
    if (brand === "Mastercard")
        return "https://brandlogos.net/wp-content/uploads/2021/11/mastercard-logo.png";
    if (brand === "Amex")
        return "https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg";
    return transparentPixel;
}

const transparentPixel =
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
function handleCardAdded(card: any) {

    fetchCards();
}
</script>

<style scoped>
.transactions-main {
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
    font-family: var(--font-sans), sans-serif;
}

.tarjetas-add-btn {
    margin-bottom: 2.2rem;
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.5rem 2.5rem;
    min-width: 200px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.transactions-table {
    background: transparent;
    table-layout: fixed;
}

.transactions-table :deep(th),
.transactions-table :deep(td) {
    padding: 5px 0 !important;
}

.transactions-table :deep(th) {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text);
    white-space: nowrap;
    background-color: var(--card);
    border-bottom: none;
    font-family: var(--font-sans), sans-serif;
}

.transaction-icon-cell {
    width: 64px !important;
    min-width: 64px !important;
    height: var(--v-table-row-height) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
}

.transaction-card-logo {
    width: 40px !important;
    height: 28px !important;
    object-fit: contain !important;
    background: white !important;
    padding: 4px !important;
    border-radius: 4px !important;
    display: block !important;
    margin: 0 !important;
}

.transaction-description {
    font-weight: 500;
    padding-left: 0 !important;
    margin-left: 0 !important;
    padding-right: 16px !important;
    text-align: start !important;
}

.transaction-date {
    color: var(--muted-text);
    font-size: 0.95rem;
    text-align: start !important;
    padding-right: 16px !important;
    padding-left: 16px !important;
}

.transaction-actions {
    text-align: end !important;
    padding-right: 16px !important;
}

.tarjeta-name {
    font-weight: 500;
    font-size: 1rem;
    color: var(--text);
    font-family: var(--font-sans), sans-serif;
}

.tarjeta-expiry {
    color: var(--muted-text);
    font-size: 0.95rem;
    font-family: var(--font-sans), sans-serif;
}

.text-center {
    text-align: center;
    color: var(--muted-text);
    font-size: 1.1rem;
}

.add-card-dialog {
    padding: 2rem !important;
    border-radius: 1.5rem !important;
    overflow: hidden;
}
.add-card-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.2rem;
}
.add-card-dialog-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #232526;
    letter-spacing: 0.5px;
    font-family: var(--font-sans), sans-serif;
}
.add-card-form-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.card-preview-modern {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
    width: 100%;
}
.card-preview-bg-modern {
    width: 340px;
    height: 215px;
    border-radius: 18px;
    background: var(--linear-dark);
    box-shadow: var(--shadow-card-hover);
    color: var(--primary-foreground);
    font-family: "Menlo", "Consolas", monospace;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1.2rem;
    position: relative;
}
.card-preview-row {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
}
.card-preview-header {
    font-size: 1.1rem;
    font-family: "Inter", "Menlo", "Consolas", monospace;
    font-weight: 600;
    margin-bottom: 0.7rem;
}
.card-preview-title {
    letter-spacing: 1px;
}
.card-preview-logo-modern {
    width: 48px;
    height: 32px;
    object-fit: contain;
}
.card-preview-number-row {
    justify-content: flex-start;
    margin-bottom: 1.2rem;
}
.card-preview-number-modern {
    font-size: 1.05rem;
    letter-spacing: 2.2px;
    font-family: "Menlo", "Consolas", monospace;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 0.2rem;
}
.card-preview-bottom-modern {
    align-items: flex-end;
    margin-top: 1.2rem;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    position: relative;
}
.card-preview-name-modern {
    font-size: 1.05rem;
    font-family: "Inter", "Menlo", "Consolas", monospace;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    position: absolute;
    left: 0.2rem;
    bottom: 0;
    padding-left: 0;
    padding-bottom: 0.7rem;
    color: var(--primary-foreground);
    opacity: 0.92;
}
.card-preview-expiry-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: auto;
    position: absolute;
    right: 1.2rem;
    bottom: 0.7rem;
}
.card-preview-expiry-modern {
    font-size: 1.05rem;
    font-family: "Menlo", "Consolas", monospace;
    font-weight: 500;
    letter-spacing: 1px;
}
.add-card-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 0.7rem;
}
.add-card-form :deep(.custom-text-field-wrapper) {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
}
.add-card-input {
    width: 320px;
    margin-bottom: 1.1rem;
    text-align: center;
    font-family: var(--font-sans) !important;
    min-height: 56px;
}
.add-card-input input {
    font-family: var(--font-sans) !important;
}
.add-card-row {
    display: flex;
    gap: 0.7rem;
    width: 320px;
    margin-bottom: 0 !important;
    margin-top: 0 !important;
    padding: 0 !important;
}
.add-card-btn {
    width: 320px;
    margin-top: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.7rem 2.5rem;
    color: var(--primary-foreground) !important;
}
.add-card-error {
    color: var(--error);
    font-size: 0.98rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
    text-align: center;
    width: 100%;
    min-height: 1.5rem;
}
.nombre-align {
    padding-left: 0 !important;
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
}
.expiry-align {
    text-align: right !important;
    padding-right: 24px !important;
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
}

.tarjetas-table :deep(th) {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text);
    white-space: nowrap;
    background-color: var(--card);
    border-bottom: none;
    font-family: var(--font-sans), sans-serif;
}

.custom-table-header {
    font-weight: 700 !important;
    font-size: 1rem;
    color: var(--text);
    white-space: nowrap;
    background-color: #f5f6f7 !important;
    border-bottom: none;
    font-family: var(--font-sans), sans-serif;
}

.delete-action {
    color: var(--error);
    cursor: pointer;
    font-weight: 500;
    transition: text-decoration 0.2s;
    display: inline-block;
}

.delete-action:hover {
    text-decoration: underline;
}

:deep(.v-data-table) {
    --v-table-row-height: 56px;
}

:deep(.v-data-table__tr) {
    height: var(--v-table-row-height) !important;
}

:deep(.v-data-table__td) {
    height: var(--v-table-row-height) !important;
    padding: 0 16px !important;
    vertical-align: middle !important;
}

.delete-card-dialog {
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: var(--shadow-card);
    padding: 2rem 3rem;
}

.dialog-header {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1.5rem;
    width: 100%;
}

.dialog-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    font-family: var(--font-sans), sans-serif;
    text-align: center;
}

.dialog-close-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted-text) !important;
}

.delete-card-content {
    padding: 0 0 1.5rem 0;
}

.delete-card-message {
    font-size: 1.1rem;
    color: var(--text);
    text-align: center;
    font-family: var(--font-sans), sans-serif;
    line-height: 1.5;
}

.delete-card-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 0;
}

.delete-card-confirm-btn {
    background-color: var(--error) !important;
    color: white !important;
    min-width: 120px;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 1.5rem;
    padding: 0.8rem 2rem;
}

.btn-secondary {
    min-width: 120px !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    border-radius: 1.5rem !important;
    padding: 0.8rem 2rem !important;
}
</style>
