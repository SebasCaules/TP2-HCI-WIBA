<template>
  <v-container fluid class="transactions-main">
    <v-row class="transactions-row" no-gutters>
      <v-col cols="12" class="px-md-8">
        <h1 class="transactions-title">Contactos</h1>
        <IconFilledButton icon="mdi-plus" class="contacts-add-btn" @click="showDialog = true">
          Nuevo Contacto
        </IconFilledButton>
        <div class="card">
          <v-data-table
            :items="contacts"
            :headers="headers"
            class="contacts-table"
            :items-per-page="5"
            :loading="loading"
          >
            <template v-slot:no-data>
              <div class="text-center pa-4">
                {{ loading ? 'Cargando contactos...' : 'No hay contactos disponibles' }}
              </div>
            </template>
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ item.first_name }} {{ item.last_name }}</td>
                <td>{{ item.username }}</td>
                <td class="text-right">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="handleRemoveContact(item.id)"
                    title="Eliminar contacto"
                  ></v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </div>
      </v-col>
    </v-row>

    <!-- Add Contact Dialog -->
    <AddContactDialog
      v-model="showDialog"
      @contact-added="loadContacts"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import IconFilledButton from '@/components/ui/IconFilledButton.vue';
import AddContactDialog from '@/components/AddContactDialog.vue';
import { fetchContacts, removeContact } from '@/services/contacts';
import type { Contact } from '@/types/types';

const authStore = useAuthStore();
const userId = authStore.user?.id;

const contacts = ref<Contact[]>([]);
const loading = ref(true);
const showDialog = ref(false);

const headers = [
  { key: 'name', title: 'Nombre', align: 'start' as const },
  { key: 'username', title: 'Usuario', align: 'start' as const },
  { key: 'actions', title: 'Acciones', align: 'end' as const }
];

async function loadContacts() {
  if (!userId) {
    console.error('No user ID available');
    return;
  }

  loading.value = true;
  try {
    const { contacts: fetchedContacts } = await fetchContacts(userId);
    contacts.value = fetchedContacts;
  } catch (error) {
    console.error('Error loading contacts:', error);
  } finally {
    loading.value = false;
  }
}

async function handleRemoveContact(contactId: string) {
  if (!userId) return;
  
  const success = await removeContact(userId, contactId);
  if (success) {
    await loadContacts();
  }
}

onMounted(async () => {
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
</style> 