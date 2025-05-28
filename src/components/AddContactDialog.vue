<template>
  <v-dialog v-model="dialog" max-width="500px" :retain-focus="false" :scrim="true">
    <v-card class="add-contact-dialog" width="100%">
      <div class="dialog-header" style="justify-content: center; text-align: center; width: 100%;">
        <span class="dialog-title" style="margin: 0 auto; display: block;">Agregar Contacto</span>
        <v-btn icon class="dialog-close-btn" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <v-card-text style="padding-bottom: 0;">
        <v-form ref="form" @submit.prevent="handleSubmit">
          <CustomTextField
            v-model="accountIdentifier"
            placeholder="CVU o Alias"
            :rules="[
              (v: string) => !!v || 'Este campo es requerido',
              (v: string) => !isCvu(v) || v.length === 20 || 'El CVU debe tener 20 caracteres (letras mayúsculas excepto I y números)'
            ]"
            :error-messages="errorMessage"
            required
            class="contact-input"
            @input="errorMessage = ''"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <FilledButton
          :loading="loading"
          :disabled="!accountIdentifier || (isCvu(accountIdentifier) && accountIdentifier.length !== 20)"
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
import { ref, watch, computed, onMounted } from 'vue';
import FilledButton from '@/components/ui/FilledButton.vue';
import CustomTextField from '@/components/ui/CustomTextField.vue';
import { useSecurityStore } from '@/stores/securityStore';
import { useAccountStore } from '@/stores/accountStore';
import type { Contact } from '@/types/types';
import { useRouter } from 'vue-router';

const props = defineProps<{
  modelValue: boolean
}>();

const emit = defineEmits<{
  'update:model-value': [value: boolean]
  'contact-found': [contact: Contact]
}>();

const router = useRouter();
const dialog = ref(props.modelValue);
const loading = ref(false);
const accountIdentifier = ref('');
const errorMessage = ref('');
const form = ref<any>(null);

const securityStore = useSecurityStore();
const accountStore = useAccountStore();

// Get current user ID and account info
const currentUserId = computed(() => securityStore.user?.id?.toString());
const userCvu = computed(() => accountStore.account?.cvu);
const userAlias = computed(() => accountStore.account?.alias);

// Load account info on mount
onMounted(async () => {
    try {
        await accountStore.fetchAccount();
    } catch (error) {
        console.error('Error fetching account:', error);
    }
});

// Watch for authentication state changes
watch(() => securityStore.isLoggedIn, (isLoggedIn) => {
  if (!isLoggedIn) {
    closeDialog();
    router.push('/login');
  }
});

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
  resetForm();
}

function resetForm() {
  accountIdentifier.value = '';
  errorMessage.value = '';
  if (form.value) {
    form.value.resetValidation();
  }
}

function isCvu(value: string): boolean {
  // CVU format: 20 characters, only uppercase letters (except I) and numbers
  const cvuRegex = /^[A-HJ-Z0-9]{20}$/;
  return cvuRegex.test(value);
}

async function handleSubmit() {
  if (!accountIdentifier.value) return;
  
  // Check authentication
  if (!securityStore.isLoggedIn) {
    errorMessage.value = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
    setTimeout(() => {
      closeDialog();
      router.push('/login');
    }, 2000);
    return;
  }

  if (!currentUserId.value) {
    errorMessage.value = 'Error al obtener información del usuario. Por favor, vuelve a iniciar sesión.';
    setTimeout(() => {
      closeDialog();
      router.push('/login');
    }, 2000);
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    let userData;
    
    if (isCvu(accountIdentifier.value)) {
      userData = await accountStore.verifyCvu(accountIdentifier.value);
    } else {
      userData = await accountStore.verifyAlias(accountIdentifier.value);
    }

    // Create a contact object and emit it
    const contact: Contact = {
      id: accountIdentifier.value,
      first_name: userData.firstName,
      last_name: userData.lastName,
      username: accountIdentifier.value,
      initials: userData.firstName.charAt(0).toUpperCase() + userData.lastName.charAt(0).toUpperCase(),
      account_number: isCvu(accountIdentifier.value) ? accountIdentifier.value : undefined,
      type: isCvu(accountIdentifier.value) ? 'cvu' : 'alias',
      addedAt: new Date().toISOString()
    };

    emit('contact-found', contact);
    closeDialog();
  } catch (error: any) {
    console.error('Error in handleSubmit:', error);
    if (error?.response?.status === 401) {
      errorMessage.value = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
      setTimeout(() => {
        closeDialog();
        router.push('/login');
      }, 2000);
    } else {
      errorMessage.value = error.message || 'Error al buscar el contacto';
    }
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