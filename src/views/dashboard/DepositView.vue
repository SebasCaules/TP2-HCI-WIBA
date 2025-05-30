<template>
  <v-container class="deposit-container" fluid>
    <BackButton to="/dashboard" class="back-btn-top-left" />
    <div class="deposit-content">
      <h1 class="deposit-title">Depositar</h1>
      <div class="deposit-form-group">
        <CustomTextField
          v-model="amount"
          type="number"
          placeholder="Monto"
          class="deposit-amount-input"
          @input="formatAmount"
        />
      </div>
      <div class="deposit-form-group">
        <button type="button" class="deposit-method-box" @click="showCardDialog = true">
          <img :src="selectedCard?.logo" :alt="selectedCard?.brand" class="deposit-card-logo" v-if="selectedCard" />
          <span class="deposit-method-text" v-if="selectedCard">
            <b>{{ selectedCard.brand }}</b> *{{ selectedCard.number_last4 }}
          </span>
          <span class="deposit-method-text" v-else>
            Selecciona una tarjeta
          </span>
          <v-icon class="deposit-select-icon">mdi-chevron-right</v-icon>
        </button>
      </div>
      <FilledButton class="deposit-continue-btn" @click="handleDeposit" :disabled="!isAmountValid">
        Continuar
      </FilledButton>
    </div>

    <!-- Card Selection Dialog -->
    <v-dialog 
      v-model="showCardDialog" 
      max-width="960px" 
      :retain-focus="false"
      :scrim="true"
    >
      <v-card class="select-card-dialog">
        <div class="dialog-header">
          <span class="dialog-title">Seleccionar tarjeta</span>
          <v-btn icon class="dialog-close-btn" @click="showCardDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="select-card-list-custom">
          <template v-if="cards.length > 0">
            <div
              v-for="card in cards"
              :key="card.id"
              class="select-card-custom"
              :class="{ selected: selectedCard && selectedCard.id === card.id }"
              @click="selectCard(card)"
            >
              <img :src="card.logo" :alt="card.brand" class="select-card-logo" />
              <div class="select-card-info">
                <div class="select-card-brand">{{ card.brand }} *{{ card.number_last4 }}</div>
                <div class="select-card-expiry">Vence {{ card.expiry }}</div>
              </div>
              <v-icon v-if="selectedCard && selectedCard.id === card.id" color="primary" class="select-card-check">mdi-check-circle</v-icon>
            </div>
          </template>
          <div v-else class="no-cards-message">
            <v-icon size="48" color="primary">mdi-credit-card-outline</v-icon>
            <div class="no-cards-title">No tienes tarjetas guardadas</div>
            <div class="no-cards-subtitle">Agrega una tarjeta para realizar depósitos</div>
          </div>
        </div>
        <v-card-actions class="select-card-actions">
          <FilledButton class="add-card-btn" @click="showAddCardDialog = true">
            Agregar tarjeta
          </FilledButton>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Card Dialog (use component) -->
    <AddCardDialog
      :model-value="showAddCardDialog"
      @update:model-value="showAddCardDialog = $event"
      @card-added="fetchCards"
    />

    <!-- Deposit Confirmation Dialog -->
    <v-dialog 
      v-model="showConfirmDialog" 
      width="650"
      :retain-focus="false"
      :scrim="true"
    >
      <v-card class="confirm-deposit-dialog" width="100%">
        <div class="dialog-header">
          <span class="dialog-title">Confirmar depósito</span>
          <v-btn icon class="dialog-close-btn" @click="showConfirmDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="confirm-deposit-content">
          <div class="confirm-deposit-table">
            <div class="confirm-deposit-row">
              <span class="confirm-deposit-label">Monto:</span>
              <span class="confirm-deposit-value">${{ formatNumber(amount) }}</span>
            </div>
            <div class="confirm-deposit-row">
              <span class="confirm-deposit-label">Método de pago:</span>
              <div class="confirm-deposit-card">
                <img :src="selectedCard?.logo" :alt="selectedCard?.brand" class="confirm-deposit-card-logo" />
                <span class="confirm-deposit-card-text">
                  {{ selectedCard?.brand }} *{{ selectedCard?.number_last4 }}
                </span>
              </div>
            </div>
          </div>
          <div class="confirm-deposit-actions">
            <FilledButton class="confirm-deposit-btn" @click="confirmDeposit">
              Confirmar
            </FilledButton>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Success Dialog -->
    <SuccessDialog
      v-model="showSuccessDialog"
      title="¡Depósito realizado con éxito!"
      message="El depósito fue completado correctamente."
    />
    
    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSecurityStore } from '@/stores/securityStore'
import { useCardsStore } from '@/stores/cardsStore'
import { useAccountStore } from '@/stores/accountStore'
import type { Payment } from '@/api/payment'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'
import AddCardDialog from '@/components/AddCardDialog.vue'
import BackButton from '@/components/ui/BackButton.vue'
import { usePaymentStore } from '@/stores/paymentStore'
import SuccessDialog from '@/components/dialogs/SuccessDialog.vue'

