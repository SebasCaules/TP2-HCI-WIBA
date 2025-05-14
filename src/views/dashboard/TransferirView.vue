<template>
  <v-container class="transfer-container" fluid>
    <BackButton to="/dashboard" class="transfer-back-btn" />
    <div class="transfer-content">
      <h1 class="transfer-title">Transferir</h1>
      <div class="transfer-form-group">
        <CustomTextField
          v-model="recipient"
          placeholder="Usuario o número de cuenta"
          class="transfer-recipient-input"
        >
          <template #right>
            <v-btn icon class="recipient-contact-btn" @click="showContactDialog = true" style="margin-right: -0.6rem;">
              <v-icon>mdi-account-multiple</v-icon>
            </v-btn>
          </template>
        </CustomTextField>
      </div>
      <div class="transfer-form-group">
        <CustomTextField
          v-model="amount"
          type="number"
          placeholder="Monto"
          class="transfer-amount-input"
          @input="formatAmount"
        />
      </div>
      <div class="transfer-form-group">
        <CustomTextField
          v-model="reason"
          placeholder="Motivo (opcional)"
          class="transfer-reason-input"
        />
      </div>
      <FilledButton class="transfer-continue-btn" @click="handleTransfer" :disabled="!isTransferValid">
        Continuar
      </FilledButton>
      <div v-if="errorMessage" class="transfer-error-message">{{ errorMessage }}</div>
    </div>

    <!-- Contact Picker Dialog -->
    <v-dialog v-model="showContactDialog" max-width="960px" :retain-focus="false" :scrim="true" style="border-radius: 1.5rem;">
      <v-card class="select-contact-dialog">
        <div class="select-contact-dialog-header">
          <span class="select-contact-title">Seleccionar contacto</span>
          <v-btn icon class="dialog-close-btn" @click="showContactDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="select-contact-list-custom">
          <template v-if="contacts.length > 0">
            <div
              v-for="contact in contacts"
              :key="contact.id"
              class="select-contact-custom"
            >
              <div class="select-contact-info" @click="selectContact(contact)">
                <div class="select-contact-name">{{ contact.name }}</div>
                <div class="select-contact-detail">{{ contact.username }}</div>
              </div>
              <v-btn 
                icon 
                color="error" 
                variant="text" 
                class="remove-contact-btn"
                @click="removeContact(contact.id)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </template>
          <div v-else class="no-contacts-message">
            <v-icon size="48" color="primary">mdi-account-multiple</v-icon>
            <div class="no-contacts-title">No tienes contactos guardados</div>
            <div class="no-contacts-subtitle">Agrega contactos para transferir más rápido</div>
          </div>
        </div>
        <div class="select-contact-actions" style="display: flex; justify-content: center; margin-top: 1.5rem;">
          <FilledButton @click="showAddContactDialog = true">
            Agregar contacto
          </FilledButton>
        </div>
      </v-card>
    </v-dialog>
    <AddContactDialog
      v-model="showAddContactDialog"
      @contact-added="fetchContacts"
    />

    <!-- Transfer Confirmation Dialog -->
    <v-dialog 
      v-model="showConfirmDialog" 
      width="650"
      :retain-focus="false"
      :scrim="true"
    >
      <v-card class="confirm-transfer-dialog" width="100%">
        <div class="confirm-transfer-header">
          <span class="confirm-transfer-title">Confirmar transferencia</span>
          <v-btn icon class="dialog-close-btn" @click="showConfirmDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="confirm-transfer-content">
          <div class="confirm-transfer-table">
            <div class="confirm-transfer-row">
              <span class="confirm-transfer-label">Destinatario:</span>
              <span class="confirm-transfer-value">{{ recipientFirstName }} {{ recipientLastName }}</span>
            </div>
            <div class="confirm-transfer-row">
              <span class="confirm-transfer-label">Monto:</span>
              <span class="confirm-transfer-value">${{ formatNumber(amount) }}</span>
            </div>
            <div class="confirm-transfer-row" v-if="reason">
              <span class="confirm-transfer-label">Motivo:</span>
              <span class="confirm-transfer-value">{{ reason }}</span>
            </div>
          </div>
          <div class="confirm-transfer-actions">
            <FilledButton class="confirm-transfer-btn" @click="confirmTransfer">
              Confirmar
            </FilledButton>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400px">
      <v-card class="success-dialog">
        <div class="success-dialog-header">
          <v-btn icon class="dialog-close-btn" @click="showSuccessDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="success-dialog-content">
          <v-icon color="success" size="48">mdi-check-circle</v-icon>
          <div class="success-dialog-title">¡Transferencia realizada con éxito!</div>
          <div class="success-dialog-message">La transferencia fue completada correctamente.</div>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/store/auth'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'
