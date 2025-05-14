<template>
  <v-dialog v-model="dialog" max-width="500px" :retain-focus="false" :scrim="true">
    <v-card class="add-contact-dialog" width="100%">
      <div class="dialog-header">
        <span class="dialog-title">Agregar Contacto</span>
        <v-btn icon class="dialog-close-btn" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <v-card-text style="padding-bottom: 0;">
        <v-form ref="form" @submit.prevent="handleSubmit">
          <CustomTextField
            v-model="accountIdentifier"
            placeholder="Usuario o número de cuenta"
            :rules="[(v: string) => !!v || 'Este campo es requerido']"
            :error-messages="errorMessage"
            required
            class="contact-input"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <FilledButton
          :loading="loading"
          :disabled="!accountIdentifier"
          @click="handleSubmit"
          class="action-button"
        >
          Agregar
        </FilledButton>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { supabase } from '@/plugins/supabase';
import FilledButton from '@/components/ui/FilledButton.vue';
import CustomTextField from '@/components/ui/CustomTextField.vue';
import { useAuthStore } from '@/store/auth';

const props = defineProps<{
  modelValue: boolean
}>();

const emit = defineEmits<{
  'update:model-value': [value: boolean]
  'contact-added': []
}>();

const dialog = ref(props.modelValue);
const loading = ref(false);
const accountIdentifier = ref('');
const errorMessage = ref('');
const form = ref<any>(null);

const authStore = useAuthStore();
const currentUserId = authStore.user?.id;

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal;
});

watch(dialog, (newVal) => {
  emit('update:model-value', newVal);
  if (!newVal) {
    resetForm();
  }
});

function closeDialog() {
  dialog.value = false;
}

function resetForm() {
  accountIdentifier.value = '';
  errorMessage.value = '';
  if (form.value) {
    form.value.resetValidation();
  }
}

async function handleSubmit() {
  if (!accountIdentifier.value) return;
  if (!currentUserId) {
    errorMessage.value = 'Usuario no autenticado';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    // Try to find the user by username first
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', accountIdentifier.value)
      .single();

    // If no user found by username, try account number
    if (!userData) {
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('user_id')
        .eq('account_number', accountIdentifier.value)
        .single();

      if (accountData) {
        userData = { id: accountData.user_id };
      }
    }

    if (!userData) {
      errorMessage.value = 'Usuario o número de cuenta no encontrado';
      return;
    }

    // Check if trying to add self as contact
    if (userData.id === currentUserId) {
      errorMessage.value = 'No puedes agregarte a ti mismo como contacto';
      return;
    }

    // Add to contacts
    const { error: contactError } = await supabase
      .from('user_contacts')
      .insert({
        user_id: currentUserId,
        contact_id: userData.id,
        created_at: new Date().toISOString()
      });

    if (contactError) {
      if (contactError.code === '23505') { // Unique constraint error
        errorMessage.value = 'Este contacto ya existe en tu lista';
      } else {
        errorMessage.value = 'Error al agregar el contacto';
        console.error('Error adding contact:', contactError);
      }
      return;
    }

    emit('contact-added');
    closeDialog();
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    errorMessage.value = 'Error al agregar el contacto';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.add-contact-dialog {
  padding: 2rem 3rem;
  border-radius: 2rem !important;
  overflow: visible;
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.10);
  width: 100%;
  margin: 0 auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.dialog-close-btn {
  color: var(--muted-text) !important;
  margin-right: -8px;
}

.contact-input {
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
  margin-bottom: 1rem;
}

.dialog-actions {
  padding: 0.5rem 0 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-button {
  width: 100%;
  max-width: 340px;
}

:deep(.v-text-field) {
  margin-bottom: 1rem;
}

.error-message {
  color: var(--error);
  font-size: 0.95rem;
  margin-top: 0.5rem;
  text-align: center;
  max-width: 340px;
}
</style> 