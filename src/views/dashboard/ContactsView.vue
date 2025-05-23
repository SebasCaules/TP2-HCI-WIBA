<template>
    <v-container fluid class="transactions-main">
        <v-row class="transactions-row" no-gutters>
            <v-col cols="12" class="px-md-8">
                <h1 class="transactions-title">Contactos</h1>
                <IconFilledButton
                    icon="mdi-plus"
                    class="contacts-add-btn"
                    @click="showDialog = true"
                >
                    Nuevo Contacto
                </IconFilledButton>
                <div class="card">
                    <BaseDataTable
                        :items="contacts"
                        :headers="headers"
                        :items-per-page="5"
                        :loading="contactsLoading"
                        empty-icon="mdi-account-group"
                        no-data-message="No hay contactos disponibles"
                    >
                        <template #item.name="{ item }">
                            <div class="d-flex align-items-center">
                                <div class="contact-avatar">
                                    {{ item.initials }}
                                </div>
                                <span class="contact-name">
                                    {{ item.first_name }} {{ item.last_name }}
                                </span>
                            </div>
                        </template>

                        <template #item.username="{ item }">
                            {{ item.username }}
                        </template>

                        <template #item.actions="{ item }">
                            <div class="text-right">
                                <span class="delete-action" @click="handleRemoveContact(item.id)">
                                    Eliminar
                                </span>
                            </div>
                        </template>
                    </BaseDataTable>
                </div>
            </v-col>
        </v-row>

        <AddContactDialog
            v-model="showDialog"
            @contact-found="onContactFound"
        />
        <ConfirmContactDialog
            v-model="showConfirmDialog"
            :contact="contactToConfirm"
            @confirm="confirmContact"
            @back="showConfirmDialog = false; showDialog = true;"
            @cancel="cancelContact"
        />
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useSecurityStore } from "@/stores/securityStore";
import IconFilledButton from "@/components/ui/IconFilledButton.vue";
import BaseDataTable from "@/components/ui/BaseDataTable.vue";
import AddContactDialog from "@/components/AddContactDialog.vue";
import ConfirmContactDialog from "@/components/ConfirmContactDialog.vue";
import { fetchContacts, removeContact, addContact, loading as contactsLoading } from "@/services/contacts";
import type { Contact } from "@/types/types";
import { useRouter } from "vue-router";

const router = useRouter();
const securityStore = useSecurityStore();
const userId = computed(() => securityStore.user?.id?.toString());

const contacts = ref<Contact[]>([]);
const headers = [
    { key: "name", title: "Nombre", align: "start" as const },
    { key: "username", title: "Usuario", align: "start" as const },
    { key: "actions", title: "Acciones", align: "end" as const },
];

const showDialog = ref(false);
const showConfirmDialog = ref(false);
const contactToConfirm = ref<Contact | null>(null);

async function loadContacts() {
    if (!userId.value) {
        console.error("No user ID available");
        return;
    }

    try {
        const { contacts: fetchedContacts } = await fetchContacts(userId.value);
        contacts.value = fetchedContacts;
    } catch (error) {
        console.error("Error loading contacts:", error);
    }
}

async function handleRemoveContact(contactId: string) {
    if (!userId.value) return;

    const success = await removeContact(userId.value, contactId);
    if (success) {
        await loadContacts();
    }
}

function onContactFound(contact: Contact) {
    contactToConfirm.value = contact;
    showDialog.value = false;
    showConfirmDialog.value = true;
}

async function confirmContact() {
    if (!userId.value || !contactToConfirm.value) return;
    
    try {
        const result = await addContact(
            userId.value,
            contactToConfirm.value.id,
            contactToConfirm.value.first_name,
            contactToConfirm.value.last_name
        );

        if (!result.success) {
            // Show error in the dialog
            if (contactToConfirm.value) {
                contactToConfirm.value.error = result.error;
            }
            return;
        }

        showConfirmDialog.value = false;
        await loadContacts();
    } catch (error) {
        console.error('Error adding contact:', error);
        if (contactToConfirm.value) {
            contactToConfirm.value.error = 'Error al agregar el contacto';
        }
    }
}

function cancelContact() {
    showConfirmDialog.value = false;
}

// Watch for authentication state changes
watch(() => securityStore.isLoggedIn, (isLoggedIn) => {
    if (!isLoggedIn) {
        router.push('/login');
    }
});

onMounted(async () => {
    if (!securityStore.isLoggedIn) {
        router.push('/login');
        return;
    }
    await loadContacts();
});
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

.contacts-add-btn {
    margin-bottom: 2.2rem;
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.5rem 2.5rem;
    min-width: 200px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.contacts-table {
    background: transparent;
}

.contacts-table :deep(th) {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text);
    white-space: nowrap;
    background-color: var(--card);
    border-bottom: none;
    font-family: var(--font-sans), sans-serif;
}

.text-center {
    text-align: center;
    color: var(--muted-text);
    font-size: 1.1rem;
}

.contact-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--text);
    font-size: 1.1rem;
    margin-right: 16px;
}
.contact-name {
    margin-left: 8px;
    display: flex;
    align-items: center;
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
</style>
