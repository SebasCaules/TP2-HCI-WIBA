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
                    @click="removeContact(item.id)"
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
      @contact-added="fetchContacts"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/plugins/supabase';
import { useAuthStore } from '@/store/auth';
import IconFilledButton from '@/components/ui/IconFilledButton.vue';
import AddContactDialog from '@/components/AddContactDialog.vue';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface ContactResponse {
  contact_id: string;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

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

async function fetchContacts() {
  if (!userId) {
    console.error('No user ID available');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('user_contacts')
      .select(`
        contact_id,
        contact:users!user_contacts_contact_id_fkey (
          id,
          first_name,
          last_name,
          username
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }

    if (data) {
      const typedData = (data as unknown) as ContactResponse[];
      contacts.value = typedData.map(row => ({
        id: row.contact.id,
        first_name: row.contact.first_name,
        last_name: row.contact.last_name,
        username: row.contact.username
      }));
    } else {
      contacts.value = [];
    }
  } catch (error) {
    console.error('Unexpected error fetching contacts:', error);
  } finally {
    loading.value = false;
  }
}

async function removeContact(contactId: string) {
  if (!userId) return;
  
  try {
    const { error } = await supabase
      .from('user_contacts')
      .delete()
      .eq('user_id', userId)
      .eq('contact_id', contactId);

    if (error) {
      console.error('Error removing contact:', error);
      return;
    }

    await fetchContacts();
  } catch (error) {
    console.error('Error removing contact:', error);
  }
}

onMounted(async () => {
  loading.value = true;
  await fetchContacts();
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