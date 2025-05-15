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
                    <v-data-table
                        :headers="headers"
                        :items="cards"
                        class="tarjetas-table"
                        hide-default-footer
                        item-value="id"
                        :loading="loading"
                    >
                        <template #no-data>
                            <div class="text-center pa-4">
                                {{
                                    loading
                                        ? "Cargando tarjetas..."
                                        : "No tienes tarjetas guardadas."
                                }}
                            </div>
                        </template>
                        <template #item="{ item }">
                            <tr>
                                <td class="transaction-icon-cell">
                                    <img
                                        :src="item.logo"
                                        :alt="item.brand"
                                        class="transaction-card-logo"
                                    />
                                </td>
                                <td class="transaction-description">
                                    <div class="nombre-align">
                                        <span class="tarjeta-name"
                                            >{{ item.brand }} *{{
                                                item.number_last4
                                            }}</span
                                        >
                                    </div>
                                </td>
                                <td class="transaction-date">
                                    <div class="expiry-align">
                                        <span class="tarjeta-expiry">{{
                                            item.expiry
                                        }}</span>
                                    </div>
                                </td>
                                <td class="text-right">
                                    <span
                                        class="delete-action"
                                        @click="deleteCard(item.id)"
                                        >Eliminar</span
                                    >
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                </div>
            </v-col>
        </v-row>

        <!-- Add Card Dialog (use component) -->
        <AddCardDialog
            :model-value="showDialog"
            @update:model-value="showDialog = $event"
            @card-added="fetchCards"
        />
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/plugins/supabase";
import { useAuthStore } from "@/store/auth";
import IconFilledButton from "@/components/ui/IconFilledButton.vue";
import AddCardDialog from "@/components/AddCardDialog.vue";
import type { Card } from "@/types/types";

const showDialog = ref(false);
const submitted = ref(false);
const loading = ref(false);
const cards = ref<Card[]>([]);
const noCards = ref(false);

const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id);

const headers = [
    { title: "", value: "logo", width: 60 },
    { title: "Nombre", value: "name", align: "start" as const },
    {
        title: "Vencimiento",
        value: "expiry",
        align: "end" as const,
        width: 120,
    },
    { title: "Acciones", value: "actions", align: "end" as const },
];

async function fetchCards() {
    if (!userId.value) return;
    loading.value = true;
    const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", userId.value)
        .order("created_at", { ascending: false });
    loading.value = false;
    if (error) {
        cards.value = [];
        noCards.value = true;
        return;
    }
    cards.value = (data || []).map((card) => ({
        ...card,
        brand: card.brand,
        name: `${card.brand} *${card.number_last4}`,
        expiry: card.expiry,
        logo: getBrandLogo(card.brand),
    }));
    noCards.value = cards.value.length === 0;
}

onMounted(fetchCards);

async function deleteCard(id: string) {
    await supabase.from("cards").delete().eq("id", id);
    await fetchCards();
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
    width: auto;
    min-width: 0;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 8px !important;
    padding-right: 0 !important;
}

.transaction-card-logo {
    width: 48px;
    height: 32px;
    object-fit: contain;
    display: block;
    margin: 0;
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
    background: linear-gradient(120deg, #232526 60%, #414345 100%);
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.18);
    color: #fff;
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
    color: #fff;
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
    color: #fff !important;
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
    padding-left: 32px;
}
.expiry-align {
    text-align: right;
    padding-right: 24px;
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
    color: #a00;
    cursor: pointer;
    font-weight: 500;
    transition: text-decoration 0.2s;
    display: inline-block;
}

.delete-action:hover {
    text-decoration: underline;
}
</style>