interface DisplayCard {
  id: string
  brand: string
  number_last4: string
  expiry: string
  holder: string
  logo: string
}

const amount = ref('')
const showCardDialog = ref(false)
const showAddCardDialog = ref(false)
const selectedCard = ref<DisplayCard | null>(null)
const showConfirmDialog = ref(false)
const showSuccessDialog = ref(false)
const loading = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const securityStore = useSecurityStore()
const cardsStore = useCardsStore()
const accountStore = useAccountStore()
const userId = computed(() => securityStore.user?.id)
const paymentStore = usePaymentStore()

const cards = computed<DisplayCard[]>(() => {
  if (!cardsStore.cards) return []
  return cardsStore.cards.map(card => {
    const cardType = card.type === 'CREDIT' ? 'Crédito' : 'Débito'
    const last4 = card.number.match(/\d{4}$/)?.[0] || ''
    return {
      id: String(card.id),
      brand: card.metadata?.brand || getCardBrand(card.number),
      number_last4: last4,
      expiry: card.expirationDate,
      holder: card.fullName,
      logo: getBrandLogo(card.metadata?.brand || getCardBrand(card.number))
    }
  })
})

const isAmountValid = computed(() => {
  const n = parseFloat(amount.value)
  return !isNaN(n) && n > 0
})

function getCardBrand(number: string) {
  const n = number.replace(/\D/g, '')
  if (n.startsWith('4')) return 'Visa'
  if (n.startsWith('5') || n.startsWith('2')) return 'Mastercard'
  if (n.startsWith('3')) return 'Amex'
  return 'Desconocida'
}

function getBrandLogo(brand: string) {
  if (brand === 'Visa') return 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png'
  if (brand === 'Mastercard') return 'https://brandlogos.net/wp-content/uploads/2021/11/mastercard-logo.png'
  if (brand === 'Amex') return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg'
  return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
}

function formatAmount() {
  // Remove any non-digit characters except decimal point
  let value = amount.value.replace(/[^\d.]/g, '')
  
  // Ensure only one decimal point
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].slice(0, 2)
  }
  
  // Limit to 10 digits before decimal
  if (parts[0].length > 10) {
    value = parts[0].slice(0, 10) + (parts[1] ? '.' + parts[1] : '')
  }
  
  amount.value = value
}

function formatNumber(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

async function fetchCards() {
  try {
    await cardsStore.fetchCards()
    if (!selectedCard.value && cards.value.length > 0) {
      selectedCard.value = cards.value[0]
    }
  } catch (error) {
    console.error('Error fetching cards:', error)
  }
}

function selectCard(card: DisplayCard) {
  selectedCard.value = card
  showCardDialog.value = false
}

function handleDeposit() {
  if (!amount.value) return
  showConfirmDialog.value = true
}

const payments = computed<Payment[]>(() => {
  if (!paymentStore.payments?.results) return []
  return paymentStore.payments.results
})

async function confirmDeposit() {
  if (!securityStore.user) {
    showSnackbar.value = true
    snackbarText.value = 'Error: No hay usuario autenticado'
    snackbarColor.value = 'error'
    return
  }
  
  if (!amount.value || amount.value.trim() === '') {
    showSnackbar.value = true
    snackbarText.value = 'Por favor ingrese un monto'
    snackbarColor.value = 'error'
    return
  }

  const parsedAmount = Number(amount.value)
  if (!Number.isFinite(parsedAmount) || isNaN(parsedAmount) || parsedAmount <= 0) {
    showSnackbar.value = true
    snackbarText.value = 'El monto ingresado no es válido'
    snackbarColor.value = 'error'
    return
  }

  try {
    loading.value = true
    // Primero creamos el pago
    const payment = await paymentStore.createPayment({
      amount: parsedAmount,
      description: `Depósito a cuenta (*${selectedCard.value?.number_last4})`,
      metadata: {
        cardId: selectedCard.value?.id,
        cardBrand: selectedCard.value?.brand
      }
    })

    // Luego recargamos la cuenta
    await accountStore.recharge(parsedAmount)
    
    showConfirmDialog.value = false
    amount.value = ''
    showSuccessDialog.value = true
    
    await paymentStore.fetchPayments()
  } catch (error) {
    showSnackbar.value = true
    snackbarText.value = error instanceof Error ? error.message : 'Error al realizar el depósito'
    snackbarColor.value = 'error'
  } finally {
    loading.value = false
  }
}

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Monto', key: 'amount' },
  { title: 'Estado', key: 'status' },
  { title: 'Fecha', key: 'created_at' },
  { title: 'Acciones', key: 'actions', sortable: false }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'error'
    default:
      return 'grey'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'completed':
      return 'Completado'
    case 'pending':
      return 'Pendiente'
    case 'failed':
      return 'Fallido'
    default:
      return status
  }
}