import AddContactDialog from '@/components/AddContactDialog.vue'
import BackButton from '@/components/ui/BackButton.vue'
import { v4 as uuidv4 } from 'uuid'

interface Contact {
  id: string;
  name: string;
  username: string;
  emailOrAccount: string;
}

interface ContactData {
  contact_id: string;
  contacts: {
    first_name: string;
    last_name: string;
    username: string;
    account: Array<{ account_number: string }> | null;
  };
}

const recipient = ref('')
const amount = ref('')
const reason = ref('')
const showConfirmDialog = ref(false)
const showContactDialog = ref(false)
const errorMessage = ref('')
const recipientFirstName = ref('')
const recipientLastName = ref('')
const showSuccessDialog = ref(false)
const contacts = ref<Contact[]>([])
const loading = ref(false)
const showAddContactDialog = ref(false)

const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id)

async function fetchContacts() {
  if (!userId.value) return;
  
  try {
    const { data, error } = await supabase
      .from('user_contacts')
      .select(`
        contact_id,
        contacts:users!user_contacts_contact_id_fkey (
          first_name,
          last_name,
          username
        )
      `)
      .eq('user_id', userId.value);

    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }

    if (data) {
      contacts.value = data.map(contact => {
        const contactData = contact as unknown as ContactData;
        return {
          id: contactData.contact_id,
          name: `${contactData.contacts.first_name} ${contactData.contacts.last_name}`,
          username: contactData.contacts.username,
          emailOrAccount: contactData.contacts.username
        };
      });
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
  }
}

onMounted(fetchContacts);

function selectContact(contact: any) {
  recipient.value = contact.emailOrAccount
  showContactDialog.value = false
}

const isTransferValid = computed(() => {
  const n = parseFloat(amount.value)
  const recipientValue = recipient.value.trim()
  if (isNaN(n) || n <= 0) return false
  if (!recipientValue) return false
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  const accountRegex = /^\d{12}$/
  return usernameRegex.test(recipientValue) || accountRegex.test(recipientValue)
})

function formatAmount() {
  // Remove any non-digit characters
  let value = amount.value.replace(/\D/g, '')
  // Limit to 10 digits
  value = value.slice(0, 10)
  amount.value = value
}

function formatNumber(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

async function handleTransfer() {
  errorMessage.value = ''
  recipientFirstName.value = ''
  recipientLastName.value = ''
  const n = parseFloat(amount.value)
  const recipientValue = recipient.value.trim()
  if (isNaN(n) || n <= 0) {
    errorMessage.value = 'El monto debe ser mayor a cero.'
    return
  }
  if (!recipientValue) {
    errorMessage.value = 'Debes ingresar un usuario o número de cuenta.'
    return
  }
  // Get sender user id
  const senderId = userId.value
  if (!senderId) {
    errorMessage.value = 'Usuario no autenticado.'
    return
  }
  // Find recipient user id
  let recipientUserId = null
  let recipientUsername = null
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  const accountRegex = /^\d{12}$/
  if (accountRegex.test(recipientValue)) {
    // Lookup by account number, then join to users for names
    const { data, error } = await supabase
      .from('accounts')
      .select('user_id, users(first_name, last_name)')
      .eq('account_number', recipientValue)
      .single()
    if (error || !data) {
      errorMessage.value = 'No se encontró una cuenta con ese número.'
      return
    }
    recipientUserId = data.user_id
    let userObj = data.users
    if (Array.isArray(userObj)) userObj = userObj[0]
    if (
      userObj &&
      typeof userObj === 'object' &&
      'first_name' in userObj &&
      'last_name' in userObj
    ) {
      recipientFirstName.value = (userObj as any).first_name || ''
      recipientLastName.value = (userObj as any).last_name || ''
    } else {
      recipientFirstName.value = ''
      recipientLastName.value = ''
    }
  } else if (usernameRegex.test(recipientValue)) {
    // Lookup by username
    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, last_name')
      .eq('username', recipientValue)
      .single()
    if (error || !data) {
      errorMessage.value = 'No se encontró un usuario con ese nombre.'
      return
    }
    recipientUserId = data.id
    recipientUsername = data.username
    recipientFirstName.value = data.first_name || ''
    recipientLastName.value = data.last_name || ''
  } else {
    errorMessage.value = 'Usuario o número de cuenta inválido.'
    return
  }
  // Not self
  if (recipientUserId === senderId) {
    errorMessage.value = 'No puedes transferirte a ti mismo.'
    return
  }
  // Check sender balance
  const { data: senderAccount, error: senderError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', senderId)
    .single()
  if (senderError || !senderAccount) {
    errorMessage.value = 'No se pudo obtener tu cuenta.'
    return
  }
  if (senderAccount.balance < n) {
    errorMessage.value = 'Saldo insuficiente.'
    return
  }
  // All checks passed
  showConfirmDialog.value = true
}

async function confirmTransfer() {
  if (!amount.value || !recipient.value || !userId.value) return
  const n = parseFloat(amount.value)
  const senderId = userId.value
  let recipientId = null
  // Find recipient user id again (should be cached, but for safety)
  const recipientValue = recipient.value.trim()
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  const accountRegex = /^\d{12}$/
  if (accountRegex.test(recipientValue)) {
    const { data } = await supabase
      .from('accounts')
      .select('user_id')
      .eq('account_number', recipientValue)
      .single()
    recipientId = data?.user_id
  } else if (usernameRegex.test(recipientValue)) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('username', recipientValue)
      .single()
    recipientId = data?.id
  }
  if (!recipientId) {
    errorMessage.value = 'No se pudo encontrar el destinatario.'
    return
  }
  // Get sender and recipient account ids and balances
  const { data: senderAccount } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', senderId)
    .single()
  const { data: recipientAccount } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', recipientId)
    .single()
  if (!senderAccount || !recipientAccount) {
    errorMessage.value = 'No se pudo obtener la cuenta de origen o destino.'
    return
  }
  // Perform atomic transfer using a PostgREST RPC or multiple requests (simulate transaction)
  // 1. Subtract from sender
  const { error: senderUpdateError } = await supabase
    .from('accounts')
    .update({ balance: senderAccount.balance - n })
    .eq('id', senderAccount.id)
  // 2. Add to recipient
  const { error: recipientUpdateError } = await supabase
    .from('accounts')
    .update({ balance: recipientAccount.balance + n })
    .eq('id', recipientAccount.id)
  // 3. Insert transaction
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      id: uuidv4(),
      user_id: senderId,
      recipient_id: recipientId,
      description: reason.value || '',
      transaction_type: 'transfer',
      amount: Number(n),
      created_at: new Date(),
    })
  if (senderUpdateError || recipientUpdateError || transactionError) {
    errorMessage.value = 'Error al realizar la transferencia. Intenta de nuevo.'
    return
  }
  // Success
  showConfirmDialog.value = false
  recipient.value = ''
  amount.value = ''
  reason.value = ''
  errorMessage.value = ''
  showSuccessDialog.value = true
}

async function removeContact(contactId: string) {
  if (!userId.value) return;
  
  try {
    const { error } = await supabase
      .from('user_contacts')
      .delete()
      .eq('user_id', userId.value)
      .eq('contact_id', contactId);

    if (error) {
      console.error('Error removing contact:', error);
      return;
    }

    // Refresh contacts list
    await fetchContacts();
  } catch (error) {
    console.error('Error removing contact:', error);
  }
}
</script>