async function handlePushDeposit(paymentId: number) {
  loading.value = true
  try {
    const payment = await paymentStore.getPaymentById(paymentId)
    if (!payment) {
      throw new Error('Pago no encontrado')
    }
    await paymentStore.confirmPayment(payment.uuid, selectedCard.value?.id)
    showSnackbar.value = true
    snackbarText.value = 'Depósito completado correctamente'
    snackbarColor.value = 'success'
    await paymentStore.fetchPayments()
  } catch (error) {
    showSnackbar.value = true
    snackbarText.value = error instanceof Error ? error.message : 'Error al completar el depósito'
    snackbarColor.value = 'error'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchCards()
  await paymentStore.fetchPayments()
})
</script>

<style scoped>
.deposit-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: var(--background);
  position: relative;
  padding-top: 1rem;
}

.back-btn-top-left {
  position: absolute;
  top: 32px;
  left: 32px;
  z-index: 10;
}

.deposit-content {
  margin: 0 auto;
  margin-top: 24px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.deposit-title {
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2.2rem;
  font-family: var(--font-sans), sans-serif;
  color: var(--text);
}

.deposit-form-group {
  margin-bottom: 0.4rem;
  width: 100%;
  max-width: 400px;
}

.deposit-form-group:last-of-type {
  margin-bottom: 0;
}

.deposit-label {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
  display: block;
  font-family: var(--font-sans), sans-serif;
}

.deposit-amount-input {
  width: 100%;
  max-width: 400px;
}

.deposit-method-box {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: transparent;
  height: 48px;
  padding: 0 1.1rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.18s;
  font-size: 1.06rem;
  font-family: var(--font-sans, sans-serif);
  cursor: pointer;
  outline: none;
  gap: 0.8rem;
}

.deposit-method-box:hover,
.deposit-method-box:focus {
  border-color: var(--primary);
}

.deposit-card-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: flex;
  align-items: center;
}

.deposit-method-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  flex: 1;
  font-family: var(--font-sans), sans-serif;
  display: flex;
  align-items: center;
  height: 100%;
}

.deposit-select-icon {
  color: var(--muted-text);
  margin-left: auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.deposit-continue-btn {
  margin-top: 1.5rem;
  width: 100%;
  max-width: 400px;
  align-self: center;
}

.deposit-continue-btn :deep(.v-btn) {
  font-size: 1.1rem;
  font-weight: 700;
  height: 50px;
  width: 100%;
}

.select-card-dialog {
  border-radius: 2rem !important;
  overflow: visible;
  box-shadow: var(--shadow-card);
  max-width: 960px;
  margin: 0 auto;
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

.select-card-list-custom {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  margin: 1.5rem 0;
  width: 100%;
  padding-right: 0.5rem;
}

.select-card-custom {
  width: 100%;
  display: flex;
  align-items: center;
  background: var(--input);
  border-radius: 14px;
  border: 2px solid var(--card-border);
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
  position: relative;
}

.select-card-custom.selected {
  border-color: var(--primary);
  background: var(--muted);
}

.select-card-custom:hover {
  border-color: var(--primary);
  background: var(--card);
}

.select-card-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-right: 1.5rem;
}

.select-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.select-card-brand {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.select-card-brand b {
  font-weight: 700;
}

.select-card-expiry {
  font-size: 1rem;
  color: var(--muted-text);
  margin-top: 0.2rem;
}

.select-card-check {
  font-size: 1.8rem;
  margin-left: 1.5rem;
}

.select-card-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 0 0 0;
}

.add-card-btn {
  min-width: 200px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 1.5rem;
  padding: 0.8rem 2rem;
}

.confirm-deposit-dialog {
  border-radius: 2rem !important;
  overflow: visible;
  box-shadow: var(--shadow-card);
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  padding: 2rem 3rem;
}

.confirm-deposit-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.confirm-deposit-table {
  background: var(--card);
  border-radius: 1.5rem;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  width: 100%;
  box-shadow: var(--shadow-card-light);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.confirm-deposit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
}

.confirm-deposit-card {
  display: flex;
  align-items: center;
}

.confirm-deposit-card-logo {
  width: 32px;
  height: 32px;
  max-width: 32px;
  max-height: 32px;
  object-fit: contain;
  margin-right: 0.5rem;
  flex-shrink: 0;
  flex-grow: 0;
}

.confirm-deposit-card-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
}

.confirm-deposit-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.confirm-deposit-btn {
  min-width: 200px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 1.5rem;
  padding: 0.8rem 2rem;
}

.no-cards-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background: var(--input);
  border-radius: 14px;
  border: 2px dashed var(--card-border-dashed);
  width: 100%;
  gap: 1rem;
}

.no-cards-icon {
  color: var(--primary);
}
.no-cards-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
}

.no-cards-subtitle {
  font-size: 1.05rem;
  color: var(--muted-text);
  font-family: var(--font-sans), sans-serif;
}

/* Remove old header styles */
.select-card-dialog-header,
.confirm-deposit-header,
.success-dialog-header {
  display: none;
}

.select-card-title,
.confirm-deposit-title,
.success-dialog-title {
  display: none;
}
</style> 