<style scoped>
.transfer-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: var(--background);
  position: relative;
  padding-top: 1rem;
}

.transfer-back-btn {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 1;
}

.transfer-content {
  margin: 0 auto;
  margin-top: 24px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.transfer-title {
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2.2rem;
  font-family: var(--font-sans), sans-serif;
  color: var(--text);
}

.transfer-form-group {
  margin-bottom: 0.4rem;
  width: 100%;
  max-width: 400px;
}
.transfer-form-group:last-of-type {
  margin-bottom: 0;
}
.transfer-recipient-input,
.transfer-amount-input,
.transfer-reason-input {
  width: 100%;
  max-width: 400px;
}
.transfer-continue-btn {
  margin-top: 0.4rem;
  font-size: 1.1rem;
  font-weight: 700;
  height: 50px;
  width: 100%;
  max-width: 400px;
  align-self: center;
}

.recipient-contact-btn {
  background: transparent !important;
  color: var(--muted-text) !important;
  box-shadow: none !important;
  min-width: 36px;
  min-height: 36px;
  padding: 0;
}

.confirm-transfer-dialog {
  border-radius: 2rem !important;
  overflow: visible;
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.10);
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  padding: 2rem 3rem;
}

.confirm-transfer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 1rem 0;
}

.confirm-transfer-title {
  font-size: 1.4rem;
  font-weight: 700;
  font-family: var(--font-sans), sans-serif;
}

.confirm-transfer-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.confirm-transfer-table {
  background: var(--card);
  border-radius: 1.5rem;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  width: 100%;
  box-shadow: 0 1px 6px 0 rgba(60,60,60,0.06);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.confirm-transfer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
}

.confirm-transfer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.confirm-transfer-btn {
  min-width: 200px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 1.5rem;
  padding: 0.8rem 2rem;
}

.select-contact-dialog {
  border-radius: 1.5rem !important;
  overflow: visible;
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.10);
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 3rem;
}
.select-contact-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 1rem 0;
}
.select-contact-title {
  font-size: 1.4rem;
  font-weight: 700;
  font-family: var(--font-sans), sans-serif;
}
.select-contact-list-custom {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  margin: 1.5rem 0;
  width: 100%;
  padding-right: 0.5rem;
}
.select-contact-custom {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border-radius: 14px;
  border: 2px solid #e0e0e0;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
  position: relative;
}
.select-contact-custom:hover {
  border-color: var(--primary);
  background: #f0f4f8;
}
.select-contact-avatar {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-right: 1.5rem;
  color: var(--primary);
}
.select-contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  cursor: pointer;
}
.select-contact-name {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.select-contact-detail {
  font-size: 1rem;
  color: var(--muted-text);
  margin-top: 0.2rem;
}
.transfer-error-message {
  color: #E53935;
  font-size: 1.02rem;
  margin-top: 0.7rem;
  margin-bottom: 0.5rem;
  text-align: center;
  font-family: var(--font-sans, sans-serif);
}
.success-dialog {
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
}

.success-dialog-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.dialog-close-btn {
  color: var(--muted-text) !important;
  margin-right: -8px;
}

.success-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  padding: 0 1rem 1rem;
}
.success-dialog-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary);
  margin-top: 0.5rem;
}
.success-dialog-message {
  font-size: 1.05rem;
  color: var(--text);
  margin-bottom: 1rem;
}
.success-dialog-btn {
  min-width: 120px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 1.5rem;
  padding: 0.7rem 2rem;
  margin-top: 0.5rem;
}

.remove-contact-btn {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.remove-contact-btn:hover {
  opacity: 1;
}

.no-contacts-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 14px;
  border: 2px dashed #e0e0e0;
  width: 100%;
  gap: 1rem;
}

.no-contacts-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
}

.no-contacts-subtitle {
  font-size: 1.05rem;
  color: var(--muted-text);
  font-family: var(--font-sans), sans-serif;
}
</style> 